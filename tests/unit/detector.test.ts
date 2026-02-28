import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { detectIssuePage, observeIssuePage } from '../../src/github/detector.js'

const ISSUE_URL = 'https://github.com/martinlutter/skills-expand-your-team-with-copilot/issues/9'

function buildDOM() {
  document.body.innerHTML = `
    <div data-testid="issue-header">
      <bdi data-testid="issue-title">Dark Mode</bdi>
      <div data-component="PH_Actions"></div>
    </div>
    <div data-testid="issue-viewer-container">
      <div data-testid="issue-body">
        <div data-testid="issue-body-viewer">
          <div data-testid="markdown-body" class="markdown-body">
            <div class="markdown-body">Issue body text <!-- hillchart\n{}\nhillchart --></div>
          </div>
        </div>
      </div>
    </div>
    <div class="CommentBox-root">
      <fieldset class="MarkdownEditor-root">
        <textarea id="new_comment_field"></textarea>
        <button type="submit" data-variant="primary">Comment</button>
      </fieldset>
    </div>
  `
}

beforeEach(buildDOM)
afterEach(() => { document.body.innerHTML = '' })

describe('detectIssuePage — URL detection', () => {
  it('returns isIssuePage: true for a valid issue URL', () => {
    const result = detectIssuePage(ISSUE_URL)
    expect(result.isIssuePage).toBe(true)
  })

  it('returns isIssuePage: false for the issues list page', () => {
    expect(detectIssuePage('https://github.com/octocat/repo/issues').isIssuePage).toBe(false)
  })

  it('returns isIssuePage: false for /issues/new', () => {
    expect(detectIssuePage('https://github.com/octocat/repo/issues/new').isIssuePage).toBe(false)
  })

  it('returns isIssuePage: false for a PR URL', () => {
    expect(detectIssuePage('https://github.com/octocat/repo/pull/5').isIssuePage).toBe(false)
  })

  it('returns isIssuePage: false for the repo root', () => {
    expect(detectIssuePage('https://github.com/octocat/repo').isIssuePage).toBe(false)
  })

  it('returns isIssuePage: false for an invalid URL', () => {
    expect(detectIssuePage('not-a-url').isIssuePage).toBe(false)
  })
})

describe('detectIssuePage — DOM element retrieval', () => {
  it('finds commentTextarea via [class^="CommentBox"] fieldset[class^="MarkdownEditor"] textarea', () => {
    const result = detectIssuePage(ISSUE_URL)
    expect(result.commentTextarea).not.toBeNull()
    expect(result.commentTextarea?.tagName).toBe('TEXTAREA')
  })

  it('finds toolbarAnchor via [data-component="PH_Actions"]', () => {
    const result = detectIssuePage(ISSUE_URL)
    expect(result.toolbarAnchor).not.toBeNull()
    expect((result.toolbarAnchor as HTMLElement).dataset.component).toBe('PH_Actions')
  })

  it('populates issueBodyText with innerHTML of the issue body element', () => {
    const result = detectIssuePage(ISSUE_URL)
    expect(result.issueBodyText).toContain('Issue body text')
  })
})

describe('detectIssuePage — missing DOM elements', () => {
  it('returns empty issueBodyText when issue body is absent', () => {
    document.body.innerHTML = `
      <div class="CommentBox-root">
        <fieldset class="MarkdownEditor-root">
          <textarea></textarea>
          <button data-variant="primary">Comment</button>
        </fieldset>
      </div>
    `
    const result = detectIssuePage(ISSUE_URL)
    expect(result.isIssuePage).toBe(true)
    expect(result.issueBodyText).toBe('')
  })

  it('returns null commentTextarea when CommentBox is absent', () => {
    document.body.innerHTML = `
      <div data-testid="issue-body-viewer">
        <div data-testid="markdown-body" class="markdown-body"></div>
      </div>
    `
    const result = detectIssuePage(ISSUE_URL)
    expect(result.commentTextarea).toBeNull()
  })
})

describe('detectIssuePage — non-issue page returns all nulls', () => {
  it('returns empty result for a list URL', () => {
    const result = detectIssuePage('https://github.com/octocat/repo/issues')
    expect(result.isIssuePage).toBe(false)
    expect(result.commentTextarea).toBeNull()
    expect(result.toolbarAnchor).toBeNull()
    expect(result.issueBodyText).toBe('')
  })
})

describe('observeIssuePage', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    // observeIssuePage calls detectIssuePage() without args, so we need the
    // location to look like an issue page
    vi.stubGlobal('location', { href: ISSUE_URL })
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
  })

  it('calls onReady when the toolbar anchor is added to the DOM', async () => {
    const onReady = vi.fn()
    const cleanup = observeIssuePage(onReady)

    document.body.innerHTML = `<div data-component="PH_Actions"></div>`
    await Promise.resolve()

    expect(onReady).toHaveBeenCalledOnce()
    cleanup()
  })

  it('passes full PageElements to onReady', async () => {
    const onReady = vi.fn()
    observeIssuePage(onReady)

    document.body.innerHTML = `
      <div data-component="PH_Actions"></div>
      <div data-testid="issue-body-viewer"><p>hello</p></div>
      <div class="CommentBox-root">
        <fieldset class="MarkdownEditor-root">
          <textarea></textarea>
        </fieldset>
      </div>
    `
    await Promise.resolve()

    const page = onReady.mock.calls[0][0]
    expect(page.isIssuePage).toBe(true)
    expect(page.toolbarAnchor).not.toBeNull()
    expect(page.issueBodyText).toContain('hello')
    expect(page.commentTextarea).not.toBeNull()
  })

  it('does not call onReady for mutations that do not include the toolbar', async () => {
    const onReady = vi.fn()
    const cleanup = observeIssuePage(onReady)

    document.body.appendChild(document.createElement('p'))
    await Promise.resolve()

    expect(onReady).not.toHaveBeenCalled()
    cleanup()
  })

  it('is one-shot — disconnects after the first match', async () => {
    const onReady = vi.fn()
    observeIssuePage(onReady)

    document.body.innerHTML = `<div data-component="PH_Actions"></div>`
    await Promise.resolve()
    expect(onReady).toHaveBeenCalledOnce()

    // Further mutations should not re-trigger
    document.body.appendChild(document.createElement('div'))
    await Promise.resolve()
    expect(onReady).toHaveBeenCalledOnce()
  })

  it('cleanup prevents onReady from being called', async () => {
    const onReady = vi.fn()
    const cleanup = observeIssuePage(onReady)
    cleanup()

    document.body.innerHTML = `<div data-component="PH_Actions"></div>`
    await Promise.resolve()

    expect(onReady).not.toHaveBeenCalled()
  })
})
