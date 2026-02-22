/**
 * Content script entry point.
 * Stub implementation: mounts a shadow DOM root to verify the extension loads.
 * Will be replaced with the full React widget in Phase 5.
 */

function mount(): () => void {
  const host = document.createElement('div')
  host.id = 'hillchart-extension-root'
  document.body.appendChild(host)

  const shadow = host.attachShadow({ mode: 'open' })
  const marker = document.createElement('div')
  marker.textContent = 'Hill Chart extension loaded'
  marker.style.cssText = 'display:none'  // hidden — just a DOM marker for tests
  shadow.appendChild(marker)

  return () => {
    host.remove()
  }
}

let cleanup: (() => void) | null = null

function handleNavigation(): void {
  cleanup?.()
  cleanup = null
  cleanup = mount()
}

// Initial load
handleNavigation()

// Turbo Drive navigation (GitHub's SPA stack)
document.addEventListener('turbo:load', handleNavigation)
// Pjax fallback (older GitHub)
document.addEventListener('pjax:end', handleNavigation)
