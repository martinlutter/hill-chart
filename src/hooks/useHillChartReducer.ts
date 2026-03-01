import { useReducer } from 'react'
import type { Dispatch } from 'react'
import { decode } from '../data/codec.js'
import { hillChartReducer } from './hillChartReducer.js'
import type { HillChartState, HillChartAction } from './hillChartReducer.js'

function buildInitialState(issueBodyText: string): HillChartState {
  const result = decode(issueBodyText)
  return {
    panelState: 'hidden',
    savedPoints: result.ok ? result.data.points : [],
    draftPoints: [],
    errorMsg: '',
  }
}

export function useHillChartReducer(
  issueBodyText: string,
): [HillChartState, Dispatch<HillChartAction>] {
  return useReducer(hillChartReducer, issueBodyText, buildInitialState)
}
