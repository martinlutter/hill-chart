import { describe, it, expect, vi, beforeEach } from 'vitest'
import { writeHillChartComment } from '../../src/github/commentWriter.js'

function makeTextarea(): HTMLTextAreaElement {
  const el = document.createElement('textarea')
  document.body.appendChild(el)
  return el
}

function makeButton(): HTMLButtonElement {
  const el = document.createElement('button')
  el.type = 'submit'
  document.body.appendChild(el)
  return el
}

beforeEach(() => {
  document.body.innerHTML = ''
  vi.useFakeTimers()
})

describe('writeHillChartComment', () => {
  it('sets the textarea value to the encoded string', async () => {
    const textarea = makeTextarea()
    const button = makeButton()
    const encoded = '<!-- hillchart\n{"version":"1","points":[]}\nhillchart -->'

    const promise = writeHillChartComment(textarea, button, encoded)
    await vi.runAllTimersAsync()
    await promise

    expect(textarea.value).toBe(encoded)
  })

  it('dispatches a bubbling input event on the textarea', async () => {
    const textarea = makeTextarea()
    const button = makeButton()
    const handler = vi.fn()
    textarea.addEventListener('input', handler)

    const promise = writeHillChartComment(textarea, button, 'test')
    await vi.runAllTimersAsync()
    await promise

    expect(handler).toHaveBeenCalledOnce()
    expect(handler.mock.calls[0][0]).toBeInstanceOf(Event)
  })

  it('clicks the submit button after the delay', async () => {
    const textarea = makeTextarea()
    const button = makeButton()
    const clickSpy = vi.spyOn(button, 'click')

    const promise = writeHillChartComment(textarea, button, 'test')
    await vi.runAllTimersAsync()
    await promise

    expect(clickSpy).toHaveBeenCalledOnce()
  })

  it('does not click the button before the 100ms delay elapses', async () => {
    const textarea = makeTextarea()
    const button = makeButton()
    const clickSpy = vi.spyOn(button, 'click')

    writeHillChartComment(textarea, button, 'test')
    // Don't advance timers — button should not have been clicked yet
    expect(clickSpy).not.toHaveBeenCalled()

    await vi.runAllTimersAsync()
  })

  it('returns { ok: true } on success', async () => {
    const textarea = makeTextarea()
    const button = makeButton()

    const promise = writeHillChartComment(textarea, button, 'test')
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.ok).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('returns { ok: false } when button.click() throws', async () => {
    const textarea = makeTextarea()
    const button = makeButton()
    vi.spyOn(button, 'click').mockImplementation(() => {
      throw new Error('Submit blocked')
    })

    const promise = writeHillChartComment(textarea, button, 'test')
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.ok).toBe(false)
    expect(result.error).toContain('Submit blocked')
  })
})
