import { useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { HillPoint } from '../types/index.js'
import { encode } from '../data/codec.js'
import { writeHillChartComment } from '../github/commentWriter.js'
import { findCommentTextarea } from '../github/detector.js'
import { HillChartEditor } from './HillChartEditor.js'
import { PointList } from './PointList.js'
import { AddPointForm } from './AddPointForm.js'
import { useHillChartReducer } from '../hooks/useHillChartReducer.js'
import { useDialogSync } from '../hooks/useDialogSync.js'
import { useInlineEditListener } from '../hooks/useInlineEditListener.js'
import { useTheme } from '../hooks/useTheme.js'

export interface HillChartWidgetProps {
  /** Raw innerHTML of the first issue body — contains the hillchart HTML comment block */
  issueBodyText: string
  /** Where to portal the "Hill Chart" trigger button in the host page */
  toolbarAnchor: Element | null
}

export function HillChartWidget({
  issueBodyText,
  toolbarAnchor,
}: HillChartWidgetProps) {
  const [state, dispatch] = useHillChartReducer(issueBodyText)
  const { panelState, draftPoints, errorMsg } = state
  const dialogRef = useRef<HTMLDialogElement>(null)
  useTheme()

  // ── Hooks ─────────────────────────────────────────────────────────────────
  const onDialogCancel = useCallback(() => dispatch({ type: 'CLOSE' }), [dispatch])
  useDialogSync(panelState, dialogRef, onDialogCancel)

  const onInlineEdit = useCallback(
    (points: HillPoint[]) => dispatch({ type: 'EDIT', points }),
    [dispatch],
  )
  useInlineEditListener(onInlineEdit)

  // ── Side-effect callbacks ─────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    const textarea = findCommentTextarea()
    if (!textarea) {
      dispatch({ type: 'SAVE_FAILURE', error: 'GitHub comment textarea not found — cannot save.' })
      return
    }
    dispatch({ type: 'SAVE_START' })
    const encoded = encode({ version: '1', points: draftPoints })
    const result = writeHillChartComment(textarea, encoded)
    if (result.ok) {
      dispatch({ type: 'SAVE_SUCCESS', savedPoints: draftPoints })
    } else {
      dispatch({ type: 'SAVE_FAILURE', error: result.error ?? 'Unknown error' })
    }
  }, [draftPoints, dispatch])

  const handleCopyToClipboard = useCallback(async () => {
    const encoded = encode({ version: '1', points: draftPoints })
    await navigator.clipboard.writeText(encoded)
    dispatch({ type: 'CLOSE' })
  }, [draftPoints, dispatch])

  // ── Panel body ────────────────────────────────────────────────────────────
  let panelBody: React.ReactNode = null
  if (panelState === 'editing' || panelState === 'saving') {
    panelBody = (
      <>
        <HillChartEditor
          points={draftPoints}
          onChange={(points) => dispatch({ type: 'SET_DRAFT_POINTS', points })}
        />
        <PointList
          points={draftPoints}
          onUpdate={(updated) => dispatch({ type: 'UPDATE_POINT', updated })}
          onDelete={(id) => dispatch({ type: 'DELETE_POINT', id })}
        />
        <AddPointForm
          pointCount={draftPoints.length}
          onAdd={(point) => dispatch({ type: 'ADD_POINT', point })}
        />
      </>
    )
  } else if (panelState === 'error') {
    panelBody = (
      <>
        <p className="hillchart-status hillchart-status-error">{errorMsg}</p>
        <p className="hillchart-status">
          Your changes have not been lost. You can try saving again.
        </p>
      </>
    )
  }

  // ── Panel footer ──────────────────────────────────────────────────────────
  let panelFooter: React.ReactNode = null
  if (panelState === 'editing') {
    panelFooter = (
      <>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => dispatch({ type: 'CANCEL' })}
          data-testid="hillchart-cancel"
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            void handleCopyToClipboard()
          }}
          data-testid="hillchart-copy"
        >
          Copy to clipboard
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            void handleSave()
          }}
          data-testid="hillchart-save"
        >
          Paste to comment
        </button>
      </>
    )
  } else if (panelState === 'saving') {
    panelFooter = (
      <button type="button" className="btn btn-primary" disabled>
        Saving…
      </button>
    )
  } else if (panelState === 'error') {
    panelFooter = (
      <>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => dispatch({ type: 'EDIT', points: draftPoints })}
        >
          Back to edit
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => dispatch({ type: 'CLOSE' })}
        >
          Close
        </button>
      </>
    )
  }

  const panelTitle = 'Edit Hill Chart'

  return (
    <>
      {toolbarAnchor &&
        createPortal(
          <button
            className="btn btn-sm"
            type="button"
            data-testid="hillchart-button"
            onClick={() => dispatch({ type: 'OPEN' })}
          >
            Hill Chart
          </button>,
          toolbarAnchor,
        )}

      <dialog
        ref={dialogRef}
        className="hillchart-panel"
        aria-label={panelTitle}
        data-testid="hillchart-panel"
      >
        <div className="hillchart-panel-header">
          <span className="hillchart-panel-title">{panelTitle}</span>
          <button
            type="button"
            className="hillchart-panel-close"
            onClick={() => dispatch({ type: 'CLOSE' })}
            aria-label="Close Hill Chart panel"
            data-testid="hillchart-panel-close"
          >
            ×
          </button>
        </div>

        <div className="hillchart-panel-body">{panelBody}</div>

        {panelFooter && (
          <div className="hillchart-panel-footer">{panelFooter}</div>
        )}
      </dialog>
    </>
  )
}
