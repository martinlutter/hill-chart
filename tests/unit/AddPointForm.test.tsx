import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { AddPointForm } from '../../src/components/AddPointForm.js'

describe('AddPointForm', () => {
  it('calls onAdd with a new point when the form is submitted', () => {
    const onAdd = vi.fn()
    const { getByTestId } = render(<AddPointForm pointCount={0} onAdd={onAdd} />)

    fireEvent.change(getByTestId('point-description-input'), { target: { value: 'Auth' } })
    fireEvent.click(getByTestId('add-point-submit'))

    expect(onAdd).toHaveBeenCalledOnce()
    expect(onAdd.mock.calls[0][0]).toMatchObject({
      description: 'Auth',
      x: 0,
      y: 0,
      color: '#3b82f6',
    })
  })

  it('submits when pressing Enter in the label input', () => {
    const onAdd = vi.fn()
    const { getByTestId } = render(<AddPointForm pointCount={0} onAdd={onAdd} />)

    const input = getByTestId('point-description-input')
    fireEvent.change(input, { target: { value: 'New feature' } })
    fireEvent.submit(getByTestId('add-point-form'))

    expect(onAdd).toHaveBeenCalledOnce()
    expect(onAdd.mock.calls[0][0]).toMatchObject({ description: 'New feature' })
  })

  it('does not call onAdd when label is empty', () => {
    const onAdd = vi.fn()
    const { getByTestId } = render(<AddPointForm pointCount={0} onAdd={onAdd} />)

    fireEvent.submit(getByTestId('add-point-form'))

    expect(onAdd).not.toHaveBeenCalled()
  })

  it('clears the input after successful submit', () => {
    const onAdd = vi.fn()
    const { getByTestId } = render(<AddPointForm pointCount={0} onAdd={onAdd} />)

    const input = getByTestId('point-description-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Task' } })
    fireEvent.submit(getByTestId('add-point-form'))

    expect(input.value).toBe('')
  })
})
