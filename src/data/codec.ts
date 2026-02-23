import type { ChartData, HillPoint, ParseResult } from '../types/index.js'

const OPEN_TAG = '<!-- hillchart'
const CLOSE_TAG = 'hillchart -->'
const BLOCK_RE = /<!--\s*hillchart\s*([\s\S]*?)\s*hillchart\s*-->/

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val))
}

function sanitizePoint(raw: Record<string, unknown>, index: number): HillPoint {
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `point-${index}`,
    description: typeof raw.description === 'string' ? raw.description : '',
    x: clamp(typeof raw.x === 'number' ? raw.x : 0, 0, 100),
    y: clamp(typeof raw.y === 'number' ? raw.y : 0, 0, 100),
    color: typeof raw.color === 'string' && raw.color ? raw.color : '#3b82f6',
    ...(typeof raw.size === 'number' ? { size: raw.size } : {}),
  }
}

export function encode(data: ChartData): string {
  return `${OPEN_TAG}\n${JSON.stringify(data)}\n${CLOSE_TAG}`
}

export function decode(text: string): ParseResult {
  const match = BLOCK_RE.exec(text)
  if (!match) {
    return { ok: false, error: 'No hillchart block found' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(match[1].trim())
  } catch {
    return { ok: false, error: 'Invalid JSON in hillchart block' }
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: 'hillchart block must be a JSON object' }
  }

  const obj = parsed as Record<string, unknown>

  if (obj.version !== '1') {
    return { ok: false, error: `Unknown version: ${String(obj.version)}` }
  }

  const rawPoints = Array.isArray(obj.points) ? obj.points : []
  const points: HillPoint[] = rawPoints.map((p, i) =>
    sanitizePoint(typeof p === 'object' && p !== null ? (p as Record<string, unknown>) : {}, i)
  )

  return { ok: true, data: { version: '1', points } }
}
