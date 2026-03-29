// SVG dimensions — shared constants used by all chart components
export const SVG_WIDTH = 600
export const SVG_HEIGHT = 200
export const PEAK_HEIGHT = 140
export const BASELINE_Y = 175
// Horizontal padding so points at 0% and 100% are not clipped by the SVG edge
export const CHART_PADDING_X = 24

/**
 * Returns the SVG y-coordinate for a given 0–100 percentage position along the hill.
 * The curve is a half-sine: flat at 0% and 100%, peak at 50%.
 */
export function hillY(
  pct: number,
  baselineY = BASELINE_Y,
  peakHeight = PEAK_HEIGHT,
): number {
  return baselineY - Math.sin((Math.PI * pct) / 100) * peakHeight
}

/**
 * Builds the SVG `d` path attribute string for the hill curve.
 * Uses 200 interpolated points for a smooth curve.
 */
export function buildHillPath(
  svgWidth = SVG_WIDTH,
  baselineY = BASELINE_Y,
  peakHeight = PEAK_HEIGHT,
  steps = 200,
  paddingX = CHART_PADDING_X,
): string {
  const points: string[] = []
  for (let i = 0; i <= steps; i++) {
    const pct = (i / steps) * 100
    const x = paddingX + (pct / 100) * (svgWidth - 2 * paddingX)
    const y = hillY(pct, baselineY, peakHeight)
    points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
  }
  return points.join(' ')
}

/**
 * Converts an SVG x pixel coordinate back to a 0–100 percentage, clamped.
 */
export function svgXToPercent(
  svgX: number,
  svgWidth = SVG_WIDTH,
  paddingX = CHART_PADDING_X,
): number {
  const pct = ((svgX - paddingX) / (svgWidth - 2 * paddingX)) * 100
  return Math.min(100, Math.max(0, pct))
}

/**
 * Returns the rendered pixel width of a label string at the given font size.
 * Uses Canvas 2D measureText in browser contexts; falls back to a
 * character-width heuristic when Canvas is unavailable (e.g. jsdom).
 */
export function measureLabelWidth(text: string, fontSize = 11): number {
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.font = `${fontSize}px sans-serif`
      return ctx.measureText(text).width
    }
  }
  return text.length * fontSize * 0.6
}

/**
 * Converts a 0–100 percentage to an SVG x pixel coordinate.
 */
export function percentToSvgX(
  pct: number,
  svgWidth = SVG_WIDTH,
  paddingX = CHART_PADDING_X,
): number {
  return paddingX + (pct / 100) * (svgWidth - 2 * paddingX)
}
