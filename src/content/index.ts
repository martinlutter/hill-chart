/**
 * Content script entry point.
 * Creates a Shadow DOM host, injects scoped CSS, mounts the React widget,
 * and re-mounts on Turbo/Pjax soft-navigation events.
 */

import React from 'react'
import { createRoot } from 'react-dom/client'
import { detectIssuePage, observeIssuePage } from '../github/detector.js'
import { setupNavigation } from '../github/navigation.js'
import { renderInlineCharts, observeInlineCharts } from '../github/inlineRenderer.js'
import { HillChartWidget } from '../components/HillChartWidget.js'
import styles from './styles.css?inline'

function mount(): () => void {
  const page = detectIssuePage()

  if (!page.isIssuePage) {
    // Not a GitHub issue page — nothing to do
    return () => {}
  }

  // Create shadow host
  const host = document.createElement('div')
  host.id = 'hillchart-extension-root'
  document.body.appendChild(host)

  // Attach shadow DOM and inject scoped CSS
  const shadow = host.attachShadow({ mode: 'open' })
  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  shadow.appendChild(styleEl)

  // Prevent keyboard events from leaking out of the shadow DOM
  // so GitHub's single-key shortcuts (e.g. "l", "a", "g") don't fire
  // while the user is typing in our inputs.
  for (const eventType of ['keydown', 'keypress', 'keyup'] as const) {
    shadow.addEventListener(eventType, (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        e.stopPropagation()
      }
    })
  }

  // Prevent pointerdown/mousedown from reaching other extensions (e.g. Zenhub)
  // that use capture-phase "outside click" listeners to close their UI.
  // Composed events cross shadow boundaries, so we intercept them in the
  // capture phase on document and re-dispatch non-composed clones that stay
  // inside the shadow DOM where React's delegated handlers live.
  const captureHandlers: Array<[string, (e: Event) => void]> = []
  for (const eventType of ['pointerdown', 'mousedown'] as const) {
    const handler = (e: Event) => {
      if (!e.composedPath().includes(host)) return

      e.stopImmediatePropagation()

      const Ctor = e instanceof PointerEvent ? PointerEvent : MouseEvent
      ;(e.composedPath()[0] as Element).dispatchEvent(
        new Ctor(e.type, { ...e, composed: false, bubbles: true }),
      )
    }
    document.addEventListener(eventType, handler, true)
    captureHandlers.push([eventType, handler])
  }

  // React render container inside the shadow root
  const container = document.createElement('div')
  shadow.appendChild(container)

  const root = createRoot(container)

  function renderWidget(
    toolbarAnchor: Element | null,
    issueBodyText: string,
  ): void {
    root.render(
      React.createElement(HillChartWidget, {
        issueBodyText,
        toolbarAnchor,
      }),
    )
  }

  renderWidget(page.toolbarAnchor, page.issueBodyText)

  const cleanupInline = renderInlineCharts()
  const cleanupObserver = observeInlineCharts()

  // Watch for the toolbar anchor to appear or change (e.g. GitHub React
  // painting after navigation, or another extension re-creating the DOM).
  const cleanupRetry = observeIssuePage(
    page.toolbarAnchor,
    (ready) => renderWidget(ready.toolbarAnchor, ready.issueBodyText),
  )

  return () => {
    for (const [event, handler] of captureHandlers) {
      document.removeEventListener(event, handler, true)
    }
    cleanupRetry()
    cleanupObserver()
    cleanupInline()
    root.unmount()
    host.remove()
  }
}

setupNavigation(mount)
