import { useEffect } from 'react'
import type { RefObject } from 'react'
import type { PanelState } from './hillChartReducer.js'

export function useDialogSync(
  panelState: PanelState,
  dialogRef: RefObject<HTMLDialogElement | null>,
  onCancel: () => void,
): void {
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (panelState !== 'hidden') {
      if (!dialog.open) dialog.showModal()
    } else {
      if (dialog.open) dialog.close()
    }
  }, [panelState, dialogRef])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handleCancel = (e: Event) => {
      e.preventDefault()
      onCancel()
    }
    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [dialogRef, onCancel])
}
