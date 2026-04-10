export type Theme = 'dark' | 'light'

export function detectGitHubTheme(): Theme {
  const mode = document.documentElement.getAttribute('data-color-mode')
  if (mode === 'light') return 'light'
  if (mode === 'dark') return 'dark'
  // 'auto' — defer to the OS preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
