import { describe, it, expect, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useInlineEditListener } from '../../src/hooks/useInlineEditListener.js'
import { EDIT_INLINE_EVENT } from '../../src/github/inlineRenderer.js'
import type { HillPoint } from '../../src/types/index.js'

const samplePoints: HillPoint[] = [
  { id: '1', description: 'First point', x: 25, y: 100, color: '#ff0000' },
  { id: '2', description: 'Second point', x: 75, y: 50, color: '#00ff00' },
]

describe('useInlineEditListener', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('calls onEdit with points when a valid event is dispatched', () => {
    const onEdit = vi.fn()
    renderHook(() => useInlineEditListener(onEdit))

    window.dispatchEvent(
      new CustomEvent(EDIT_INLINE_EVENT, { detail: { points: samplePoints } }),
    )

    expect(onEdit).toHaveBeenCalledOnce()
    expect(onEdit).toHaveBeenCalledWith(samplePoints)
  })

  it('does not call onEdit when detail.points is undefined', () => {
    const onEdit = vi.fn()
    renderHook(() => useInlineEditListener(onEdit))

    window.dispatchEvent(
      new CustomEvent(EDIT_INLINE_EVENT, { detail: { points: undefined } }),
    )

    expect(onEdit).not.toHaveBeenCalled()
  })

  it('does not call onEdit when event has no detail', () => {
    const onEdit = vi.fn()
    renderHook(() => useInlineEditListener(onEdit))

    window.dispatchEvent(new CustomEvent(EDIT_INLINE_EVENT))

    expect(onEdit).not.toHaveBeenCalled()
  })

  it('does not call onEdit after unmount (listener cleaned up)', () => {
    const onEdit = vi.fn()
    const { unmount } = renderHook(() => useInlineEditListener(onEdit))

    unmount()

    window.dispatchEvent(
      new CustomEvent(EDIT_INLINE_EVENT, { detail: { points: samplePoints } }),
    )

    expect(onEdit).not.toHaveBeenCalled()
  })

  it('calls onEdit once per event with correct points each time', () => {
    const onEdit = vi.fn()
    renderHook(() => useInlineEditListener(onEdit))

    const firstPoints: HillPoint[] = [
      { id: 'a', description: 'Alpha', x: 10, y: 80, color: '#aaaaaa' },
    ]
    const secondPoints: HillPoint[] = [
      { id: 'b', description: 'Beta', x: 60, y: 120, color: '#bbbbbb' },
    ]

    window.dispatchEvent(
      new CustomEvent(EDIT_INLINE_EVENT, { detail: { points: firstPoints } }),
    )
    window.dispatchEvent(
      new CustomEvent(EDIT_INLINE_EVENT, { detail: { points: secondPoints } }),
    )

    expect(onEdit).toHaveBeenCalledTimes(2)
    expect(onEdit).toHaveBeenNthCalledWith(1, firstPoints)
    expect(onEdit).toHaveBeenNthCalledWith(2, secondPoints)
  })
})
