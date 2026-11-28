import { expect, test } from '@playwright/test';

test.describe('Studio', () => {
  test('is the page at / and has no phone in it', async ({ page }) => {
    await page.goto('/?webgl=off');
    await expect(page.locator('html')).toHaveAttribute('data-variant', 'studio');
    await expect(page.locator('canvas#stage, .still--exploded, img[src*="phone-hero"], img[src*="phone-exploded"]')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Challagali');
  });

  test('the loading counter counts to 100, lifts, and the title arrives', async ({ page }) => {
    await page.goto('/studio/?leader=on&webgl=off');
    await expect(page.locator('.pre__count')).toBeAttached();
    await page.waitForFunction(() => !document.documentElement.dataset.leader, undefined, { timeout: 15000 });
    await expect(page.locator('.pre')).toHaveCSS('display', 'none', { timeout: 5000 });
    await expect(page.locator('.hero')).toHaveClass(/is-on/);
  });

  test('the title still arrives if the safety timer removes the cover first', async ({ page }) => {
    const time = new Date('2026-01-01T00:00:00Z');
    await page.clock.install({ time });
    await page.clock.pauseAt(new Date(+time + 60_000));
    await page.goto('/studio/?leader=on&webgl=off');
    await expect(page.locator('html')).toHaveClass(/studio-ready/);
    await expect(page.locator('html')).toHaveAttribute('data-leader', 'on');
    // Reproduce the head watchdog winning while the counter cannot advance.
    await page.evaluate(() => { delete document.documentElement.dataset.leader; });
    await page.clock.resume();
    await expect(page.locator('.hero')).toHaveClass(/is-on/);
  });

  test('reduced motion has no loading counter and the title is there at once', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/studio/?leader=on&webgl=off');
    await expect(page.locator('html')).not.toHaveAttribute('data-leader', /.*/);
    await expect(page.locator('.hero__name')).toBeVisible();
  });

  test('every project is a row that opens its page, and six layers stack', async ({ page }) => {
    await page.goto('/studio/?webgl=off');
    expect(await page.locator('.row').count()).toBeGreaterThanOrEqual(10);
    await expect(page.locator('.row__link[href="/work/pam/"]')).toBeAttached();
    await expect(page.locator('.card')).toHaveCount(6);
  });

  test('hovering a row opens the picture on its own canvas', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'touch screens have no hover');
    await page.goto('/studio/');
    await page.waitForFunction(() => document.documentElement.dataset.scene !== undefined);
    const row = page.locator('.row[data-preview]').first();
    await row.scrollIntoViewIfNeeded();
    await row.hover();
    await expect(page.locator('html')).toHaveAttribute('data-plane', 'live', { timeout: 15000 });
    await expect(page.locator('canvas.plane')).toBeAttached();
  });
});
