import { URL_CHANGE_EVENT } from './urlchange-event.js'

type Cleanup = () => void
type MountFn = () => Cleanup

// turbo:load and pjax:end fire on document; popstate fires on window.
// URL_CHANGE_EVENT is dispatched by the MAIN-world pushstate patch
// (injected below) whenever the page calls pushState/replaceState.
const DOC_EVENTS = ['turbo:load', 'pjax:end'] as const
const WIN_EVENTS = ['popstate', URL_CHANGE_EVENT] as const

let historyPatched = false

/**
 * Injects pushstate-patch.js into the MAIN world so it can intercept the
 * page's own pushState/replaceState calls.
 *
 * Chrome: injects via <script src="chrome-extension://…/pushstate-patch.js">.
 * Firefox (MV2): uses wrappedJSObject to patch directly from the content script.
 *
 * Both approaches dispatch a 'hill:urlchange' event on window, which the
 * content script (isolated world) can listen for.
 */
function patchHistory(): void {
  if (historyPatched) return
  historyPatched = true

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chromeRuntime = (globalThis as any).chrome?.runtime
  if (chromeRuntime?.getURL) {
    // Chrome MV3: inject the plain JS file as a <script> tag.
    // It runs in the MAIN world because it's a regular page script.
    const script = document.createElement('script')
    script.src = chromeRuntime.getURL('pushstate-patch.js')
    ;(document.head || document.documentElement).appendChild(script)
    script.onload = () => script.remove()
    return
  }

  // Firefox MV2: content scripts can access the page's main world via
  // wrappedJSObject and exportFunction.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pageWindow = (window as any).wrappedJSObject
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exportFn: ((...args: any[]) => any) | undefined = (globalThis as any).exportFunction
  if (!pageWindow || !exportFn) return

  const eventName = URL_CHANGE_EVENT
  for (const method of ['pushState', 'replaceState'] as const) {
    const original = pageWindow.history[method]
    pageWindow.history[method] = exportFn(function (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: any[]
    ) {
      original.apply(pageWindow.history, args)
      window.dispatchEvent(new Event(eventName))
    }, pageWindow)
  }
}

/**
 * Sets up soft-navigation listeners so the extension re-mounts after
 * GitHub's Turbo/Pjax page transitions. Calls `mount()` immediately on
 * setup and then after each navigation event.
 *
 * Also polls for URL changes as a fallback — other extensions (e.g. Zenhub)
 * may navigate via pushState before our patch is injected, bypassing all
 * event-based detection.
 *
 * Returns a teardown function that removes all listeners and runs the
 * last mount's cleanup.
 */
export function setupNavigation(mount: MountFn): Cleanup {
  patchHistory()
  let currentCleanup: Cleanup = mount()
  let lastHref = location.href

  function handleNavigation(): void {
    lastHref = location.href
    currentCleanup()
    currentCleanup = mount()
  }

  for (const event of DOC_EVENTS) {
    document.addEventListener(event, handleNavigation)
  }
  for (const event of WIN_EVENTS) {
    window.addEventListener(event, handleNavigation)
  }

  const pollId = setInterval(() => {
    if (location.href !== lastHref) {
      lastHref = location.href
      handleNavigation()
    }
  }, 500)

  return () => {
    clearInterval(pollId)
    currentCleanup()
    for (const event of DOC_EVENTS) {
      document.removeEventListener(event, handleNavigation)
    }
    for (const event of WIN_EVENTS) {
      window.removeEventListener(event, handleNavigation)
    }
  }
}
