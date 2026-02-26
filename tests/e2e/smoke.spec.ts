import { test, expect } from './extension.setup'

test('fixture page loads and has expected DOM structure', async ({ loadFixture }) => {
  const page = await loadFixture('github-issue.html')

  // Verify the fixture has the expected GitHub issue DOM elements.
  // [data-component="PH_Actions"] starts empty (extension injects into it), so check attachment not visibility.
  await expect(page.locator('[data-component="PH_Actions"]')).toBeAttached()
  await expect(page.locator('[class^="CommentBox"] fieldset[class^="MarkdownEditor"] textarea')).toBeVisible()
  await expect(page.locator('[class^="CommentBox"] fieldset[class^="MarkdownEditor"] button[data-variant="primary"]')).toBeVisible()
  await expect(page.locator('[data-testid="issue-body-viewer"]').first()).toBeVisible()
})

test('content script mounts shadow host on issue page', async ({ loadFixture }) => {
  const page = await loadFixture('github-issue.html')

  // Confirms the extension content script runs on github.com/*/issues/* URLs
  // and creates the shadow DOM host element.
  await expect(page.locator('#hillchart-extension-root')).toBeAttached({ timeout: 5000 })
})
