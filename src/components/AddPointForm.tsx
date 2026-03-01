import { type SyntheticEvent, useRef, useState } from 'react'
import type { HillPoint } from '../types/index.js'

const COLOR_PALETTE = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
]

interface AddPointFormProps {
  /** Number of existing points — used to cycle through the color palette */
  pointCount: number
  onAdd: (point: HillPoint) => void
}

export function AddPointForm({ pointCount, onAdd }: AddPointFormProps) {
  const defaultColor = COLOR_PALETTE[pointCount % COLOR_PALETTE.length]
  const [color, setColor] = useState(defaultColor)
  const labelRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    const label = labelRef.current?.value.trim() ?? ''
    if (!label) return

    const point: HillPoint = {
      id: crypto.randomUUID(),
      description: label,
      x: 0,
      y: 0,
      color,
    }
    onAdd(point)

    // Reset form
    if (labelRef.current) labelRef.current.value = ''
    setColor(COLOR_PALETTE[(pointCount + 1) % COLOR_PALETTE.length])
  }

  return (
    <form className="add-point-form" onSubmit={handleSubmit} data-testid="add-point-form">
      <input
        ref={labelRef}
        type="text"
        placeholder="Point label"
        maxLength={40}
        className="add-point-label"
        aria-label="New point label"
        data-testid="point-description-input"
        required
      />
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="add-point-color"
        aria-label="New point color"
        title="Point color"
      />
      <button type="submit" className="btn btn-secondary add-point-submit" data-testid="add-point-submit">
        Add
      </button>
    </form>
  )
}
