export interface PageElements {
  isIssuePage: boolean
  issueBodyEl: Element | null
  commentFormEl: HTMLFormElement | null
  commentTextarea: HTMLTextAreaElement | null
  submitButton: HTMLButtonElement | null
  toolbarAnchor: Element | null
  /** Raw innerHTML of the first issue body comment — contains the hillchart HTML comment block */
  issueBodyText: string
}

// Matches /owner/repo/issues/123 but not /issues, /issues/new, or /pulls/...
const ISSUE_PATH_RE = /^\/[^/]+\/[^/]+\/issues\/\d+$/

export function detectIssuePage(url = window.location.href): PageElements {
  const empty: PageElements = {
    isIssuePage: false,
    issueBodyEl: null,
    commentFormEl: null,
    commentTextarea: null,
    submitButton: null,
    toolbarAnchor: null,
    issueBodyText: '',
  }

  let isIssuePage = false
  try {
    const { pathname } = new URL(url)
    isIssuePage = ISSUE_PATH_RE.test(pathname)
  } catch {
    return empty
  }

  if (!isIssuePage) return empty

  const issueBodyEl = document.querySelector('.js-discussion .timeline-comment .comment-body')
  const commentFormEl = document.querySelector<HTMLFormElement>('form.js-new-comment-form')
  const commentTextarea = document.querySelector<HTMLTextAreaElement>('#new_comment_field')
  const submitButton =
    commentFormEl?.querySelector<HTMLButtonElement>('button[type="submit"].btn-primary') ?? null
  const toolbarAnchor = document.querySelector('.gh-header-actions')

  return {
    isIssuePage: true,
    issueBodyEl,
    commentFormEl,
    commentTextarea,
    submitButton,
    toolbarAnchor,
    issueBodyText: issueBodyEl?.innerHTML ?? '',
  }
}
