import '@testing-library/jest-dom'

// jsdom doesn't implement canvas — stub getContext so measureLabelWidth falls
// through to its character-width heuristic without printing warnings.
HTMLCanvasElement.prototype.getContext = () => null
