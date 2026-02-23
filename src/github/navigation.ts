type Cleanup = () => void
type MountFn = () => Cleanup

// turbo:load and pjax:end fire on document; popstate fires on window
const DOC_EVENTS = ['turbo:load', 'pjax:end'] as const
const WIN_EVENTS = ['popstate'] as const

/**
 * Sets up soft-navigation listeners so the extension re-mounts after
 * GitHub's Turbo/Pjax page transitions. Calls `mount()` immediately on
 * setup and then after each navigation event.
 *
 * Returns a teardown function that removes all listeners and runs the
 * last mount's cleanup.
 */
export function setupNavigation(mount: MountFn): Cleanup {
  let currentCleanup: Cleanup = mount()

  function handleNavigation(): void {
    currentCleanup()
    currentCleanup = mount()
  }

  for (const event of DOC_EVENTS) {
    document.addEventListener(event, handleNavigation)
  }
  for (const event of WIN_EVENTS) {
    window.addEventListener(event, handleNavigation)
  }

  return () => {
    currentCleanup()
    for (const event of DOC_EVENTS) {
      document.removeEventListener(event, handleNavigation)
    }
    for (const event of WIN_EVENTS) {
      window.removeEventListener(event, handleNavigation)
    }
  }
}
