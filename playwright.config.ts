import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 4014);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

/**
 * Playwright config for the Wet Olympics E2E suite.
 *
 * The dev server is expected to be running already at PORT (default 4014).
 * Run: `PORT=4014 npm run dev &` then `npx playwright test --reporter=line`.
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["line"]],
  use: {
    baseURL: BASE_URL,
    actionTimeout: 7_000,
    navigationTimeout: 15_000,
    trace: "retain-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "desktop",
      testIgnore: /mobile\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      // Use Chromium with iPhone 12 viewport + UA so we don't depend on the
      // webkit browser bundle (which requires extra system libs to install).
      name: "mobile",
      testMatch: /mobile\.spec\.ts/,
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) " +
          "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3,
      },
    },
  ],
});
