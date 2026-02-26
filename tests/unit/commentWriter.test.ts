import { describe, it, expect, vi, beforeEach } from 'vitest'
import { writeHillChartComment } from '../../src/github/commentWriter.js'

function makeTextarea(): HTMLTextAreaElement {
  const el = document.createElement('textarea')
  document.body.appendChild(el)
  return el
}

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('writeHillChartComment', () => {
  it('sets the textarea value to the encoded string', () => {
    const textarea = makeTextarea()
    const encoded = '<!-- hillchart\n{"version":"1","points":[]}\nhillchart -->'

    writeHillChartComment(textarea, encoded)

    expect(textarea.value).toBe(encoded)
  })

  it('appends to existing textarea content', () => {
    const textarea = makeTextarea()
    textarea.value = 'existing comment'

    writeHillChartComment(textarea, 'encoded-data')

    expect(textarea.value).toBe('existing comment\nencoded-data')
  })

  it('dispatches a bubbling input event on the textarea', () => {
    const textarea = makeTextarea()
    const handler = vi.fn()
    textarea.addEventListener('input', handler)

    writeHillChartComment(textarea, 'test')

    expect(handler).toHaveBeenCalledOnce()
    expect(handler.mock.calls[0][0]).toBeInstanceOf(Event)
  })

  it('focuses the textarea', () => {
    const textarea = makeTextarea()
    const focusSpy = vi.spyOn(textarea, 'focus')

    writeHillChartComment(textarea, 'test')

    expect(focusSpy).toHaveBeenCalledOnce()
  })

  it('returns { ok: true } on success', () => {
    const textarea = makeTextarea()

    const result = writeHillChartComment(textarea, 'test')

    expect(result.ok).toBe(true)
    expect(result.error).toBeUndefined()
  })
})
