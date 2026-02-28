import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, screen, cleanup, act, fireEvent } from '@testing-library/react'
import { HillChartWidget } from '../../src/components/HillChartWidget.js'
import { EDIT_INLINE_EVENT } from '../../src/github/inlineRenderer.js'
import { encode } from '../../src/data/codec.js'
import type { HillPoint } from '../../src/types/index.js'

// jsdom doesn't implement dialog.showModal/close — stub them
beforeEach(() => {
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  }
})

afterEach(cleanup)

const POINTS: HillPoint[] = [
  { id: 'p1', description: 'Login flow', x: 70, y: 64, color: '#3b82f6' },
  { id: 'p2', description: 'JWT handling', x: 30, y: 50, color: '#10b981' },
]

function renderWidget(opts?: { commentTextarea?: HTMLTextAreaElement | null }) {
  const anchor = document.createElement('div')
  document.body.appendChild(anchor)
  return render(
    <HillChartWidget
      issueBodyText=""
      commentTextarea={opts?.commentTextarea ?? null}
      toolbarAnchor={anchor}
    />,
  )
}

/** Open editing mode with POINTS pre-loaded via the inline edit event */
function openEditorWithPoints() {
  act(() => {
    window.dispatchEvent(
      new CustomEvent(EDIT_INLINE_EVENT, { detail: { points: POINTS } }),
    )
  })
}

describe('HillChartWidget inline edit event', () => {
  it('opens editor with correct points when hillchart:edit-inline fires', () => {
    renderWidget()
    openEditorWithPoints()

    // Panel should be open in editing mode
    const panel = screen.getByTestId('hillchart-panel')
    expect(panel).toBeTruthy()
    expect(panel.hasAttribute('open')).toBe(true)

    // Should show save/cancel/copy buttons (editing mode, not viewing)
    expect(screen.getByTestId('hillchart-save')).toBeTruthy()
    expect(screen.getByTestId('hillchart-save').textContent).toBe('Paste to comment')
    expect(screen.getByTestId('hillchart-copy')).toBeTruthy()
    expect(screen.getByTestId('hillchart-copy').textContent).toBe('Copy to clipboard')
    expect(screen.getByTestId('hillchart-cancel')).toBeTruthy()
  })
})

describe('Copy to clipboard', () => {
  it('writes encoded chart data to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    renderWidget()
    openEditorWithPoints()

    await act(async () => {
      fireEvent.click(screen.getByTestId('hillchart-copy'))
    })

    const expected = encode({ version: '1', points: POINTS })
    expect(writeText).toHaveBeenCalledWith(expected)
  })
})

describe('Paste to comment', () => {
  it('writes encoded data to the textarea and closes the panel', () => {
    const textarea = document.createElement('textarea')
    renderWidget({ commentTextarea: textarea })
    openEditorWithPoints()

    act(() => {
      fireEvent.click(screen.getByTestId('hillchart-save'))
    })

    // Panel should be closed
    const panel = screen.getByTestId('hillchart-panel')
    expect(panel.hasAttribute('open')).toBe(false)

    // Textarea should contain encoded data
    const expected = encode({ version: '1', points: POINTS })
    expect(textarea.value).toBe(expected)
  })

  it('shows error when no textarea is available', () => {
    renderWidget({ commentTextarea: null })
    openEditorWithPoints()

    act(() => {
      fireEvent.click(screen.getByTestId('hillchart-save'))
    })

    // Panel should still be open (error state)
    const panel = screen.getByTestId('hillchart-panel')
    expect(panel.hasAttribute('open')).toBe(true)

    // Should show error message
    expect(screen.getByText(/comment textarea not found/i)).toBeTruthy()
  })
})
