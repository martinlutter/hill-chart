import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHillChartReducer } from '../../src/hooks/useHillChartReducer.js'

describe('useHillChartReducer', () => {
  it('initializes with empty savedPoints and hidden panelState when given an empty string', () => {
    const { result } = renderHook(() => useHillChartReducer(''))
    const [state] = result.current
    expect(state.panelState).toBe('hidden')
    expect(state.savedPoints).toEqual([])
    expect(state.draftPoints).toEqual([])
    expect(state.errorMsg).toBe('')
  })

  it('populates savedPoints from a valid encoded body', () => {
    const body =
      '```hillchart\n{"version":"1","points":[{"id":"p1","description":"Auth","x":65,"y":48,"color":"#3b82f6"}]}\n```'
    const { result } = renderHook(() => useHillChartReducer(body))
    const [state] = result.current
    expect(state.panelState).toBe('hidden')
    expect(state.savedPoints).toHaveLength(1)
    expect(state.savedPoints[0]).toMatchObject({
      id: 'p1',
      description: 'Auth',
      x: 65,
      y: 48,
      color: '#3b82f6',
    })
  })

  it('initializes with empty savedPoints when body is invalid/garbage', () => {
    const { result } = renderHook(() => useHillChartReducer('not a hill chart at all ¯\\_(ツ)_/¯'))
    const [state] = result.current
    expect(state.panelState).toBe('hidden')
    expect(state.savedPoints).toEqual([])
  })

  it('transitions panelState to editing when OPEN is dispatched', () => {
    const { result } = renderHook(() => useHillChartReducer(''))
    act(() => {
      const [, dispatch] = result.current
      dispatch({ type: 'OPEN' })
    })
    const [state] = result.current
    expect(state.panelState).toBe('editing')
  })
})
