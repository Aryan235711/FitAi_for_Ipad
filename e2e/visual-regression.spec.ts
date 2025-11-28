import { test, expect } from "@playwright/test";
import { applyE2EState } from "./utils";

const sampleMetric = {
  id: 1,
  userId: "e2e-user",
  date: "2024-01-01",
  recoveryScore: 85,
  sleepScore: 82,
  hrv: 65,
  steps: 7000,
  workoutIntensity: 6,
  sleepConsistency: 75,
  rhr: 52,
};

test.describe("Visual regression tests", () => {
  // Disable animations before each test to avoid pixel diffs
  test.beforeEach(async ({ page }) => {
    await page.addStyleTag({
      content: `*, *::before, *::after { 
        transition: none !important; 
        animation: none !important; 
        transition-duration: 0s !important;
        animation-duration: 0s !important;
      }`
    });
  });

  test("dashboard renders consistently with data", async ({ page }) => {
    await applyE2EState(page, { fitness: { metrics: [sampleMetric] } });
    await page.goto("/");

    // Wait for content to fully load
    await page.waitForSelector('[data-testid="card-vitality-orb"]');

    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot("dashboard-with-data.png", {
      fullPage: true,
      animations: "disabled",
    });
  });

  test("dashboard loading state renders consistently", async ({ page }) => {
    await applyE2EState(page, { fitness: { isLoading: true } });
    await page.goto("/");

    await page.waitForSelector('[data-testid="state-loading"]');

    await expect(page).toHaveScreenshot("dashboard-loading.png", {
      fullPage: true,
      animations: "disabled",
    });
  });

  test("dashboard error state renders consistently", async ({ page }) => {
    await applyE2EState(page, { 
      fitness: { 
        errorMessage: "Test error message", 
        metrics: [] 
      } 
    });
    await page.goto("/");

    await page.waitForSelector('[data-testid="state-error"]');

    await expect(page).toHaveScreenshot("dashboard-error.png", {
      fullPage: true,
      animations: "disabled",
    });
  });
});
