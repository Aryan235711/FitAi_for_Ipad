import type { Page } from "@playwright/test";

export const applyE2EState = (page: Page, state: unknown) =>
  page.addInitScript((data) => {
    window.sessionStorage.setItem("E2E_STATE", JSON.stringify(data));
  }, state);

export const waitForDashboard = async (page: Page) => {
  await page.waitForSelector('[data-testid="dashboard-grid"]');
};
