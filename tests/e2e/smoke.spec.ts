import { test, expect } from './extension.setup'

test('fixture page loads and has expected DOM structure', async ({ loadFixture }) => {
  const page = await loadFixture('github-issue.html')

  // Verify the fixture has the expected GitHub issue DOM elements.
  // .gh-header-actions starts empty (extension injects into it), so check attachment not visibility.
  await expect(page.locator('.gh-header-actions')).toBeAttached()
  await expect(page.locator('#new_comment_field')).toBeVisible()
  await expect(page.locator('form.js-new-comment-form')).toBeVisible()
  await expect(page.locator('.js-discussion').first()).toBeVisible()
})

test('content script loads and mounts into page', async ({ loadFixture }) => {
  const page = await loadFixture('github-issue.html')

  // The content script stub appends a shadow host element.
  // This confirms the extension content script runs on github.com/*/issues/* URLs.
  await expect(page.locator('#hillchart-extension-root')).toBeAttached({ timeout: 5000 })
})
