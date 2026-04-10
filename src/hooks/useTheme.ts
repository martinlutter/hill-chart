import { useState, useEffect } from 'react'
import { type Theme, detectGitHubTheme } from '../utils/theme.js'

export type { Theme }

const HOST_ID = 'hillchart-extension-root'

export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(detectGitHubTheme)

  useEffect(() => {
    // Watch GitHub's theme attribute changes (user switches theme in settings)
    const attrObserver = new MutationObserver(() => setTheme(detectGitHubTheme()))
    attrObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-color-mode'],
    })

    // Watch OS-level preference changes (relevant when data-color-mode is 'auto')
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const onMediaChange = () => setTheme(detectGitHubTheme())
    mediaQuery.addEventListener('change', onMediaChange)

    return () => {
      attrObserver.disconnect()
      mediaQuery.removeEventListener('change', onMediaChange)
    }
  }, [])

  useEffect(() => {
    const host = document.getElementById(HOST_ID)
    if (host) host.classList.toggle('light-theme', theme === 'light')
  }, [theme])

  return theme
}
