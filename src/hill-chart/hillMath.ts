// SVG dimensions — shared constants used by all chart components
export const SVG_WIDTH = 600
export const SVG_HEIGHT = 200
export const PEAK_HEIGHT = 140
export const BASELINE_Y = 175

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
): string {
  const points: string[] = []
  for (let i = 0; i <= steps; i++) {
    const pct = (i / steps) * 100
    const x = (pct / 100) * svgWidth
    const y = hillY(pct, baselineY, peakHeight)
    points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
  }
  return points.join(' ')
}

/**
 * Converts an SVG x pixel coordinate back to a 0–100 percentage, clamped.
 */
export function svgXToPercent(svgX: number, svgWidth = SVG_WIDTH): number {
  const pct = (svgX / svgWidth) * 100
  return Math.min(100, Math.max(0, pct))
}

/**
 * Converts a 0–100 percentage to an SVG x pixel coordinate.
 */
export function percentToSvgX(pct: number, svgWidth = SVG_WIDTH): number {
  return (pct / 100) * svgWidth
}
