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

  const commitLabel = (input: HTMLInputElement) => {
    const trimmed = input.value.trim()
    if (trimmed !== point.description) {
      onUpdate({ ...point, description: trimmed || point.description })
    }
  }

  const handleLabelBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    commitLabel(e.target)
  }

  const handleLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitLabel(e.currentTarget)
      e.currentTarget.blur()
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
        onKeyDown={handleLabelKeyDown}
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
