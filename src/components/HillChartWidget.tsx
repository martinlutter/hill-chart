import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { HillPoint } from '../types/index.js'
import { decode, encode } from '../data/codec.js'
import { writeHillChartComment } from '../github/commentWriter.js'
import { EDIT_INLINE_EVENT } from '../github/inlineRenderer.js'
import { HillChartViewer } from './HillChartViewer.js'
import { HillChartEditor } from './HillChartEditor.js'
import { PointList } from './PointList.js'
import { AddPointForm } from './AddPointForm.js'

type PanelState = 'hidden' | 'viewing' | 'editing' | 'saving' | 'error';

export interface HillChartWidgetProps {
  /** Raw innerHTML of the first issue body — contains the hillchart HTML comment block */
  issueBodyText: string
  /** GitHub's comment textarea — used for write-back */
  commentTextarea: HTMLTextAreaElement | null
  /** Where to portal the "Hill Chart" trigger button in the host page */
  toolbarAnchor: Element | null
}

export function HillChartWidget({
  issueBodyText,
  commentTextarea,
  toolbarAnchor,
}: HillChartWidgetProps) {
  const [savedPoints, setSavedPoints] = useState<HillPoint[]>(() => {
    const result = decode(issueBodyText)
    return result.ok ? result.data.points : []
  })

  const [panelState, setPanelState] = useState<PanelState>('hidden')
  const [draftPoints, setDraftPoints] = useState<HillPoint[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const dialogRef = useRef<HTMLDialogElement>(null)

  // Open / close the native <dialog> in sync with panelState
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (panelState !== 'hidden') {
      if (!dialog.open) dialog.showModal()
    } else {
      if (dialog.open) dialog.close()
    }
  }, [panelState])

  // Intercept the native Escape key so we control state ourselves
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handleCancel = (e: Event) => {
      e.preventDefault()
      setPanelState('hidden')
    }
    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [])

  // Listen for inline chart edit requests from light DOM
  useEffect(() => {
    const handleEditInline = (e: Event) => {
      const points = (e as CustomEvent).detail?.points as HillPoint[] | undefined
      if (points) {
        setDraftPoints([...points])
        setPanelState('editing')
      }
    }
    window.addEventListener(EDIT_INLINE_EVENT, handleEditInline)
    return () => window.removeEventListener(EDIT_INLINE_EVENT, handleEditInline)
  }, [])

  const openPanel = useCallback(() => {
    if (savedPoints.length > 0) {
      setPanelState('viewing')
    } else {
      setDraftPoints([])
      setPanelState('editing')
    }
  }, [savedPoints])

  const handleEditRequest = useCallback(() => {
    setDraftPoints([...savedPoints])
    setPanelState('editing')
  }, [savedPoints])

  const handleCancel = useCallback(() => {
    if (savedPoints.length > 0) {
      setPanelState('viewing')
    } else {
      setPanelState('hidden')
    }
  }, [savedPoints])

  const handleSave = useCallback(() => {
    if (!commentTextarea) {
      setErrorMsg('GitHub comment textarea not found — cannot save.')
      setPanelState('error')
      return
    }
    setPanelState('saving')
    const encoded = encode({ version: '1', points: draftPoints })
    const result = writeHillChartComment(commentTextarea, encoded)
    if (result.ok) {
      setSavedPoints(draftPoints)
      setPanelState('hidden')
    } else {
      setErrorMsg(result.error ?? 'Unknown error')
      setPanelState('error')
    }
  }, [commentTextarea, draftPoints])

  const handleCopyToClipboard = useCallback(async () => {
    const encoded = encode({ version: '1', points: draftPoints })
    await navigator.clipboard.writeText(encoded)
    setPanelState('hidden')
  }, [draftPoints])

  const handleAddPoint = useCallback((point: HillPoint) => {
    setDraftPoints((prev) => [...prev, point])
  }, [])

  const handleUpdatePoint = useCallback((updated: HillPoint) => {
    setDraftPoints((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p)),
    )
  }, [])

  const handleDeletePoint = useCallback((id: string) => {
    setDraftPoints((prev) => prev.filter((p) => p.id !== id))
  }, [])

  // ── Panel body ──────────────────────────────────────────────────────────
  let panelBody: React.ReactNode = null
  if (panelState === 'viewing') {
    panelBody = (
      <HillChartViewer points={savedPoints} onEditRequest={handleEditRequest} />
    )
  } else if (panelState === 'editing' || panelState === 'saving') {
    panelBody = (
      <>
        <HillChartEditor points={draftPoints} onChange={setDraftPoints} />
        <PointList
          points={draftPoints}
          onUpdate={handleUpdatePoint}
          onDelete={handleDeletePoint}
        />
        <AddPointForm pointCount={draftPoints.length} onAdd={handleAddPoint} />
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

  // ── Panel footer ────────────────────────────────────────────────────────
  let panelFooter: React.ReactNode = null
  if (panelState === 'editing') {
    panelFooter = (
      <>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleCancel}
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
          onClick={() => setPanelState('editing')}
        >
          Back to edit
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setPanelState('hidden')}
        >
          Close
        </button>
      </>
    )
  }

  const panelTitle =
    panelState === 'viewing' ? 'Hill Chart' : 'Edit Hill Chart'

  return (
    <>
      {toolbarAnchor &&
        createPortal(
          <button
            className="btn btn-sm"
            type="button"
            data-testid="hillchart-button"
            onClick={openPanel}
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
            onClick={() => setPanelState('hidden')}
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
