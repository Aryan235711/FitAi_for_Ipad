import { test, expect, type Page } from "@playwright/test";

const DASHBOARD_URL = "/dashboard";
const VITALITY_ORB_SELECTOR = "[data-testid=\"vitality-orb\"]";
const VITALITY_ORB_ROTATOR = "[data-testid=\"vitality-orb-rotator\"]";

const waitForDashboard = async (page: Page) => {
  await page.goto(DASHBOARD_URL, { waitUntil: "networkidle" });
};

const waitForVitalityOrb = async (page: Page) => {
  await page.waitForSelector(VITALITY_ORB_SELECTOR, { timeout: 10_000 });
  await page.waitForSelector(VITALITY_ORB_ROTATOR, { timeout: 10_000 });
};

test.describe("Visual Regression Tests", () => {
  test("VitalityOrb renders and animates correctly", async ({ page }) => {
    await waitForDashboard(page);
    await waitForVitalityOrb(page);

    // Let the SVG morph/rotation settle before capturing the snapshot
    await page.waitForTimeout(2000);
    await expect(page.locator(VITALITY_ORB_SELECTOR)).toHaveScreenshot(
      "vitality-orb.png",
    );
  });

  test("Dashboard layout stays stable", async ({ page }) => {
    await waitForDashboard(page);

    // Allow lazy components and CSS animations to settle
    await page.waitForTimeout(3000);
    await expect(page).toHaveScreenshot("dashboard-full.png");
  });

  test("VitalityOrb animation state remains active", async ({ page }) => {
    await waitForDashboard(page);
    await waitForVitalityOrb(page);

    const animationName = await page.locator(VITALITY_ORB_ROTATOR).evaluate((el) => {
      const computed = getComputedStyle(el);
      return computed.animationName;
    });

    expect(animationName).toBe("vitality-orb-spin");
  });
});
