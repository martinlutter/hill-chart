import { describe, it, expect } from 'vitest'
import { encode, decode } from '../../src/data/codec.js'
import type { ChartData } from '../../src/types/index.js'

const SAMPLE_DATA: ChartData = {
  version: '1',
  points: [
    { id: 'abc', description: 'Auth', x: 65, y: 48, color: '#3b82f6' },
    { id: 'def', description: 'API', x: 20, y: 10, color: '#10b981' },
  ],
}

describe('encode', () => {
  it('wraps JSON in a fenced code block', () => {
    const encoded = encode(SAMPLE_DATA)
    expect(encoded).toMatch(/^```hillchart\n/)
    expect(encoded).toMatch(/\n```$/)
  })

  it('contains compact JSON of the data', () => {
    const encoded = encode(SAMPLE_DATA)
    const inner = encoded.replace('```hillchart\n', '').replace('\n```', '')
    expect(JSON.parse(inner)).toEqual(SAMPLE_DATA)
  })
})

describe('decode', () => {
  it('round-trips: decode(encode(data)).data deep-equals original', () => {
    const result = decode(encode(SAMPLE_DATA))
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).toEqual(SAMPLE_DATA)
    }
  })

  it('returns ok: false when no block is present', () => {
    const result = decode('This issue has no chart data yet.')
    expect(result.ok).toBe(false)
    expect((result as { ok: false; error: string }).error).toMatch(/No hillchart block found/)
  })

  it('returns ok: false for corrupt JSON in fenced block', () => {
    const result = decode('```hillchart\n{not valid json}\n```')
    expect(result.ok).toBe(false)
    expect((result as { ok: false; error: string }).error).toMatch(/Invalid JSON/)
  })

  it('extracts block even when surrounded by other text', () => {
    const surrounding = `Some preamble text.\n\n${encode(SAMPLE_DATA)}\n\nSome trailing text.`
    const result = decode(surrounding)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).toEqual(SAMPLE_DATA)
    }
  })

  it('returns ok: false for unknown version', () => {
    const badVersion = '```hillchart\n{"version":"2","points":[]}\n```'
    const result = decode(badVersion)
    expect(result.ok).toBe(false)
    expect((result as { ok: false; error: string }).error).toMatch(/Unknown version/)
  })

  it('applies safe defaults for missing optional fields', () => {
    const minimal = '```hillchart\n{"version":"1","points":[{}]}\n```'
    const result = decode(minimal)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const [pt] = result.data.points
      expect(pt.description).toBe('')
      expect(pt.color).toBe('#3b82f6')
      expect(pt.x).toBe(0)
      expect(pt.y).toBe(0)
      expect(typeof pt.id).toBe('string')
    }
  })

  it('defaults points to [] when points field is missing', () => {
    const noPoints = '```hillchart\n{"version":"1"}\n```'
    const result = decode(noPoints)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.points).toEqual([])
    }
  })

  it('clamps x/y values that are out of 0–100 range', () => {
    const outOfRange = '```hillchart\n{"version":"1","points":[{"id":"p1","description":"X","x":-10,"y":150,"color":"#fff"}]}\n```'
    const result = decode(outOfRange)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const [pt] = result.data.points
      expect(pt.x).toBe(0)
      expect(pt.y).toBe(100)
    }
  })

  it('clamps x/y at the boundaries (0 and 100 remain unchanged)', () => {
    const boundary = encode({ version: '1', points: [{ id: 'b', description: 'B', x: 0, y: 100, color: '#000' }] })
    const result = decode(boundary)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.points[0].x).toBe(0)
      expect(result.data.points[0].y).toBe(100)
    }
  })

  it('preserves the size field when present', () => {
    const withSize = encode({
      version: '1',
      points: [{ id: 's1', description: 'Sized', x: 50, y: 50, color: '#f00', size: 12 }],
    })
    const result = decode(withSize)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.points[0].size).toBe(12)
    }
  })
})

describe('decode — legacy HTML comment format (backward compat)', () => {
  it('decodes legacy HTML comment blocks', () => {
    const legacy = '<!-- hillchart\n{"version":"1","points":[]}\nhillchart -->'
    const result = decode(legacy)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.points).toEqual([])
    }
  })

  it('decodes legacy format with full point data', () => {
    const legacy = `<!-- hillchart\n${JSON.stringify(SAMPLE_DATA)}\nhillchart -->`
    const result = decode(legacy)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).toEqual(SAMPLE_DATA)
    }
  })

  it('handles whitespace variations in legacy block delimiters', () => {
    const loose = '<!--  hillchart  \n{"version":"1","points":[]}\n  hillchart  -->'
    const result = decode(loose)
    expect(result.ok).toBe(true)
  })

  it('prefers fenced format over legacy when both are present', () => {
    const fencedData: ChartData = { version: '1', points: [{ id: 'new', description: 'New', x: 50, y: 50, color: '#f00' }] }
    const legacyData: ChartData = { version: '1', points: [{ id: 'old', description: 'Old', x: 10, y: 10, color: '#0f0' }] }
    const both = `\`\`\`hillchart\n${JSON.stringify(fencedData)}\n\`\`\`\n\n<!-- hillchart\n${JSON.stringify(legacyData)}\nhillchart -->`
    const result = decode(both)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.points[0].id).toBe('new')
    }
  })
})
