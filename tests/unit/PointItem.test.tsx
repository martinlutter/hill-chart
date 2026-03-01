import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { PointItem } from '../../src/components/PointItem.js'
import type { HillPoint } from '../../src/types/index.js'

const makePoint = (overrides: Partial<HillPoint> = {}): HillPoint => ({
  id: 'p1',
  description: 'Auth',
  x: 50,
  y: 50,
  color: '#3b82f6',
  ...overrides,
})

describe('PointItem', () => {
  it('commits label change on blur', () => {
    const onUpdate = vi.fn()
    const point = makePoint()
    const { getByDisplayValue } = render(
      <PointItem point={point} onUpdate={onUpdate} onDelete={() => {}} />,
    )

    const input = getByDisplayValue('Auth')
    fireEvent.change(input, { target: { value: 'Backend' } })
    fireEvent.blur(input)

    expect(onUpdate).toHaveBeenCalledOnce()
    expect(onUpdate.mock.calls[0][0]).toMatchObject({ description: 'Backend' })
  })

  it('commits label change on Enter key', () => {
    const onUpdate = vi.fn()
    const point = makePoint()
    const { getByDisplayValue } = render(
      <PointItem point={point} onUpdate={onUpdate} onDelete={() => {}} />,
    )

    const input = getByDisplayValue('Auth')
    fireEvent.change(input, { target: { value: 'API' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onUpdate).toHaveBeenCalledOnce()
    expect(onUpdate.mock.calls[0][0]).toMatchObject({ description: 'API' })
  })

  it('does not commit on Enter if label is unchanged', () => {
    const onUpdate = vi.fn()
    const point = makePoint()
    const { getByDisplayValue } = render(
      <PointItem point={point} onUpdate={onUpdate} onDelete={() => {}} />,
    )

    fireEvent.keyDown(getByDisplayValue('Auth'), { key: 'Enter' })

    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('blurs the input after Enter', () => {
    const point = makePoint()
    const { getByDisplayValue } = render(
      <PointItem point={point} onUpdate={() => {}} onDelete={() => {}} />,
    )

    const input = getByDisplayValue('Auth')
    input.focus()
    fireEvent.change(input, { target: { value: 'New' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(document.activeElement).not.toBe(input)
  })

  it('does not commit on other keys', () => {
    const onUpdate = vi.fn()
    const point = makePoint()
    const { getByDisplayValue } = render(
      <PointItem point={point} onUpdate={onUpdate} onDelete={() => {}} />,
    )

    const input = getByDisplayValue('Auth')
    fireEvent.change(input, { target: { value: 'Changed' } })
    fireEvent.keyDown(input, { key: 'Tab' })

    expect(onUpdate).not.toHaveBeenCalled()
  })
})
