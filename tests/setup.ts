import '@testing-library/jest-dom'

// jsdom doesn't implement canvas — stub getContext so measureLabelWidth falls
// through to its character-width heuristic without printing warnings.
HTMLCanvasElement.prototype.getContext = () => null

// jsdom doesn't implement matchMedia — stub it so useTheme can call it.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
