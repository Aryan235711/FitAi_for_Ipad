import { test, expect } from "@playwright/test";
import { applyE2EState } from "./utils";

test.describe("VitalityOrb Visual Tests", () => {
  test("orb rotates continuously", async ({ page }) => {
    await applyE2EState(page, {});
    await page.goto("/");

    const card = page.getByTestId("card-vitality-orb");
    await expect(card).toBeVisible();
    await card.scrollIntoViewIfNeeded();

    const orb = page.getByTestId("vitality-orb");
    await expect(orb).toBeVisible();

    const rotator = page.getByTestId("vitality-orb-rotator");
    const initialTransform = await rotator.evaluate((el) => getComputedStyle(el).transform);

    await page.waitForTimeout(7500);

    const laterTransform = await rotator.evaluate((el) => getComputedStyle(el).transform);
    expect(initialTransform).not.toEqual(laterTransform);
  });

  test("rotation indicator dot moves", async ({ page }) => {
    await applyE2EState(page, {});
    await page.goto("/");

    const card = page.getByTestId("card-vitality-orb");
    await expect(card).toBeVisible();
    await card.scrollIntoViewIfNeeded();

    const dot = page.getByTestId("vitality-orb-indicator");
    await expect(dot).toBeVisible();

    const firstBox = await dot.boundingBox();
    await page.waitForTimeout(7500);
    const secondBox = await dot.boundingBox();

    expect(firstBox && secondBox).toBeTruthy();
    const deltaX = Math.abs((firstBox?.x ?? 0) - (secondBox?.x ?? 0));
    const deltaY = Math.abs((firstBox?.y ?? 0) - (secondBox?.y ?? 0));
    expect(Math.max(deltaX, deltaY)).toBeGreaterThan(5);
  });

  test("orb rotates on mobile devices @mobile-safari", async ({ page }, testInfo) => {
    const isMobileProject = /mobile|ipad/i.test(testInfo.project.name || "");
    test.skip(!isMobileProject, "Only validated on mobile projects");

    await applyE2EState(page, {});
    await page.goto("/");

    const orb = page.getByTestId("vitality-orb-rotator");
    await expect(orb).toBeVisible();

    const first = await orb.evaluate((el) => getComputedStyle(el).transform);
    await page.waitForTimeout(6000);
    const second = await orb.evaluate((el) => getComputedStyle(el).transform);

    expect(first).not.toEqual(second);
  });
});
