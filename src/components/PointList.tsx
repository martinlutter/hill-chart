import type { HillPoint } from '../types/index.js'
import { PointItem } from './PointItem.js'

interface PointListProps {
  points: HillPoint[]
  onUpdate: (updated: HillPoint) => void
  onDelete: (id: string) => void
}

export function PointList({ points, onUpdate, onDelete }: PointListProps) {
  if (points.length === 0) {
    return <p className="point-list-empty">No points yet. Add one below.</p>
  }

  return (
    <ul className="point-list">
      {points.map((pt) => (
        <PointItem
          key={pt.id}
          point={pt}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}
