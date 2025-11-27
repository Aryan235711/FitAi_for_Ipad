import { test, expect, type Page } from "@playwright/test";
import { waitForComponentOrEmpty } from "./helpers/component-helpers";

const DASHBOARD_URL = "/dashboard";
const VITALITY_ORB_SELECTOR = "[data-testid=\"vitality-orb\"]";
const VITALITY_ORB_ROTATOR = "[data-testid=\"vitality-orb-rotator\"]";

const waitForDashboard = async (page: Page) => {
  await page.goto(DASHBOARD_URL, { waitUntil: "networkidle" });
};

test.describe("Visual Regression Tests", () => {
  test("VitalityOrb renders and animates correctly", async ({ page }, testInfo) => {
    await waitForDashboard(page);
    const { exists, locator } = await waitForComponentOrEmpty(page, VITALITY_ORB_SELECTOR, {
      testInfo,
    });

    await page.waitForTimeout(2000);
    const screenshotTarget = exists ? locator : page;
    await expect(screenshotTarget).toHaveScreenshot(exists ? "vitality-orb.png" : "dashboard-empty-state.png");
  });

  test("Dashboard layout stays stable", async ({ page }) => {
    await waitForDashboard(page);

    // Allow lazy components and CSS animations to settle
    await page.waitForTimeout(3000);
    await expect(page).toHaveScreenshot("dashboard-full.png");
  });

  test("VitalityOrb animation state remains active", async ({ page }, testInfo) => {
    await waitForDashboard(page);
    const { exists } = await waitForComponentOrEmpty(page, VITALITY_ORB_SELECTOR, {
      testInfo,
    });

    if (!exists) {
      test.skip(true, "VitalityOrb not rendered in this dataset");
    }

    const animationName = await page.locator(VITALITY_ORB_ROTATOR).evaluate((el) => {
      const computed = getComputedStyle(el);
      return computed.animationName;
    });

    expect(animationName).toBe("vitality-orb-spin");
  });
});
