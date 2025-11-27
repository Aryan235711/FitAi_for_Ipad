import { test, expect, type Page } from "@playwright/test";
import { applyE2EState } from "./utils";

const getColumnCount = (page: Page) =>
  page.getByTestId("dashboard-grid").evaluate((grid) => {
    const children = Array.from(grid.children) as HTMLElement[];
    if (!children.length) return 0;
    const firstRowTop = Math.round(children[0].getBoundingClientRect().top);
    const firstRow = children.filter((child) => Math.round(child.getBoundingClientRect().top) === firstRowTop);
    return firstRow.length;
  });

test.describe("Dashboard layout responsiveness", () => {
  test("single column on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 420, height: 900 });
    await applyE2EState(page, {});
    await page.goto("/");

    const columnCount = await getColumnCount(page);

    expect(columnCount).toBe(1);
  });

  test("two columns on tablet", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await applyE2EState(page, {});
    await page.goto("/");

    const columnCount = await getColumnCount(page);

    expect(columnCount).toBeGreaterThanOrEqual(2);
  });

  test("three columns on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await applyE2EState(page, {});
    await page.goto("/");

    const columnCount = await getColumnCount(page);

    expect(columnCount).toBeGreaterThanOrEqual(3);
  });
});
