import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { detectIssuePage } from '../../src/github/detector.js'

const ISSUE_URL = 'https://github.com/octocat/example-repo/issues/42'

function buildDOM() {
  document.body.innerHTML = `
    <div class="gh-header-actions"></div>
    <div class="js-discussion">
      <div class="timeline-comment">
        <div class="comment-body">Issue body text <!-- hillchart\n{}\nhillchart --></div>
      </div>
    </div>
    <form class="js-new-comment-form">
      <textarea id="new_comment_field"></textarea>
      <button type="submit" class="btn btn-primary">Comment</button>
    </form>
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
  it('finds issueBodyEl via .js-discussion .timeline-comment .comment-body', () => {
    const result = detectIssuePage(ISSUE_URL)
    expect(result.issueBodyEl).not.toBeNull()
  })

  it('finds commentFormEl via form.js-new-comment-form', () => {
    const result = detectIssuePage(ISSUE_URL)
    expect(result.commentFormEl).not.toBeNull()
    expect(result.commentFormEl?.tagName).toBe('FORM')
  })

  it('finds commentTextarea via #new_comment_field', () => {
    const result = detectIssuePage(ISSUE_URL)
    expect(result.commentTextarea).not.toBeNull()
    expect(result.commentTextarea?.id).toBe('new_comment_field')
  })

  it('finds submitButton via button[type="submit"].btn-primary inside the form', () => {
    const result = detectIssuePage(ISSUE_URL)
    expect(result.submitButton).not.toBeNull()
    expect(result.submitButton?.type).toBe('submit')
  })

  it('finds toolbarAnchor via .gh-header-actions', () => {
    const result = detectIssuePage(ISSUE_URL)
    expect(result.toolbarAnchor).not.toBeNull()
  })

  it('populates issueBodyText with innerHTML of the issue body element', () => {
    const result = detectIssuePage(ISSUE_URL)
    expect(result.issueBodyText).toContain('Issue body text')
  })
})

describe('detectIssuePage — missing DOM elements', () => {
  it('returns null elements when issue body is absent', () => {
    document.body.innerHTML = `
      <form class="js-new-comment-form">
        <textarea id="new_comment_field"></textarea>
        <button type="submit" class="btn btn-primary">Comment</button>
      </form>
    `
    const result = detectIssuePage(ISSUE_URL)
    expect(result.isIssuePage).toBe(true)
    expect(result.issueBodyEl).toBeNull()
    expect(result.issueBodyText).toBe('')
  })

  it('returns null submitButton when form is absent', () => {
    document.body.innerHTML = `<div class="js-discussion"><div class="timeline-comment"><div class="comment-body"></div></div></div>`
    const result = detectIssuePage(ISSUE_URL)
    expect(result.submitButton).toBeNull()
    expect(result.commentFormEl).toBeNull()
  })
})

describe('detectIssuePage — non-issue page returns all nulls', () => {
  it('returns empty result for a list URL', () => {
    const result = detectIssuePage('https://github.com/octocat/repo/issues')
    expect(result.isIssuePage).toBe(false)
    expect(result.issueBodyEl).toBeNull()
    expect(result.commentTextarea).toBeNull()
    expect(result.toolbarAnchor).toBeNull()
    expect(result.issueBodyText).toBe('')
  })
})
