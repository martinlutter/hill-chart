import { describe, it, expect } from 'vitest'
import {
  hillY,
  buildHillPath,
  svgXToPercent,
  percentToSvgX,
  resolveLabels,
  measureLabelWidth,
  SVG_WIDTH,
  BASELINE_Y,
  PEAK_HEIGHT,
  CHART_PADDING_X,
  LABEL_OFFSET,
} from '../../src/hill-chart/hillMath.js'

describe('hillY', () => {
  it('returns baselineY at pct=0 (start of hill)', () => {
    expect(hillY(0)).toBeCloseTo(BASELINE_Y)
  })

  it('returns baselineY at pct=100 (end of hill)', () => {
    expect(hillY(100)).toBeCloseTo(BASELINE_Y)
  })

  it('returns baseline − peakHeight at pct=50 (top of hill)', () => {
    expect(hillY(50)).toBeCloseTo(BASELINE_Y - PEAK_HEIGHT)
  })

  it('is symmetric: hillY(25) === hillY(75)', () => {
    expect(hillY(25)).toBeCloseTo(hillY(75))
  })

  it('uses provided baselineY and peakHeight overrides', () => {
    expect(hillY(50, 200, 100)).toBeCloseTo(100)
    expect(hillY(0, 200, 100)).toBeCloseTo(200)
  })
})

describe('buildHillPath', () => {
  it('starts with an M command', () => {
    expect(buildHillPath()).toMatch(/^M/)
  })

  it('contains L commands after the first point', () => {
    expect(buildHillPath()).toMatch(/L/)
  })

  it('produces a non-empty path string', () => {
    const path = buildHillPath()
    expect(path.length).toBeGreaterThan(0)
  })

  it('starts at x=CHART_PADDING_X', () => {
    const path = buildHillPath()
    expect(path).toMatch(new RegExp(`^M${CHART_PADDING_X.toFixed(2)}`))
  })

  it('ends at x=SVG_WIDTH - CHART_PADDING_X', () => {
    const path = buildHillPath(SVG_WIDTH)
    const endX = (SVG_WIDTH - CHART_PADDING_X).toFixed(2)
    expect(path).toMatch(new RegExp(`L${endX}`))
  })
})

describe('svgXToPercent', () => {
  it('converts CHART_PADDING_X → 0', () => {
    expect(svgXToPercent(CHART_PADDING_X)).toBe(0)
  })

  it('converts SVG_WIDTH - CHART_PADDING_X → 100', () => {
    expect(svgXToPercent(SVG_WIDTH - CHART_PADDING_X)).toBe(100)
  })

  it('converts midpoint → 50', () => {
    expect(svgXToPercent(SVG_WIDTH / 2)).toBeCloseTo(50)
  })

  it('clamps values left of padding to 0', () => {
    expect(svgXToPercent(0)).toBe(0)
  })

  it('clamps values beyond svgWidth to 100', () => {
    expect(svgXToPercent(SVG_WIDTH + 999)).toBe(100)
  })
})

describe('percentToSvgX', () => {
  it('converts 0 → CHART_PADDING_X', () => {
    expect(percentToSvgX(0)).toBe(CHART_PADDING_X)
  })

  it('converts 100 → SVG_WIDTH - CHART_PADDING_X', () => {
    expect(percentToSvgX(100)).toBe(SVG_WIDTH - CHART_PADDING_X)
  })

  it('round-trips with svgXToPercent', () => {
    const pct = 37
    expect(svgXToPercent(percentToSvgX(pct))).toBeCloseTo(pct)
  })
})

