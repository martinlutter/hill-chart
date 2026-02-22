/// <reference types="node" />
import { test as base, chromium } from '@playwright/test'
import type { BrowserContext, Page } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const EXTENSION_PATH = path.resolve(import.meta.dirname, '../../dist')
const FIXTURES_PATH = path.resolve(import.meta.dirname, 'fixtures')

type LoadFixtureFn = (fixtureName: string, issueUrl?: string) => Promise<Page>

type TestFixtures = {
  context: BrowserContext
  extensionId: string
  loadFixture: LoadFixtureFn
}

/**
 * Custom Playwright fixture that launches Chromium with the extension loaded.
 * Extensions require a persistent context (not a regular browser.newPage()).
 */
export const test = base.extend<TestFixtures>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    })
    await use(context)
    await context.close()
  },

  extensionId: async ({ context }, use) => {
    // Wait for the extension service worker to register and get the extension ID
    let [background] = context.serviceWorkers()
    if (!background) {
      background = await context.waitForEvent('serviceworker')
    }
    const extensionId = background.url().split('/')[2]
    await use(extensionId)
  },

  /**
   * Helper to load a fixture HTML file by intercepting a GitHub issue URL.
   * This ensures the content script runs — it only fires on
   * github.com/{owner}/{repo}/issues/{number} URLs.
   *
   * @param fixtureName - filename in tests/e2e/fixtures/ (e.g. 'github-issue.html')
   * @param issueUrl - optional GitHub issue URL to intercept (defaults to a stable test URL)
   */
  loadFixture: async ({ context }, use) => {
    const helper: LoadFixtureFn = async (fixtureName, issueUrl = 'https://github.com/test-org/test-repo/issues/1') => {
      const fixturePath = path.join(FIXTURES_PATH, fixtureName)
      const fixtureHtml = fs.readFileSync(fixturePath, 'utf-8')

      const page = await context.newPage()

      // Intercept the GitHub URL and serve our fixture HTML instead.
      // This makes the extension's content script fire (it matches the URL pattern)
      // while giving us full control over the page content.
      await page.route(issueUrl, (route) => {
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: fixtureHtml,
        })
      })

      await page.goto(issueUrl, { waitUntil: 'domcontentloaded' })
      return page
    }

    await use(helper)
  },
})

export const expect = test.expect
