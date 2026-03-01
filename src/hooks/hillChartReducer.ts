import type { HillPoint } from '../types/index.js'

export type PanelState = 'hidden' | 'viewing' | 'editing' | 'saving' | 'error'

export interface HillChartState {
  panelState: PanelState
  savedPoints: HillPoint[]
  draftPoints: HillPoint[]
  errorMsg: string
}

export type HillChartAction =
  | { type: 'OPEN' }
  | { type: 'EDIT'; points: HillPoint[] }
  | { type: 'CANCEL' }
  | { type: 'SAVE_START' }
  | { type: 'SAVE_SUCCESS'; savedPoints: HillPoint[] }
  | { type: 'SAVE_FAILURE'; error: string }
  | { type: 'CLOSE' }
  | { type: 'ADD_POINT'; point: HillPoint }
  | { type: 'UPDATE_POINT'; updated: HillPoint }
  | { type: 'DELETE_POINT'; id: string }
  | { type: 'SET_DRAFT_POINTS'; points: HillPoint[] }

export function hillChartReducer(
  state: HillChartState,
  action: HillChartAction,
): HillChartState {
  switch (action.type) {
    case 'OPEN':
      if (state.savedPoints.length > 0) {
        return { ...state, panelState: 'viewing' }
      }
      return { ...state, panelState: 'editing', draftPoints: [] }

    case 'EDIT':
      return { ...state, panelState: 'editing', draftPoints: [...action.points] }

    case 'CANCEL':
      return {
        ...state,
        panelState: state.savedPoints.length > 0 ? 'viewing' : 'hidden',
      }

    case 'SAVE_START':
      return { ...state, panelState: 'saving' }

    case 'SAVE_SUCCESS':
      return { ...state, panelState: 'hidden', savedPoints: action.savedPoints, errorMsg: '' }

    case 'SAVE_FAILURE':
      return { ...state, panelState: 'error', errorMsg: action.error }

    case 'CLOSE':
      return { ...state, panelState: 'hidden' }

    case 'ADD_POINT':
      return { ...state, draftPoints: [...state.draftPoints, action.point] }

    case 'UPDATE_POINT':
      return {
        ...state,
        draftPoints: state.draftPoints.map((p) =>
          p.id === action.updated.id ? action.updated : p,
        ),
      }

    case 'DELETE_POINT':
      return {
        ...state,
        draftPoints: state.draftPoints.filter((p) => p.id !== action.id),
      }

    case 'SET_DRAFT_POINTS':
      return { ...state, draftPoints: action.points }

    default:
      return state
  }
}
