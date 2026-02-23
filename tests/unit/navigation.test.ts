import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setupNavigation } from '../../src/github/navigation.js'

beforeEach(() => {
  document.body.innerHTML = ''
})

afterEach(() => {
  vi.restoreAllMocks()
})

function makeMount() {
  const cleanup = vi.fn()
  const mount = vi.fn(() => cleanup)
  return { mount, cleanup }
}

describe('setupNavigation', () => {
  it('calls mount() immediately on setup', () => {
    const { mount } = makeMount()
    const teardown = setupNavigation(mount)
    expect(mount).toHaveBeenCalledOnce()
    teardown()
  })

  it('calls cleanup then re-mounts on turbo:load', () => {
    const { mount, cleanup } = makeMount()
    const teardown = setupNavigation(mount)

    document.dispatchEvent(new Event('turbo:load'))

    expect(cleanup).toHaveBeenCalledOnce()
    expect(mount).toHaveBeenCalledTimes(2)
    teardown()
  })

  it('calls cleanup then re-mounts on pjax:end', () => {
    const { mount, cleanup } = makeMount()
    const teardown = setupNavigation(mount)

    document.dispatchEvent(new Event('pjax:end'))

    expect(cleanup).toHaveBeenCalledOnce()
    expect(mount).toHaveBeenCalledTimes(2)
    teardown()
  })

  it('calls cleanup then re-mounts on popstate', () => {
    const { mount, cleanup } = makeMount()
    const teardown = setupNavigation(mount)

    window.dispatchEvent(new PopStateEvent('popstate'))

    expect(cleanup).toHaveBeenCalledOnce()
    expect(mount).toHaveBeenCalledTimes(2)
    teardown()
  })

  it('re-uses the latest cleanup on each navigation', () => {
    const cleanup1 = vi.fn()
    const cleanup2 = vi.fn()
    let callCount = 0
    const mount = vi.fn(() => {
      callCount++
      return callCount === 1 ? cleanup1 : cleanup2
    })

    const teardown = setupNavigation(mount)
    document.dispatchEvent(new Event('turbo:load'))

    // cleanup1 from initial mount should have been called
    expect(cleanup1).toHaveBeenCalledOnce()
    expect(cleanup2).not.toHaveBeenCalled()

    teardown()
    // cleanup2 from the second mount should now be called
    expect(cleanup2).toHaveBeenCalledOnce()
  })

  it('teardown removes all nav listeners', () => {
    const { mount, cleanup } = makeMount()
    const teardown = setupNavigation(mount)
    teardown()

    const countBefore = mount.mock.calls.length

    document.dispatchEvent(new Event('turbo:load'))
    document.dispatchEvent(new Event('pjax:end'))
    window.dispatchEvent(new PopStateEvent('popstate'))

    // No new mount calls after teardown
    expect(mount.mock.calls.length).toBe(countBefore)
    // cleanup from initial mount called exactly once (by teardown)
    expect(cleanup).toHaveBeenCalledOnce()
  })

  it('teardown calls the current cleanup', () => {
    const { mount, cleanup } = makeMount()
    const teardown = setupNavigation(mount)
    teardown()
    expect(cleanup).toHaveBeenCalledOnce()
  })
})
