import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme } from '../../src/hooks/useTheme.js'

const HOST_ID = 'hillchart-extension-root'

function setColorMode(value: string | null) {
  if (value === null) {
    document.documentElement.removeAttribute('data-color-mode')
  } else {
    document.documentElement.setAttribute('data-color-mode', value)
  }
}

/** Creates a matchMedia mock. Call .trigger(dark) to fire change listeners. */
function mockMatchMedia(initiallyDark: boolean) {
  const listeners: Array<(e: { matches: boolean }) => void> = []
  const mq = {
    matches: initiallyDark,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: (_type: string, fn: (e: { matches: boolean }) => void) => {
      listeners.push(fn)
    },
    removeEventListener: (_type: string, fn: (e: { matches: boolean }) => void) => {
      const idx = listeners.indexOf(fn)
      if (idx !== -1) listeners.splice(idx, 1)
    },
    dispatchEvent: () => false,
    trigger(dark: boolean) {
      mq.matches = dark
      for (const fn of listeners) fn({ matches: dark })
    },
  }
  window.matchMedia = vi.fn().mockReturnValue(mq)
  return mq
}

let originalMatchMedia: typeof window.matchMedia

beforeEach(() => {
  originalMatchMedia = window.matchMedia
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
  document.getElementById(HOST_ID)?.remove()
  setColorMode(null)
})

// ── Initial detection ─────────────────────────────────────────────────────────

describe('initial theme detection', () => {
  it('returns dark when data-color-mode is "dark"', () => {
    setColorMode('dark')
    const { result } = renderHook(() => useTheme())
    expect(result.current).toBe('dark')
  })

  it('returns light when data-color-mode is "light"', () => {
    setColorMode('light')
    const { result } = renderHook(() => useTheme())
    expect(result.current).toBe('light')
  })

  it('returns dark when data-color-mode is "auto" and OS prefers dark', () => {
    setColorMode('auto')
    mockMatchMedia(true)
    const { result } = renderHook(() => useTheme())
    expect(result.current).toBe('dark')
  })

  it('returns light when data-color-mode is "auto" and OS prefers light', () => {
    setColorMode('auto')
    mockMatchMedia(false)
    const { result } = renderHook(() => useTheme())
    expect(result.current).toBe('light')
  })

  it('falls back to OS preference when no data-color-mode attribute is set', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useTheme())
    expect(result.current).toBe('dark')
  })
})

// ── Host element class ────────────────────────────────────────────────────────

describe('host element class', () => {
  it('adds light-theme class to host when theme is light', () => {
    setColorMode('light')
    const host = document.createElement('div')
    host.id = HOST_ID
    document.body.appendChild(host)

    renderHook(() => useTheme())

    expect(host.classList.contains('light-theme')).toBe(true)
  })

  it('does not add light-theme class to host when theme is dark', () => {
    setColorMode('dark')
    const host = document.createElement('div')
    host.id = HOST_ID
    document.body.appendChild(host)

    renderHook(() => useTheme())

    expect(host.classList.contains('light-theme')).toBe(false)
  })

  it('does nothing if the host element does not exist', () => {
    setColorMode('light')
    // No host in DOM — should not throw
    expect(() => renderHook(() => useTheme())).not.toThrow()
  })
})

// ── Reactivity ────────────────────────────────────────────────────────────────

describe('reactivity', () => {
  it('updates when data-color-mode attribute changes', async () => {
    setColorMode('dark')
    const { result } = renderHook(() => useTheme())
    expect(result.current).toBe('dark')

    await act(async () => {
      setColorMode('light')
    })

    expect(result.current).toBe('light')
  })

  it('updates when data-color-mode switches back to dark', async () => {
    setColorMode('light')
    const { result } = renderHook(() => useTheme())
    expect(result.current).toBe('light')

    await act(async () => {
      setColorMode('dark')
    })

    expect(result.current).toBe('dark')
  })

  it('updates when OS preference changes in auto mode', async () => {
    setColorMode('auto')
    const mq = mockMatchMedia(false) // start light
    const { result } = renderHook(() => useTheme())
    expect(result.current).toBe('light')

    await act(async () => {
      mq.trigger(true) // switch to dark
    })

    expect(result.current).toBe('dark')
  })

  it('reflects host class change when attribute updates', async () => {
    setColorMode('dark')
    const host = document.createElement('div')
    host.id = HOST_ID
    document.body.appendChild(host)

    renderHook(() => useTheme())
    expect(host.classList.contains('light-theme')).toBe(false)

    await act(async () => {
      setColorMode('light')
    })

    expect(host.classList.contains('light-theme')).toBe(true)
  })
})
