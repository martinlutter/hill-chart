import { describe, it, expect } from 'vitest'
import {
  hillY,
  buildHillPath,
  svgXToPercent,
  percentToSvgX,
  SVG_WIDTH,
  BASELINE_Y,
  PEAK_HEIGHT,
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

  it('starts at x=0', () => {
    const path = buildHillPath()
    expect(path).toMatch(/^M0\.00/)
  })

  it('ends near x=svgWidth', () => {
    const path = buildHillPath(SVG_WIDTH)
    expect(path).toMatch(new RegExp(`L${SVG_WIDTH.toFixed(2)}`))
  })
})

describe('svgXToPercent', () => {
  it('converts 0 → 0', () => {
    expect(svgXToPercent(0)).toBe(0)
  })

  it('converts svgWidth → 100', () => {
    expect(svgXToPercent(SVG_WIDTH)).toBe(100)
  })

  it('converts midpoint → 50', () => {
    expect(svgXToPercent(SVG_WIDTH / 2)).toBeCloseTo(50)
  })

  it('clamps negative values to 0', () => {
    expect(svgXToPercent(-50)).toBe(0)
  })

  it('clamps values beyond svgWidth to 100', () => {
    expect(svgXToPercent(SVG_WIDTH + 999)).toBe(100)
  })
})

describe('percentToSvgX', () => {
  it('converts 0 → 0', () => {
    expect(percentToSvgX(0)).toBe(0)
  })

  it('converts 100 → svgWidth', () => {
    expect(percentToSvgX(100)).toBe(SVG_WIDTH)
  })

  it('round-trips with svgXToPercent', () => {
    const pct = 37
    expect(svgXToPercent(percentToSvgX(pct))).toBeCloseTo(pct)
  })
})
