import { describe, it, expect } from 'vitest'
import { hillChartReducer } from '../../src/hooks/hillChartReducer.js'
import type { HillChartState, HillChartAction } from '../../src/hooks/hillChartReducer.js'
import type { HillPoint } from '../../src/types/index.js'

const makePoint = (id: string, overrides: Partial<HillPoint> = {}): HillPoint => ({
  id,
  description: `Point ${id}`,
  x: 50,
  y: 100,
  color: '#3b82f6',
  ...overrides,
})

const baseState: HillChartState = {
  panelState: 'hidden',
  savedPoints: [],
  draftPoints: [],
  errorMsg: '',
}

describe('hillChartReducer', () => {
  describe('OPEN', () => {
    it('transitions to editing with empty draftPoints when savedPoints is empty', () => {
      const state = hillChartReducer(baseState, { type: 'OPEN' })
      expect(state.panelState).toBe('editing')
      expect(state.draftPoints).toEqual([])
    })

    it('transitions to editing and copies savedPoints into draftPoints when savedPoints has items', () => {
      const points = [makePoint('a'), makePoint('b')]
      const initial: HillChartState = { ...baseState, savedPoints: points }
      const state = hillChartReducer(initial, { type: 'OPEN' })
      expect(state.panelState).toBe('editing')
      expect(state.draftPoints).toEqual(points)
      expect(state.draftPoints).not.toBe(state.savedPoints)
    })
  })

  describe('EDIT', () => {
    it('transitions to editing and sets draftPoints from action', () => {
      const points = [makePoint('x')]
      const state = hillChartReducer(baseState, { type: 'EDIT', points })
      expect(state.panelState).toBe('editing')
      expect(state.draftPoints).toEqual(points)
    })

    it('replaces existing draftPoints with new ones', () => {
      const initial: HillChartState = { ...baseState, draftPoints: [makePoint('old')] }
      const newPoints = [makePoint('new1'), makePoint('new2')]
      const state = hillChartReducer(initial, { type: 'EDIT', points: newPoints })
      expect(state.draftPoints).toEqual(newPoints)
    })
  })

  describe('CANCEL', () => {
    it('transitions panelState to hidden', () => {
      const initial: HillChartState = { ...baseState, panelState: 'editing' }
      const state = hillChartReducer(initial, { type: 'CANCEL' })
      expect(state.panelState).toBe('hidden')
    })

    it('preserves draftPoints and savedPoints on cancel', () => {
      const points = [makePoint('p')]
      const initial: HillChartState = { ...baseState, panelState: 'editing', draftPoints: points }
      const state = hillChartReducer(initial, { type: 'CANCEL' })
      expect(state.draftPoints).toEqual(points)
    })
  })

  describe('SAVE_START', () => {
    it('transitions panelState to saving', () => {
      const initial: HillChartState = { ...baseState, panelState: 'editing' }
      const state = hillChartReducer(initial, { type: 'SAVE_START' })
      expect(state.panelState).toBe('saving')
    })
  })

  describe('SAVE_SUCCESS', () => {
    it('transitions to hidden, updates savedPoints, clears errorMsg', () => {
      const savedPoints = [makePoint('s1')]
      const initial: HillChartState = { ...baseState, panelState: 'saving', errorMsg: 'old error' }
      const state = hillChartReducer(initial, { type: 'SAVE_SUCCESS', savedPoints })
      expect(state.panelState).toBe('hidden')
      expect(state.savedPoints).toEqual(savedPoints)
      expect(state.errorMsg).toBe('')
    })
  })

  describe('SAVE_FAILURE', () => {
    it('transitions to error and sets errorMsg', () => {
      const initial: HillChartState = { ...baseState, panelState: 'saving' }
      const state = hillChartReducer(initial, { type: 'SAVE_FAILURE', error: 'Network error' })
      expect(state.panelState).toBe('error')
      expect(state.errorMsg).toBe('Network error')
    })
  })

  describe('CLOSE', () => {
    it('transitions panelState to hidden', () => {
      const initial: HillChartState = { ...baseState, panelState: 'editing' }
      const state = hillChartReducer(initial, { type: 'CLOSE' })
      expect(state.panelState).toBe('hidden')
    })
  })

  describe('ADD_POINT', () => {
    it('appends the point to draftPoints', () => {
      const existing = makePoint('e1')
      const newPoint = makePoint('n1')
      const initial: HillChartState = { ...baseState, draftPoints: [existing] }
      const state = hillChartReducer(initial, { type: 'ADD_POINT', point: newPoint })
      expect(state.draftPoints).toEqual([existing, newPoint])
    })

    it('adds first point to empty draftPoints', () => {
      const point = makePoint('first')
      const state = hillChartReducer(baseState, { type: 'ADD_POINT', point })
      expect(state.draftPoints).toEqual([point])
    })
  })

  describe('UPDATE_POINT', () => {
    it('updates the point whose id matches', () => {
      const p1 = makePoint('p1', { description: 'Original' })
      const p2 = makePoint('p2')
      const initial: HillChartState = { ...baseState, draftPoints: [p1, p2] }
      const updated = { ...p1, description: 'Updated', x: 75 }
      const state = hillChartReducer(initial, { type: 'UPDATE_POINT', updated })
      expect(state.draftPoints[0]).toEqual(updated)
      expect(state.draftPoints[1]).toEqual(p2)
    })

    it('leaves draftPoints unchanged when no id matches', () => {
      const p1 = makePoint('p1')
      const initial: HillChartState = { ...baseState, draftPoints: [p1] }
      const updated = makePoint('nonexistent')
      const state = hillChartReducer(initial, { type: 'UPDATE_POINT', updated })
      expect(state.draftPoints).toEqual([p1])
    })
  })

  describe('DELETE_POINT', () => {
    it('removes the point with the matching id', () => {
      const p1 = makePoint('p1')
      const p2 = makePoint('p2')
      const p3 = makePoint('p3')
      const initial: HillChartState = { ...baseState, draftPoints: [p1, p2, p3] }
      const state = hillChartReducer(initial, { type: 'DELETE_POINT', id: 'p2' })
      expect(state.draftPoints).toEqual([p1, p3])
    })

    it('does not modify draftPoints when id does not exist', () => {
      const p1 = makePoint('p1')
      const initial: HillChartState = { ...baseState, draftPoints: [p1] }
      const state = hillChartReducer(initial, { type: 'DELETE_POINT', id: 'missing' })
      expect(state.draftPoints).toEqual([p1])
    })

    it('results in empty array when deleting the only point', () => {
      const p1 = makePoint('p1')
      const initial: HillChartState = { ...baseState, draftPoints: [p1] }
      const state = hillChartReducer(initial, { type: 'DELETE_POINT', id: 'p1' })
      expect(state.draftPoints).toEqual([])
    })
  })

  describe('SET_DRAFT_POINTS', () => {
    it('replaces draftPoints with the provided array', () => {
      const initial: HillChartState = { ...baseState, draftPoints: [makePoint('old')] }
      const newPoints = [makePoint('new1'), makePoint('new2')]
      const state = hillChartReducer(initial, { type: 'SET_DRAFT_POINTS', points: newPoints })
      expect(state.draftPoints).toEqual(newPoints)
    })

    it('clears draftPoints when given an empty array', () => {
      const initial: HillChartState = { ...baseState, draftPoints: [makePoint('x')] }
      const state = hillChartReducer(initial, { type: 'SET_DRAFT_POINTS', points: [] })
      expect(state.draftPoints).toEqual([])
    })
  })
})
