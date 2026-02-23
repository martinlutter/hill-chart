import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HillChartViewer } from '../../src/components/HillChartViewer.js'
import type { HillPoint } from '../../src/types/index.js'

const makePoint = (overrides: Partial<HillPoint> = {}): HillPoint => ({
  id: 'p1',
  description: 'Auth',
  x: 65,
  y: 48,
  color: '#3b82f6',
  ...overrides,
})

describe('HillChartViewer', () => {
  it('renders an SVG element', () => {
    render(<HillChartViewer points={[]} onEditRequest={() => {}} />)
    expect(document.querySelector('svg')).not.toBeNull()
  })

  it('renders zero circles when points array is empty', () => {
    render(<HillChartViewer points={[]} onEditRequest={() => {}} />)
    expect(document.querySelectorAll('circle')).toHaveLength(0)
  })

  it('renders one circle per point', () => {
    const points = [
      makePoint({ id: 'p1' }),
      makePoint({ id: 'p2', description: 'API' }),
      makePoint({ id: 'p3', description: 'Deploy' }),
    ]
    render(<HillChartViewer points={points} onEditRequest={() => {}} />)
    expect(document.querySelectorAll('circle')).toHaveLength(3)
  })

  it('renders point labels as SVG text elements', () => {
    render(<HillChartViewer points={[makePoint()]} onEditRequest={() => {}} />)
    expect(screen.getByText('Auth')).toBeDefined()
  })

  it('renders "Edit Hill Chart" button', () => {
    render(<HillChartViewer points={[]} onEditRequest={() => {}} />)
    expect(screen.getByRole('button', { name: /edit hill chart/i })).toBeDefined()
  })

  it('calls onEditRequest when "Edit Hill Chart" button is clicked', async () => {
    const onEditRequest = vi.fn()
    render(<HillChartViewer points={[]} onEditRequest={onEditRequest} />)
    await userEvent.click(screen.getByRole('button', { name: /edit hill chart/i }))
    expect(onEditRequest).toHaveBeenCalledOnce()
  })

  it('renders the hill curve path', () => {
    render(<HillChartViewer points={[]} onEditRequest={() => {}} />)
    const paths = document.querySelectorAll('path.hill-curve')
    expect(paths.length).toBeGreaterThan(0)
  })

  it('renders the center divider line', () => {
    render(<HillChartViewer points={[]} onEditRequest={() => {}} />)
    expect(document.querySelector('.hill-divider')).not.toBeNull()
  })

  it('renders "Figuring things out" and "Making it happen" labels', () => {
    render(<HillChartViewer points={[]} onEditRequest={() => {}} />)
    expect(screen.getByText(/figuring things out/i)).toBeDefined()
    expect(screen.getByText(/making it happen/i)).toBeDefined()
  })

  it('sets fill color from point.color', () => {
    render(<HillChartViewer points={[makePoint({ color: '#ff0000' })]} onEditRequest={() => {}} />)
    const circle = document.querySelector('circle')!
    expect(circle.getAttribute('fill')).toBe('#ff0000')
  })

  it('sets data-point-id attribute on each point group', () => {
    render(<HillChartViewer points={[makePoint({ id: 'xyz' })]} onEditRequest={() => {}} />)
    expect(document.querySelector('[data-point-id="xyz"]')).not.toBeNull()
  })
})
