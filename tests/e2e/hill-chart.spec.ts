/**
 * Hill Chart E2E test suite.
 *
 * Tests are organised by implementation phase so progress is visible:
 *   ✅ Phase 5  — extension infrastructure (button injection, shadow DOM, re-mount)
 *   ✅ Phase 7  — widget UI (panel open/close, viewer, editor, save/cancel)
 *   ✅ Phase 8  — full E2E suite (drag interaction completes the required scenarios)
 *
 * Shadow DOM strategy:
 *   - Light DOM elements (toolbar button, textarea): page.locator() directly
 *   - Shadow DOM elements (panel, SVG, forms): inShadow(page).locator(...)
 */

import { test, expect } from './extension.setup'
import type { Page } from '@playwright/test'

/** Scopes a locator chain inside the extension shadow root. */
function inShadow(page: Page) {
  return page.locator('#hillchart-extension-root')
}

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

  test('button is inside [data-component="PH_Actions"]', async ({ loadFixture }) => {
    const page = await loadFixture('github-issue.html')

    // The button is portalled directly into the GitHub header toolbar
    await expect(
      page.locator('[data-component="PH_Actions"] [data-testid="hillchart-button"]'),
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
  test('clicking Hill Chart button opens a panel', async ({ loadFixture }) => {
    const page = await loadFixture('github-issue.html')
    await page.locator('[data-testid="hillchart-button"]').click()
    await expect(inShadow(page).locator('[data-testid="hillchart-panel"]')).toBeVisible()
  })

  test('panel has a close button that dismisses it', async ({ loadFixture }) => {
    const page = await loadFixture('github-issue.html')
    const shadow = inShadow(page)
    await page.locator('[data-testid="hillchart-button"]').click()
    await shadow.locator('[data-testid="hillchart-panel-close"]').click()
    await expect(shadow.locator('[data-testid="hillchart-panel"]')).not.toBeVisible()
  })
})

test.describe('Viewer — existing chart data', () => {
  test('panel shows SVG circles matching existing chart data', async ({ loadFixture }) => {
    // Fixture has 3 points: Login flow, JWT handling, Password reset
    const page = await loadFixture('github-issue.html')
    await page.locator('[data-testid="hillchart-button"]').click()
    // Viewer renders one colored circle per point (no transparent hit circles)
    const circles = inShadow(page).locator('circle:not([fill="transparent"])')
    await expect(circles).toHaveCount(3)
  })

  test('viewer shows an Edit Hill Chart button', async ({ loadFixture }) => {
    const page = await loadFixture('github-issue.html')
    await page.locator('[data-testid="hillchart-button"]').click()
    await expect(inShadow(page).locator('button:has-text("Edit Hill Chart")')).toBeVisible()
  })
})

test.describe('Editor — empty issue', () => {
  test('panel opens in edit mode when no chart data exists', async ({ loadFixture }) => {
    const page = await loadFixture('github-issue-empty.html')
    await page.locator('[data-testid="hillchart-button"]').click()
    await expect(inShadow(page).locator('[data-testid="add-point-form"]')).toBeVisible()
  })

  test('adding a point creates a circle on the SVG', async ({ loadFixture }) => {
    const page = await loadFixture('github-issue-empty.html')
    await page.locator('[data-testid="hillchart-button"]').click()
    const shadow = inShadow(page)
    await shadow.locator('[data-testid="point-description-input"]').fill('Authentication')
    await shadow.locator('[data-testid="add-point-submit"]').click()
    // Editor renders one transparent hit circle + one colored circle per point
    await expect(shadow.locator('circle:not([fill="transparent"])')).toHaveCount(1)
    // SVG <text> label is visible
    await expect(shadow.locator('text=Authentication')).toBeVisible()
  })
})

test.describe('Drag interaction', () => {
  test('dragging a point changes its x position on the hill', async ({ loadFixture }) => {
    const page = await loadFixture('github-issue.html')
    await page.locator('[data-testid="hillchart-button"]').click()
    const shadow = inShadow(page)

    // Switch to edit mode (fixture has existing data so viewer opens first)
    await shadow.locator('button:has-text("Edit Hill Chart")').click()

    // Get initial screen position and SVG cx of the "JWT handling" point (x=30)
    const initialState = await page.evaluate(() => {
      const host = document.getElementById('hillchart-extension-root')
      const group = host?.shadowRoot?.querySelector<SVGGElement>('[data-point-id="bbbb-2222"]')
      const hitCircle = group?.querySelector<SVGCircleElement>('circle[fill="transparent"]')
      if (!hitCircle) return null
      const rect = hitCircle.getBoundingClientRect()
      return {
        screenX: rect.left + rect.width / 2,
        screenY: rect.top + rect.height / 2,
        cx: parseFloat(hitCircle.getAttribute('cx') ?? '0'),
      }
    })
    expect(initialState).not.toBeNull()

    // Drag the point to the right
    await page.mouse.move(initialState!.screenX, initialState!.screenY)
    await page.mouse.down()
    await page.mouse.move(initialState!.screenX + 80, initialState!.screenY, { steps: 10 })
    await page.mouse.up()

    // Assert the circle's cx increased (point moved right along the hill curve)
    const newCx = await page.evaluate(() => {
      const host = document.getElementById('hillchart-extension-root')
      const group = host?.shadowRoot?.querySelector<SVGGElement>('[data-point-id="bbbb-2222"]')
      const visibleCircle = group?.querySelector<SVGCircleElement>('circle:not([fill="transparent"])')
      return visibleCircle ? parseFloat(visibleCircle.getAttribute('cx') ?? '0') : null
    })
    expect(newCx).not.toBeNull()
    expect(newCx).toBeGreaterThan(initialState!.cx)
  })
})

test.describe('Save and cancel', () => {
  test('clicking Save writes encoded data to the comment textarea', async ({ loadFixture }) => {
    const page = await loadFixture('github-issue-empty.html')
    await page.locator('[data-testid="hillchart-button"]').click()
    const shadow = inShadow(page)

    await shadow.locator('[data-testid="point-description-input"]').fill('Auth')
    await shadow.locator('[data-testid="add-point-submit"]').click()
    await shadow.locator('[data-testid="hillchart-save"]').click()

    // Save closes the panel and appends encoded data to the textarea
    await expect(shadow.locator('[data-testid="hillchart-panel"]')).not.toBeVisible({
      timeout: 5000,
    })

    const textareaValue = await page.locator('#new_comment_field').inputValue()
    expect(textareaValue).toContain('<!-- hillchart')
  })

  test('clicking Cancel discards changes and returns to viewer', async ({ loadFixture }) => {
    const page = await loadFixture('github-issue.html')
    await page.locator('[data-testid="hillchart-button"]').click()
    const shadow = inShadow(page)

    await shadow.locator('button:has-text("Edit Hill Chart")').click()
    await shadow.locator('[data-testid="point-description-input"]').fill('New point')
    await shadow.locator('[data-testid="add-point-submit"]').click()
    await shadow.locator('[data-testid="hillchart-cancel"]').click()

    // Should revert to viewer with original 3 saved points (no transparent circles in viewer)
    await expect(shadow.locator('circle:not([fill="transparent"])')).toHaveCount(3)
  })
})
