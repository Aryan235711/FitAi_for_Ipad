import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.VITE_PORT ?? 5173);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    reducedMotion: "no-preference",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "mobile-safari",
      use: {
        ...devices["iPhone 13"],
        hasTouch: true,
      },
    },
    {
      name: "ipad-pro",
      use: {
        ...devices["iPad Pro 11"],
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: "cross-env VITE_PORT=5173 VITE_E2E_BYPASS_AUTH=true VITE_DISABLE_OVERLAY=true npm run dev:client",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
