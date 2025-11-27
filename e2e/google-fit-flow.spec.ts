import { test, expect } from "@playwright/test";
import { applyE2EState } from "./utils";

const oldDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

test.describe("Google Fit status chip", () => {
  test("disconnected state surfaces warning", async ({ page }) => {
    await applyE2EState(page, { googleFitStatus: { connected: false } });
    await page.goto("/");

    await expect(page.getByTestId("chip-sync-status")).toContainText("Google Fit disconnected");
    await expect(page.getByTestId("button-sync-fit")).toHaveText(/connect fit/i);
  });

  test("stale sync shows last sync timestamp", async ({ page }) => {
    await applyE2EState(page, {
      googleFitStatus: {
        connected: true,
        hasSyncedData: true,
        lastSyncedAt: oldDate,
      },
    });
    await page.goto("/");

    await expect(page.getByTestId("chip-sync-status")).toContainText(/last sync/i);
    await expect(page.getByTestId("button-sync-fit")).toHaveText(/sync fit/i);
  });

  test("first-time sync guidance appears when connected without data", async ({ page }) => {
    await applyE2EState(page, {
      googleFitStatus: {
        connected: true,
        hasSyncedData: false,
      },
    });
    await page.goto("/");

    await expect(page.getByTestId("chip-sync-status")).toContainText(/waiting for first sync/i);
  });

  test("connect button remains tappable on mobile Safari @mobile-safari", async ({ page }, testInfo) => {
    const isMobileProject = /mobile|ipad/i.test(testInfo.project.name || "");
    test.skip(!isMobileProject, "Only validated on mobile projects");

    await applyE2EState(page, {
      googleFitStatus: {
        connected: false,
        hasSyncedData: false,
      },
    });
    await page.goto("/");

    const statusChip = page.getByTestId("chip-sync-status");
    await expect(statusChip).toContainText(/disconnected/i);

    const connectButton = page.getByTestId("button-sync-fit");
    await expect(connectButton).toHaveText(/connect fit/i);
    const box = await connectButton.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(88);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    await expect(connectButton).toBeEnabled();
  });
});
