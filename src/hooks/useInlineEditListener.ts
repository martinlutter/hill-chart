import { useEffect } from 'react'
import type { HillPoint } from '../types/index.js'
import { EDIT_INLINE_EVENT } from '../github/inlineRenderer.js'

export function useInlineEditListener(
  onEdit: (points: HillPoint[]) => void,
): void {
  useEffect(() => {
    const handleEditInline = (e: Event) => {
      const points = (e as CustomEvent).detail?.points as HillPoint[] | undefined
      if (points) onEdit(points)
    }
    window.addEventListener(EDIT_INLINE_EVENT, handleEditInline)
    return () => window.removeEventListener(EDIT_INLINE_EVENT, handleEditInline)
  }, [onEdit])
}
