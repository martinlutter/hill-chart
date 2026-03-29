import React, { useCallback, useRef, useState } from 'react'
import type { HillPoint } from '../types/index.js'
import {
  buildHillPath,
  hillY,
  percentToSvgX,
  svgXToPercent,
  SVG_WIDTH,
  SVG_HEIGHT,
  BASELINE_Y,
  PEAK_HEIGHT,
  CHART_PADDING_X,
  resolveLabels,
} from '../hill-chart/hillMath.js'

interface HillChartEditorProps {
  points: HillPoint[]
  onChange: (updated: HillPoint[]) => void
}

const POINT_RADIUS = 10
const HIT_RADIUS = 18

export function HillChartEditor({ points, onChange }: HillChartEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const hillPath = buildHillPath()
  const midX = SVG_WIDTH / 2

  const getSvgX = useCallback((clientX: number): number => {
    const svg = svgRef.current
    if (!svg) return 0
    const rect = svg.getBoundingClientRect()
    const scaleX = SVG_WIDTH / rect.width
    return (clientX - rect.left) * scaleX
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, pointId: string) => {
      e.preventDefault()
      setDraggingId(pointId)
    },
    [],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingId) return
      e.preventDefault()
      const svgX = getSvgX(e.clientX)
      const newPct = svgXToPercent(svgX)
      const updated = points.map((pt) =>
        pt.id === draggingId
          ? { ...pt, x: newPct, y: svgXToPercent(hillY(newPct, BASELINE_Y, PEAK_HEIGHT)) }
          : pt,
      )
      onChange(updated)
    },
    [draggingId, points, onChange, getSvgX],
  )

  const handleMouseUp = useCallback(() => {
    setDraggingId(null)
  }, [])

  return (
    <div className="hillchart-editor">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        width="100%"
        aria-label="Hill chart editor"
        role="img"
        style={{
          cursor: draggingId ? 'grabbing' : 'default',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Hill curve */}
        <path
          d={hillPath}
          fill="none"
          stroke="#30363d"
          strokeWidth="2"
          className="hill-curve"
        />

        {/* Baseline */}
        <line
          x1={CHART_PADDING_X}
          y1={BASELINE_Y}
          x2={SVG_WIDTH - CHART_PADDING_X}
          y2={BASELINE_Y}
          stroke="#30363d"
          strokeWidth="1"
        />

        {/* Center divider */}
        <line
          x1={midX}
          y1={0}
          x2={midX}
          y2={BASELINE_Y}
          stroke="#30363d"
          strokeWidth="1"
          strokeDasharray="4 4"
          className="hill-divider"
        />

        {/* Phase labels */}
        <text
          x={midX / 2}
          y={SVG_HEIGHT - 4}
          textAnchor="middle"
          fontSize="11"
          fill="#8b949e"
        >
          Figuring things out
        </text>
        <text
          x={midX + midX / 2}
          y={SVG_HEIGHT - 4}
          textAnchor="middle"
          fontSize="11"
          fill="#8b949e"
        >
          Making it happen
        </text>

        {/* Points */}
        {(() => {
          const layouts = resolveLabels(
            points.map((pt) => ({
              id: pt.id,
              cx: percentToSvgX(pt.x),
              cy: hillY(pt.x, BASELINE_Y, PEAK_HEIGHT),
              description: pt.description,
            })),
          )
          const layoutMap = new Map(layouts.map((l) => [l.id, l]))
          return points.map((pt) => {
            const layout = layoutMap.get(pt.id)!
            const { cx, cy, labelX, labelY, hasConnector } = layout
            const isDragging = pt.id === draggingId
            return (
              <g
                key={pt.id}
                className="hill-point"
                data-point-id={pt.id}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                {hasConnector && (
                  <line
                    x1={labelX}
                    y1={labelY + 2}
                    x2={cx}
                    y2={cy - POINT_RADIUS - 2}
                    stroke={pt.color}
                    strokeWidth="1"
                    opacity="0.6"
                    pointerEvents="none"
                  />
                )}
                {/* Larger transparent hit area */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={HIT_RADIUS}
                  fill="transparent"
                  onMouseDown={(e) => handleMouseDown(e, pt.id)}
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r={POINT_RADIUS}
                  fill={pt.color}
                  stroke={isDragging ? '#e6edf3' : '#0d1117'}
                  strokeWidth={isDragging ? 2.5 : 1.5}
                  pointerEvents="none"
                />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#e6edf3"
                  pointerEvents="none"
                  className="hill-point-label"
                >
                  {pt.description}
                </text>
              </g>
            )
          })
        })()}
      </svg>
    </div>
  )
}
