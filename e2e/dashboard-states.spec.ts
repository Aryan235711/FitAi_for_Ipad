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

test.describe("Dashboard state transitions", () => {
  test("shows loading banner when metrics are loading", async ({ page }) => {
    await applyE2EState(page, { fitness: { isLoading: true } });
    await page.goto("/");

    await expect(page.getByTestId("state-loading")).toBeVisible();
  });

  test("renders data cards when metrics arrive", async ({ page }) => {
    await applyE2EState(page, { fitness: { metrics: [sampleMetric] } });
    await page.goto("/");

    await expect(page.getByTestId("state-loading")).toHaveCount(0);
    await expect(page.getByTestId("card-vitality-orb")).toBeVisible();
  });

  test("shows error banner when metrics fail", async ({ page }) => {
    await applyE2EState(page, { fitness: { errorMessage: "Metrics temporarily unavailable", metrics: [] } });
    await page.goto("/");

    await expect(page.getByTestId("state-error")).toContainText("Metrics temporarily unavailable");
  });
});
