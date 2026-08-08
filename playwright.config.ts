import { defineConfig, devices } from "@playwright/test";
import os from "os";
import path from "path";

/** Prefer the user install path — Cursor sandboxes may override PLAYWRIGHT_BROWSERS_PATH. */
const userBrowsers = path.join(os.homedir(), "AppData", "Local", "ms-playwright");
if (
  !process.env.PLAYWRIGHT_BROWSERS_PATH ||
  /cursor-sandbox-cache/i.test(process.env.PLAYWRIGHT_BROWSERS_PATH)
) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = userBrowsers;
}

/**
 * IMS sync / category smoke suite.
 *
 * BASE_URL defaults to the live Vercel pilot. Override for local:
 *   $env:BASE_URL="http://localhost:3000"; npm run test:e2e
 */
const baseURL =
  process.env.BASE_URL?.trim() ||
  process.env.PLAYWRIGHT_BASE_URL?.trim() ||
  "https://store-thru-listing.vercel.app";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
    ...devices["Desktop Chrome"],
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
