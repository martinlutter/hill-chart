import React from 'react'
import type { HillPoint } from '../types/index.js'
import {
  buildHillPath,
  hillY,
  percentToSvgX,
  SVG_WIDTH,
  SVG_HEIGHT,
  BASELINE_Y,
  PEAK_HEIGHT,
} from '../hill-chart/hillMath.js'

interface HillChartViewerProps {
  points: HillPoint[]
  onEditRequest: () => void
}

const POINT_RADIUS = 10
const LABEL_OFFSET = 16

export function HillChartViewer({ points, onEditRequest }: HillChartViewerProps) {
  const hillPath = buildHillPath()
  const midX = SVG_WIDTH / 2

  return (
    <div className="hillchart-viewer">
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        width="100%"
        aria-label="Hill chart"
        role="img"
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
          x1={0}
          y1={BASELINE_Y}
          x2={SVG_WIDTH}
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
          className="hill-label"
        >
          Figuring things out
        </text>
        <text
          x={midX + midX / 2}
          y={SVG_HEIGHT - 4}
          textAnchor="middle"
          fontSize="11"
          fill="#8b949e"
          className="hill-label"
        >
          Making it happen
        </text>

        {/* Points */}
        {points.map((pt) => {
          const cx = percentToSvgX(pt.x)
          const cy = hillY(pt.x, BASELINE_Y, PEAK_HEIGHT)
          return (
            <g key={pt.id} className="hill-point" data-point-id={pt.id}>
              <circle
                cx={cx}
                cy={cy}
                r={POINT_RADIUS}
                fill={pt.color}
                stroke="#0d1117"
                strokeWidth="1.5"
              />
              <text
                x={cx}
                y={cy - LABEL_OFFSET}
                textAnchor="middle"
                fontSize="11"
                fill="#e6edf3"
                className="hill-point-label"
              >
                {pt.description}
              </text>
            </g>
          )
        })}
      </svg>

      <button
        className="hillchart-edit-btn"
        onClick={onEditRequest}
        type="button"
      >
        Edit Hill Chart
      </button>
    </div>
  )
}
