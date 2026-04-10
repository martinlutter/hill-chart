import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { RefObject } from 'react'
import { useDialogSync } from '../../src/hooks/useDialogSync.js'
import type { PanelState } from '../../src/hooks/hillChartReducer.js'

function makeDialog(): HTMLDialogElement {
  const dialog = document.createElement('dialog')
  dialog.showModal = vi.fn(() => {
    Object.defineProperty(dialog, 'open', { value: true, writable: true, configurable: true })
  })
  dialog.close = vi.fn(() => {
    Object.defineProperty(dialog, 'open', { value: false, writable: true, configurable: true })
  })
  Object.defineProperty(dialog, 'open', { value: false, writable: true, configurable: true })
  return dialog
}

describe('useDialogSync', () => {
  let dialog: HTMLDialogElement
  let dialogRef: RefObject<HTMLDialogElement | null>

  beforeEach(() => {
    dialog = makeDialog()
    dialogRef = { current: dialog }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('calls showModal() when panelState is "editing" and dialog is closed', () => {
    renderHook(({ panelState, onCancel }) => useDialogSync(panelState, dialogRef, onCancel), {
      initialProps: { panelState: 'editing' as PanelState, onCancel: vi.fn() },
    })
    expect(dialog.showModal).toHaveBeenCalledTimes(1)
    expect(dialog.close).not.toHaveBeenCalled()
  })

  it('calls showModal() when panelState is "saving" and dialog is closed', () => {
    renderHook(({ panelState, onCancel }) => useDialogSync(panelState, dialogRef, onCancel), {
      initialProps: { panelState: 'saving' as PanelState, onCancel: vi.fn() },
    })
    expect(dialog.showModal).toHaveBeenCalledTimes(1)
    expect(dialog.close).not.toHaveBeenCalled()
  })

  it('calls close() when panelState is "hidden" and dialog is open', () => {
    Object.defineProperty(dialog, 'open', { value: true, writable: true, configurable: true })
    renderHook(({ panelState, onCancel }) => useDialogSync(panelState, dialogRef, onCancel), {
      initialProps: { panelState: 'hidden' as PanelState, onCancel: vi.fn() },
    })
    expect(dialog.close).toHaveBeenCalledTimes(1)
    expect(dialog.showModal).not.toHaveBeenCalled()
  })

  it('does NOT call close() when panelState is "hidden" and dialog is already closed', () => {
    Object.defineProperty(dialog, 'open', { value: false, writable: true, configurable: true })
    renderHook(({ panelState, onCancel }) => useDialogSync(panelState, dialogRef, onCancel), {
      initialProps: { panelState: 'hidden' as PanelState, onCancel: vi.fn() },
    })
    expect(dialog.close).not.toHaveBeenCalled()
    expect(dialog.showModal).not.toHaveBeenCalled()
  })

  it('does not throw when dialogRef.current is null', () => {
    const nullRef: RefObject<HTMLDialogElement | null> = { current: null }
    expect(() => {
      renderHook(() => useDialogSync('editing', nullRef, vi.fn()))
    }).not.toThrow()
  })

  it('calls onCancel and prevents default when cancel event is dispatched', () => {
    const onCancel = vi.fn()
    renderHook(() => useDialogSync('editing', dialogRef, onCancel))

    const cancelEvent = new Event('cancel', { cancelable: true })
    const preventDefaultSpy = vi.spyOn(cancelEvent, 'preventDefault')

    act(() => {
      dialog.dispatchEvent(cancelEvent)
    })

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(preventDefaultSpy).toHaveBeenCalledTimes(1)
  })

  it('does not call onCancel after unmount (listener cleaned up)', () => {
    const onCancel = vi.fn()
    const { unmount } = renderHook(() => useDialogSync('editing', dialogRef, onCancel))

    unmount()

    const cancelEvent = new Event('cancel', { cancelable: true })
    act(() => {
      dialog.dispatchEvent(cancelEvent)
    })

    expect(onCancel).not.toHaveBeenCalled()
  })
})
