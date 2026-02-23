/**
 * Hill Chart E2E test suite.
 *
 * Tests are organised by implementation phase so progress is visible:
 *   ✅ Phase 5  — extension infrastructure (button injection, shadow DOM, re-mount)
 *   🔲 Phase 7  — widget UI (panel open/close, viewer, editor) — marked test.fixme
 *   🔲 Phase 7  — save / cancel flow                           — marked test.fixme
 */

import { test, expect } from './extension.setup'

// ── Phase 5: Extension Infrastructure ────────────────────────────────────────

test.describe('Button injection', () => {
  test('Hill Chart button appears in .gh-header-actions on an issue with chart data', async ({
    loadFixture,
  }) => {
    const page = await loadFixture('github-issue.html')

    await expect(page.locator('[data-testid="hillchart-button"]')).toBeVisible({
      timeout: 5000,
    })
  })

  test('Hill Chart button appears on an issue without existing chart data', async ({
    loadFixture,
  }) => {
    const page = await loadFixture('github-issue-empty.html')

    await expect(page.locator('[data-testid="hillchart-button"]')).toBeVisible({
      timeout: 5000,
    })
  })

  test('button is inside .gh-header-actions', async ({ loadFixture }) => {
    const page = await loadFixture('github-issue.html')

    // The button is portalled directly into the GitHub header toolbar
    await expect(
      page.locator('.gh-header-actions [data-testid="hillchart-button"]'),
    ).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Shadow DOM', () => {
  test('shadow host has a scoped <style> element injected', async ({ loadFixture }) => {
    const page = await loadFixture('github-issue.html')
    await page.locator('#hillchart-extension-root').waitFor({ state: 'attached', timeout: 5000 })

    const hasStyle = await page.evaluate(() => {
      const host = document.getElementById('hillchart-extension-root')
      return host?.shadowRoot?.querySelector('style') !== null
    })
    expect(hasStyle).toBe(true)
  })

  test('shadow root is in open mode (accessible via JS)', async ({ loadFixture }) => {
    const page = await loadFixture('github-issue.html')
    await page.locator('#hillchart-extension-root').waitFor({ state: 'attached', timeout: 5000 })

    const shadowMode = await page.evaluate(() => {
      const host = document.getElementById('hillchart-extension-root')
      return host?.shadowRoot !== null
    })
    expect(shadowMode).toBe(true)
  })
})

test.describe('Turbo navigation re-mount', () => {
  test('only one shadow host exists after turbo:load event', async ({ loadFixture }) => {
    const page = await loadFixture('github-issue.html')
    await expect(page.locator('[data-testid="hillchart-button"]')).toBeVisible({ timeout: 5000 })

    await page.evaluate(() => document.dispatchEvent(new Event('turbo:load')))
    await page.waitForTimeout(300)

    await expect(page.locator('#hillchart-extension-root')).toHaveCount(1)
  })

  test('only one Hill Chart button exists after turbo:load event', async ({ loadFixture }) => {
    const page = await loadFixture('github-issue.html')
    await expect(page.locator('[data-testid="hillchart-button"]')).toBeVisible({ timeout: 5000 })

    await page.evaluate(() => document.dispatchEvent(new Event('turbo:load')))
    await page.waitForTimeout(300)

    await expect(page.locator('[data-testid="hillchart-button"]')).toHaveCount(1)
  })

  test('button is still visible after pjax:end event', async ({ loadFixture }) => {
    const page = await loadFixture('github-issue.html')
    await expect(page.locator('[data-testid="hillchart-button"]')).toBeVisible({ timeout: 5000 })

    await page.evaluate(() => document.dispatchEvent(new Event('pjax:end')))
    await page.waitForTimeout(300)

    await expect(page.locator('[data-testid="hillchart-button"]')).toBeVisible()
    await expect(page.locator('#hillchart-extension-root')).toHaveCount(1)
  })
})

// ── Phase 7: Widget UI ────────────────────────────────────────────────────────

test.describe('Panel — open and close', () => {
  test.fixme('clicking Hill Chart button opens a panel', async ({ loadFixture }) => {
    const page = await loadFixture('github-issue.html')
    await page.locator('[data-testid="hillchart-button"]').click()
    await expect(page.locator('[data-testid="hillchart-panel"]')).toBeVisible()
  })

  test.fixme('panel has a close button that dismisses it', async ({ loadFixture }) => {
    const page = await loadFixture('github-issue.html')
    await page.locator('[data-testid="hillchart-button"]').click()
    await page.locator('[data-testid="hillchart-panel-close"]').click()
    await expect(page.locator('[data-testid="hillchart-panel"]')).not.toBeVisible()
  })
})

test.describe('Viewer — existing chart data', () => {
  test.fixme('panel shows SVG circles matching existing chart data', async ({ loadFixture }) => {
    // Fixture has 3 points: Login flow, JWT handling, Password reset
    const page = await loadFixture('github-issue.html')
    await page.locator('[data-testid="hillchart-button"]').click()
    const circles = page.locator('[data-testid="hillchart-panel"] circle:not([fill="transparent"])')
    await expect(circles).toHaveCount(3)
  })

  test.fixme('viewer shows an Edit Hill Chart button', async ({ loadFixture }) => {
    const page = await loadFixture('github-issue.html')
    await page.locator('[data-testid="hillchart-button"]').click()
    await expect(page.locator('button:has-text("Edit Hill Chart")')).toBeVisible()
  })
})

test.describe('Editor — empty issue', () => {
  test.fixme('panel opens in edit mode when no chart data exists', async ({ loadFixture }) => {
    const page = await loadFixture('github-issue-empty.html')
    await page.locator('[data-testid="hillchart-button"]').click()
    await expect(page.locator('[data-testid="add-point-form"]')).toBeVisible()
  })

  test.fixme('adding a point creates a circle on the SVG', async ({ loadFixture }) => {
    const page = await loadFixture('github-issue-empty.html')
    await page.locator('[data-testid="hillchart-button"]').click()
    await page.locator('[data-testid="point-description-input"]').fill('Authentication')
    await page.locator('[data-testid="add-point-submit"]').click()
    await expect(page.locator('circle:not([fill="transparent"])')).toHaveCount(1)
    await expect(page.locator('text=Authentication')).toBeVisible()
  })
})

test.describe('Save and cancel', () => {
  test.fixme('clicking Save writes encoded data to the comment textarea', async ({ loadFixture }) => {
    const page = await loadFixture('github-issue-empty.html')
    await page.locator('[data-testid="hillchart-button"]').click()
    await page.locator('[data-testid="point-description-input"]').fill('Auth')
    await page.locator('[data-testid="add-point-submit"]').click()
    await page.locator('[data-testid="hillchart-save"]').click()
    const textareaValue = await page.locator('#new_comment_field').inputValue()
    expect(textareaValue).toContain('<!-- hillchart')
  })

  test.fixme('clicking Cancel discards changes and returns to viewer', async ({ loadFixture }) => {
    const page = await loadFixture('github-issue.html')
    await page.locator('[data-testid="hillchart-button"]').click()
    await page.locator('button:has-text("Edit Hill Chart")').click()
    await page.locator('[data-testid="point-description-input"]').fill('New point')
    await page.locator('[data-testid="add-point-submit"]').click()
    await page.locator('[data-testid="hillchart-cancel"]').click()
    // Should revert to viewer with original 3 points
    const circles = page.locator('circle:not([fill="transparent"])')
    await expect(circles).toHaveCount(3)
  })
})
