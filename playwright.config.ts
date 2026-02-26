import { defineConfig } from "@playwright/test";
import path from "path";

const EXTENSION_PATH = path.resolve(import.meta.dirname, "dist");

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  // Run tests serially — extension context is shared
  fullyParallel: false,
  reporter: "list",
  use: {
    // Extensions require a persistent context; configured per-project below
    headless: false,
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: "chrome-extension",
      use: {
        browserName: "chromium",
        // launchPersistentContext is handled in tests/e2e/extension.setup.ts
        launchOptions: {
          args: [
            `--disable-extensions-except=${EXTENSION_PATH}`,
            `--load-extension=${EXTENSION_PATH}`,
            "--no-sandbox",
            "--disable-setuid-sandbox",
          ],
        },
      },
    },
  ],
  // Build must be run before E2E tests
  webServer: undefined,
});
