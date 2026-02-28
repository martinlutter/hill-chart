// Shared TypeScript interfaces — Phase 2
// TODO: implement

export interface HillPoint {
  id: string
  description: string
  x: number // 0–100: position along the hill
  y: number // 0–100: position on the hill curve (derived from x)
  color: string
  size?: number
}

export interface ChartData {
  version: '1'
  points: HillPoint[]
}

export type ParseResult =
  | { ok: true; data: ChartData }
  | { ok: false; error: string };
