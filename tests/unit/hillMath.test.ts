import { describe, it, expect } from 'vitest'
import {
  hillY,
  buildHillPath,
  svgXToPercent,
  percentToSvgX,
  SVG_WIDTH,
  BASELINE_Y,
  PEAK_HEIGHT,
  CHART_PADDING_X,
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
