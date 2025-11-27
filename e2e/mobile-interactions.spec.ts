import { test, expect } from '@playwright/test';
import { applyE2EState, waitForDashboard } from './utils';

const sampleMetric = {
  id: 1,
  userId: 'e2e-user',
  date: '2024-01-01',
  recoveryScore: 85,
  sleepScore: 82,
  hrv: 65,
  steps: 7000,
  workoutIntensity: 6,
  sleepConsistency: 75,
  rhr: 52,
};

test.describe('Mobile Touch Interactions', () => {
  test.use({ storageState: undefined });

  test('viewport remains stable on Safari scrolls @mobile-safari', async ({ page }) => {
    await applyE2EState(page, {
      fitness: { metrics: [sampleMetric] },
      googleFitStatus: { connected: true, hasSyncedData: true },
    });

    await page.goto('/');
    await waitForDashboard(page);

    const initialHeight = await page.evaluate(() => window.innerHeight);

    await page.evaluate(() => window.scrollBy(0, 200));
    await page.waitForTimeout(500);

    const scrolledHeight = await page.evaluate(() => window.innerHeight);

    const vitality = page.getByTestId('vitality-orb');
    await expect(vitality).toBeVisible();
    expect(scrolledHeight).toBeGreaterThan(0);
    expect(Math.abs(scrolledHeight - initialHeight)).toBeLessThan(initialHeight * 0.3);
  });

  test('Google Fit connection controls stay touch-friendly @mobile-safari', async ({ page }) => {
    await applyE2EState(page, {
      fitness: { metrics: [] },
      googleFitStatus: { connected: false, hasSyncedData: false },
    });

    await page.goto('/');
    await waitForDashboard(page);

    const chip = page.getByTestId('chip-sync-status');
    await expect(chip).toContainText(/google fit disconnected/i);

    const connectButton = page.getByTestId('button-sync-fit');
    await expect(connectButton).toBeVisible();
    await expect(connectButton).toContainText(/connect/i);

    const box = await connectButton.boundingBox();
    if (!box) throw new Error('Connect button bounding box missing');
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
  });

  test('charts do not hijack page scroll on iPad @ipad-pro', async ({ page }) => {
    await applyE2EState(page, {
      fitness: { metrics: [sampleMetric] },
      googleFitStatus: { connected: true, hasSyncedData: true },
    });

    await page.goto('/');
    await waitForDashboard(page);

    const vitality = page.getByTestId('vitality-orb');
    await expect(vitality).toBeVisible();

    const initialScroll = await page.evaluate(() => window.scrollY);

    const box = await vitality.boundingBox();
    if (!box) throw new Error('Vitality orb bounding box missing');

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 200, { steps: 5 });
    await page.mouse.up();

    const finalScroll = await page.evaluate(() => window.scrollY);
    expect(finalScroll).toBe(initialScroll);
  });

  test('Recovery radar scroll region isolates touch gestures @ipad-pro', async ({ page }) => {
    await applyE2EState(page, {
      fitness: { metrics: [sampleMetric] },
      googleFitStatus: { connected: true, hasSyncedData: true },
    });

    await page.goto('/');
    await waitForDashboard(page);

    const chart = page.getByTestId('card-recovery-radar');
    await expect(chart).toBeVisible();

    const before = await page.evaluate(() => window.scrollY);

    const chartBox = await chart.boundingBox();
    if (!chartBox) throw new Error('Recovery radar bounding box missing');

    await page.mouse.move(chartBox.x + chartBox.width / 2, chartBox.y + 40);
    await page.mouse.down();
    await page.mouse.move(chartBox.x + chartBox.width / 2, chartBox.y + chartBox.height - 40, { steps: 8 });
    await page.mouse.up();

    const after = await page.evaluate(() => window.scrollY);
    expect(Math.abs(after - before)).toBeLessThanOrEqual(2);
  });
});
