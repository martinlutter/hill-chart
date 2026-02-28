import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import { HillChartWidget } from '../../src/components/HillChartWidget.js'
import { EDIT_INLINE_EVENT } from '../../src/github/inlineRenderer.js'
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

function renderWidget() {
  const anchor = document.createElement('div')
  document.body.appendChild(anchor)
  return render(
    <HillChartWidget
      issueBodyText=""
      commentTextarea={null}
      toolbarAnchor={anchor}
    />,
  )
}

describe('HillChartWidget inline edit event', () => {
  it('opens editor with correct points when hillchart:edit-inline fires', () => {
    renderWidget()

    act(() => {
      window.dispatchEvent(
        new CustomEvent(EDIT_INLINE_EVENT, { detail: { points: POINTS } }),
      )
    })

    // Panel should be open in editing mode
    const panel = screen.getByTestId('hillchart-panel')
    expect(panel).toBeTruthy()
    expect(panel.hasAttribute('open')).toBe(true)

    // Should show save/cancel buttons (editing mode, not viewing)
    expect(screen.getByTestId('hillchart-save')).toBeTruthy()
    expect(screen.getByTestId('hillchart-cancel')).toBeTruthy()
  })
})
