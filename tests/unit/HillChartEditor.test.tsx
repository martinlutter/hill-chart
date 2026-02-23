import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { HillChartEditor } from '../../src/components/HillChartEditor.js'
import type { HillPoint } from '../../src/types/index.js'

const makePoint = (overrides: Partial<HillPoint> = {}): HillPoint => ({
  id: 'p1',
  description: 'Auth',
  x: 50,
  y: 50,
  color: '#3b82f6',
  ...overrides,
})

// SVGSVGElement.getBoundingClientRect is not implemented in jsdom — mock it.
beforeEach(() => {
  vi.spyOn(SVGSVGElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width: 600,
    height: 200,
    right: 600,
    bottom: 200,
    x: 0,
    y: 0,
    toJSON: () => {},
  })
})

describe('HillChartEditor', () => {
  it('renders an SVG element', () => {
    render(<HillChartEditor points={[]} onChange={() => {}} />)
    expect(document.querySelector('svg')).not.toBeNull()
  })

  it('renders one visible circle per point', () => {
    const points = [makePoint({ id: 'p1' }), makePoint({ id: 'p2', description: 'API', x: 30 })]
    render(<HillChartEditor points={points} onChange={() => {}} />)
    // Each point has 2 circles: hit area + visible. Filter visible ones (non-transparent).
    const circles = Array.from(document.querySelectorAll('circle')).filter(
      (c) => c.getAttribute('fill') !== 'transparent',
    )
    expect(circles).toHaveLength(2)
  })

  it('renders a larger transparent hit-area circle per point', () => {
    render(<HillChartEditor points={[makePoint()]} onChange={() => {}} />)
    const hitCircles = Array.from(document.querySelectorAll('circle')).filter(
      (c) => c.getAttribute('fill') === 'transparent',
    )
    expect(hitCircles).toHaveLength(1)
  })

  it('calls onChange with updated x when dragging a point', () => {
    const onChange = vi.fn()
    const points = [makePoint({ id: 'drag-me', x: 50 })]
    render(<HillChartEditor points={points} onChange={onChange} />)

    const svg = document.querySelector('svg')!
    const hitCircle = document.querySelector('circle[fill="transparent"]')!

    // Start drag on hit circle, move SVG, release
    fireEvent.mouseDown(hitCircle, { clientX: 300 })
    fireEvent.mouseMove(svg, { clientX: 450 })
    fireEvent.mouseUp(svg)

    expect(onChange).toHaveBeenCalled()
    const updatedPoints: HillPoint[] = onChange.mock.calls[0][0]
    expect(updatedPoints[0].x).toBeGreaterThan(50)
  })

  it('does not call onChange when mouse moves without a drag in progress', () => {
    const onChange = vi.fn()
    render(<HillChartEditor points={[makePoint()]} onChange={onChange} />)
    const svg = document.querySelector('svg')!
    fireEvent.mouseMove(svg, { clientX: 200 })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('stops dragging on mouseLeave', () => {
    const onChange = vi.fn()
    render(<HillChartEditor points={[makePoint({ id: 'p1', x: 50 })]} onChange={onChange} />)

    const svg = document.querySelector('svg')!
    const hitCircle = document.querySelector('circle[fill="transparent"]')!

    fireEvent.mouseDown(hitCircle, { clientX: 300 })
    fireEvent.mouseLeave(svg)

    onChange.mockClear()
    fireEvent.mouseMove(svg, { clientX: 100 })
    // After mouseLeave, drag should have ended — no further changes
    expect(onChange).not.toHaveBeenCalled()
  })

  it('renders point labels', () => {
    const { getByText } = render(
      <HillChartEditor points={[makePoint({ description: 'Backend' })]} onChange={() => {}} />,
    )
    expect(getByText('Backend')).toBeDefined()
  })

  it('renders "Figuring things out" and "Making it happen" labels', () => {
    const { getByText } = render(<HillChartEditor points={[]} onChange={() => {}} />)
    expect(getByText(/figuring things out/i)).toBeDefined()
    expect(getByText(/making it happen/i)).toBeDefined()
  })
})
