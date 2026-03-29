// SVG dimensions — shared constants used by all chart components
export const SVG_WIDTH = 600
export const SVG_HEIGHT = 200
export const PEAK_HEIGHT = 140
export const BASELINE_Y = 175
// Horizontal padding so points at 0% and 100% are not clipped by the SVG edge
export const CHART_PADDING_X = 24
// Vertical distance from point center to label baseline
export const LABEL_OFFSET = 16

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

export interface LabelLayout {
  id: string
  labelX: number
  labelY: number
  cx: number
  cy: number
  /** True when the label was nudged far enough from its point to warrant a connector line */
  hasConnector: boolean
}

/**
 * Resolves label positions for a set of points, pushing overlapping labels
 * apart horizontally until no two labels overlap.
 *
 * Labels are sorted by natural x position and nudged symmetrically outward in
 * iterative passes. A connector flag is set when the label moved more than a
 * small threshold from its natural anchor so callers can draw a tick line.
 */
export function resolveLabels(
  points: Array<{ id: string; cx: number; cy: number; description: string }>,
): LabelLayout[] {
  if (points.length === 0) return []

  const GAP = 4 // minimum gap between adjacent label edges

  const items = points.map((pt) => {
    const halfW = measureLabelWidth(pt.description) / 2
    const naturalX = Math.max(halfW, Math.min(SVG_WIDTH - halfW, pt.cx))
    return { id: pt.id, cx: pt.cx, cy: pt.cy, halfW, labelX: naturalX, naturalX }
  })

  // Work in sorted order so each pass only needs to check neighbours
  items.sort((a, b) => a.naturalX - b.naturalX)

  for (let pass = 0; pass < 30; pass++) {
    let moved = false
    for (let i = 0; i < items.length - 1; i++) {
      const a = items[i]
      const b = items[i + 1]
      const needed = a.halfW + b.halfW + GAP
      const actual = b.labelX - a.labelX
      if (actual < needed) {
        const push = (needed - actual) / 2
        a.labelX -= push
        b.labelX += push
        moved = true
      }
    }
    if (!moved) break
    // Clamp to full SVG width (including side padding) after each pass
    for (const item of items) {
      item.labelX = Math.max(item.halfW, Math.min(SVG_WIDTH - item.halfW, item.labelX))
    }
  }

  return items.map((item) => ({
    id: item.id,
    labelX: item.labelX,
    labelY: item.cy - LABEL_OFFSET,
    cx: item.cx,
    cy: item.cy,
    hasConnector: Math.abs(item.labelX - item.naturalX) > 8,
  }))
}
