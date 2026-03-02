export interface PageElements {
  isIssuePage: boolean
  commentTextarea: HTMLTextAreaElement | null
  toolbarAnchor: Element | null
  /** Raw innerHTML of the first issue body comment — contains the hillchart HTML comment block */
  issueBodyText: string
}

// Matches /owner/repo/issues/123 but not /issues, /issues/new, or /pulls/...
const ISSUE_PATH_RE = /^\/[^/]+\/[^/]+\/issues\/\d+$/

export function detectIssuePage(url = window.location.href): PageElements {
  const empty: PageElements = {
    isIssuePage: false,
    commentTextarea: null,
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

  const issueBodyEl = document.querySelector(
    '[data-testid="issue-body-viewer"]',
  )
  const commentTextarea = document.querySelector<HTMLTextAreaElement>(
    '[class^="CommentBox"] fieldset[class^="MarkdownEditor"] textarea',
  )
  const toolbarAnchor = document.querySelector('[data-component="PH_Actions"]')

  return {
    isIssuePage: true,
    commentTextarea,
    toolbarAnchor,
    issueBodyText: issueBodyEl?.innerHTML ?? '',
  }
}

/**
 * Watches for the issue page DOM to become ready or change (e.g. when another
 * extension like Zenhub tears down and re-creates the page content).
 * Calls `onReady` whenever the toolbar anchor element changes (including the
 * first time it appears). Returns a cleanup function.
 */
export function observeIssuePage(
  currentAnchor: Element | null,
  onReady: (page: PageElements) => void,
): () => void {
  let knownAnchor = currentAnchor
  const observer = new MutationObserver(() => {
    const page = detectIssuePage()
    if (!page.toolbarAnchor) return
    if (page.toolbarAnchor === knownAnchor) return
    knownAnchor = page.toolbarAnchor
    onReady(page)
  })
  observer.observe(document.body, { childList: true, subtree: true })
  return () => observer.disconnect()
}

/** Returns all elements on the page that could contain hillchart data. */
export function findCommentBodies(): Element[] {
  return Array.from(
    document.querySelectorAll(
      '[data-testid="issue-body-viewer"], [data-testid="comment-body"], .timeline-comment .comment-body',
    ),
  )
}