describe('resolveLabels', () => {
  const pt = (id: string, x: number, description: string) => ({
    id,
    cx: percentToSvgX(x),
    cy: hillY(x, BASELINE_Y, PEAK_HEIGHT),
    description,
  })

  it('returns empty array for no points', () => {
    expect(resolveLabels([])).toEqual([])
  })

  it('returns one entry per input point with matching id', () => {
    const layouts = resolveLabels([pt('a', 25, 'Alpha'), pt('b', 75, 'Beta')])
    const ids = layouts.map((l) => l.id).sort()
    expect(ids).toEqual(['a', 'b'])
  })

  it('sets labelY to cy − LABEL_OFFSET', () => {
    const input = pt('a', 50, 'Hi')
    const [layout] = resolveLabels([input])
    expect(layout.labelY).toBeCloseTo(input.cy - LABEL_OFFSET)
  })

  it('preserves cx and cy on each layout entry', () => {
    const input = pt('a', 30, 'Test')
    const [layout] = resolveLabels([input])
    expect(layout.cx).toBeCloseTo(input.cx)
    expect(layout.cy).toBeCloseTo(input.cy)
  })

  it('single centered point: label at natural cx, no connector', () => {
    const input = pt('a', 50, 'Hi')
    const [layout] = resolveLabels([input])
    // halfW of 'Hi' (2 chars) = 2 * 6.6 = 13.2; cx=300 is well inside bounds
    expect(layout.labelX).toBeCloseTo(input.cx)
    expect(layout.hasConnector).toBe(false)
  })

  it('single point at x=0 with long label: label clamped inside left bound', () => {
    const desc = 'A very long label text'
    const input = pt('a', 0, desc)
    const halfW = measureLabelWidth(desc) / 2
    const [layout] = resolveLabels([input])
    expect(layout.labelX).toBeGreaterThanOrEqual(CHART_PADDING_X + halfW - 0.01)
    expect(layout.labelX).toBeLessThanOrEqual(SVG_WIDTH - CHART_PADDING_X)
  })

  it('single point at x=100 with long label: label clamped inside right bound', () => {
    const desc = 'A very long label text'
    const input = pt('a', 100, desc)
    const halfW = measureLabelWidth(desc) / 2
    const [layout] = resolveLabels([input])
    expect(layout.labelX).toBeLessThanOrEqual(SVG_WIDTH - CHART_PADDING_X - halfW + 0.01)
    expect(layout.labelX).toBeGreaterThanOrEqual(CHART_PADDING_X)
  })

  it('two well-separated points keep their natural positions and no connectors', () => {
    const layouts = resolveLabels([pt('a', 5, 'Left'), pt('b', 95, 'Right')])
    const a = layouts.find((l) => l.id === 'a')!
    const b = layouts.find((l) => l.id === 'b')!
    // Natural cx for x=5 and x=95 are far apart — no nudging needed
    expect(a.labelX).toBeCloseTo(percentToSvgX(5))
    expect(b.labelX).toBeCloseTo(percentToSvgX(95))
    expect(a.hasConnector).toBe(false)
    expect(b.hasConnector).toBe(false)
  })

  it('two coincident points are pushed apart so labels do not overlap', () => {
    const desc = 'Label'
    const halfW = measureLabelWidth(desc) / 2
    const layouts = resolveLabels([pt('a', 50, desc), pt('b', 50, desc)])
    const sorted = [...layouts].sort((x, y) => x.labelX - y.labelX)
    const gap = sorted[1].labelX - sorted[0].labelX
    // Gap must be at least sum of half-widths + the minimum inter-label gap (4px)
    expect(gap).toBeGreaterThanOrEqual(halfW * 2 + 4 - 0.01)
  })

  it('two coincident points both get connector flags after being pushed apart', () => {
    const layouts = resolveLabels([pt('a', 50, 'Label'), pt('b', 50, 'Label')])
    expect(layouts.every((l) => l.hasConnector)).toBe(true)
  })

  it('all labels remain within horizontal chart bounds after resolution', () => {
    // 5 points clustered at the center
    const inputs = Array.from({ length: 5 }, (_, i) => pt(String(i), 50, 'Item'))
    const layouts = resolveLabels(inputs)
    const halfW = measureLabelWidth('Item') / 2
    for (const l of layouts) {
      expect(l.labelX).toBeGreaterThanOrEqual(CHART_PADDING_X + halfW - 0.01)
      expect(l.labelX).toBeLessThanOrEqual(SVG_WIDTH - CHART_PADDING_X - halfW + 0.01)
    }
  })

  it('no two labels overlap after resolution for a dense cluster', () => {
    const desc = 'Item'
    const halfW = measureLabelWidth(desc) / 2
    const inputs = Array.from({ length: 5 }, (_, i) => pt(String(i), 50, desc))
    const layouts = resolveLabels(inputs)
    const sorted = [...layouts].sort((a, b) => a.labelX - b.labelX)
    for (let i = 0; i < sorted.length - 1; i++) {
      const gap = sorted[i + 1].labelX - sorted[i].labelX
      expect(gap).toBeGreaterThanOrEqual(halfW * 2 + 4 - 0.1)
    }
  })
})
