import { expect, test } from '@playwright/test';

const OTHER: Record<string, string> = { phone: 'manual', manual: 'classic', classic: 'phone' };

for (const [from, to] of Object.entries(OTHER)) {
  test(`the sweep carries /${from}/ to /${to}/`, async ({ page }) => {
    // Without the 3D: these tests are about the transition, and software WebGL on a shared runner
    // can starve the main thread for seconds.
    await page.goto(`/${from}/?webgl=off`);
    await page.waitForFunction(() => document.documentElement.dataset.scene !== undefined);
    const link = page.locator(`a[data-sweep="${to}"]`).first();
    await link.scrollIntoViewIfNeeded();
    await link.click();
    await expect(page).toHaveURL(new RegExp(`/${to}/$`), { timeout: 15000 });
    // The destination paints covered, then uncovers itself.
    await page.waitForFunction(() => !document.documentElement.dataset.sweep, undefined, { timeout: 12000 });
    await expect(page.locator('.sweep')).toHaveCount(1);
    await expect(page.locator('.sweep')).toBeHidden();
  });
}

test('with reduced motion there is no sweep, and the page still arrives', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/phone/?webgl=off');
  await page.waitForFunction(() => document.documentElement.dataset.scene !== undefined);
  const link = page.locator('a[data-sweep="manual"]').first();
  await link.scrollIntoViewIfNeeded();
  await link.click();
  await expect(page).toHaveURL(/\/manual\/$/, { timeout: 5000 });
  await expect(page.locator('html')).not.toHaveAttribute('data-sweep', /.*/);
});

test('the theme flood switches the theme and leaves nothing behind', async ({ page }) => {
  await page.goto('/manual/');
  await page.getByRole('button', { name: 'Blueprint (dark) print' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.flood')).toHaveCount(0);
});

test('opening an app morphs the icon and leaves no view-transition names behind', async ({ page }) => {
  await page.goto('/phone/');
  await page.waitForFunction(() => document.documentElement.dataset.scene !== undefined);
  await page.locator('a.row[href="#app-pam"]').click();
  await expect(page.getByRole('heading', { level: 2, name: 'PAM' })).toBeVisible();
  await page.waitForTimeout(1200);
  expect(await page.evaluate(() => document.querySelectorAll('[style*="view-transition-name"]').length)).toBe(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-view="home"]')).toBeVisible();
});

test('the work filter leaves no view-transition names behind', async ({ page }) => {
  await page.goto('/classic/');
  await page.getByRole('button', { name: 'Protocols and crypto', exact: true }).click();
  await expect(page.locator('[data-count]')).toHaveText('Showing 3 projects in Protocols and crypto.');
  await page.waitForTimeout(1200);
  expect(await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-layers]')].every((el) => !el.style.viewTransitionName))).toBe(true);
});
