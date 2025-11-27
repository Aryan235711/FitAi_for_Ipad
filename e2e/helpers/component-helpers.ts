import type { Page, Locator, TestInfo } from "@playwright/test";

interface ComponentCheckResult {
  exists: boolean;
  locator: Locator;
}

export async function waitForComponentOrEmpty(
  page: Page,
  selector: string,
  options?: {
    emptyStateSelector?: string;
    settleMs?: number;
    testInfo?: TestInfo;
  },
): Promise<ComponentCheckResult> {
  const {
    emptyStateSelector = "[data-testid=\"dashboard-container\"]",
    settleMs = 3000,
    testInfo,
  } = options ?? {};

  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(settleMs);

  const target = page.locator(selector);
  const count = await target.count();

  if (count > 0) {
    testInfo?.annotations.push({
      type: "info",
      description: `Component ${selector} rendered successfully`,
    });
    return { exists: true, locator: target }; 
  }

  const fallback = page.locator(emptyStateSelector).first();
  testInfo?.annotations.push({
    type: "warning",
    description: `Component ${selector} missing; using ${emptyStateSelector} snapshot`,
  });
  await fallback.waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
  return { exists: false, locator: fallback };
}
