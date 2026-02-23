import React, { useRef } from 'react'
import type { HillPoint } from '../types/index.js'

interface PointItemProps {
  point: HillPoint
  onUpdate: (updated: HillPoint) => void
  onDelete: (id: string) => void
}

export function PointItem({ point, onUpdate, onDelete }: PointItemProps) {
  const labelRef = useRef<HTMLInputElement>(null)

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...point, color: e.target.value })
  }

  const handleLabelBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const trimmed = e.target.value.trim()
    if (trimmed !== point.description) {
      onUpdate({ ...point, description: trimmed || point.description })
    }
  }

  return (
    <li className="point-item">
      <input
        type="color"
        value={point.color}
        onChange={handleColorChange}
        className="point-item-color"
        aria-label={`Color for ${point.description}`}
        title="Point color"
      />
      <input
        ref={labelRef}
        type="text"
        defaultValue={point.description}
        maxLength={40}
        onBlur={handleLabelBlur}
        className="point-item-label"
        aria-label="Point label"
      />
      <button
        type="button"
        className="point-item-delete"
        onClick={() => onDelete(point.id)}
        aria-label={`Delete ${point.description}`}
      >
        ×
      </button>
    </li>
  )
}
