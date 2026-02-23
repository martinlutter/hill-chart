export interface WriteResult {
  ok: boolean
  error?: string
}

export async function writeHillChartComment(
  textarea: HTMLTextAreaElement,
  button: HTMLButtonElement,
  encoded: string,
): Promise<WriteResult> {
  try {
    const nativeSetter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value',
    )?.set

    if (!nativeSetter) {
      return { ok: false, error: 'Could not get native textarea value setter' }
    }

    nativeSetter.call(textarea, encoded)
    textarea.dispatchEvent(new Event('input', { bubbles: true }))

    // Let React process the synthetic input event before submitting
    await new Promise<void>((resolve) => setTimeout(resolve, 100))

    button.click()
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
