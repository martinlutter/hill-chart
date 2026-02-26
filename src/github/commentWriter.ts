export interface WriteResult {
  ok: boolean
  error?: string
}

export function writeHillChartComment(
  textarea: HTMLTextAreaElement,
  encoded: string,
): WriteResult {
  try {
    const nativeSetter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value',
    )?.set

    if (!nativeSetter) {
      return { ok: false, error: 'Could not get native textarea value setter' }
    }

    const existing = textarea.value
    const newValue = existing ? `${existing}\n${encoded}` : encoded

    nativeSetter.call(textarea, newValue)
    textarea.dispatchEvent(new Event('input', { bubbles: true }))

    textarea.focus()

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
