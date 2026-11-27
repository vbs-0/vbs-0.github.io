import { expect, test } from '@playwright/test';

test.describe('About phone', () => {
  test('search finds a project and opens its App info page', async ({ page }) => {
    await page.goto('/phone/');
    await page.getByRole('button', { name: 'Search this page' }).click();
    await page.getByRole('searchbox').fill('kyber');
    await page.locator('[data-search-results] a', { hasText: 'QuantumLink-PQC' }).click();
    await expect(page).toHaveURL(/#app-quantumlink$/);
    await expect(page.getByRole('heading', { level: 2, name: 'QuantumLink-PQC' })).toBeFocused();
    await expect(page.locator('#app-quantumlink').getByText('Research prototype')).toBeVisible();
    await expect(page.locator('[data-view="home"]')).toBeHidden();
  });

  test('Escape returns from an App info page to the list', async ({ page }) => {
    await page.goto('/phone/');
    await page.waitForFunction(() => document.documentElement.dataset.scene !== undefined);
    await page.locator('a.row[href="#app-pam"]').click();
    await expect(page.getByRole('heading', { level: 2, name: 'PAM' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-view="home"]')).toBeVisible();
    await expect(page.locator('a.row[href="#app-pam"]')).toBeFocused();
  });

  test('seven presses on Build number unlock Developer options', async ({ page }) => {
    await page.goto('/phone/');
    const developer = page.locator('[data-developer]');
    await expect(developer).toBeHidden();
    // Dispatch the taps directly: seven Playwright clicks under load can outlast the tap window.
    const tap = (times: number) => page.evaluate((n) => {
      const button = document.querySelector<HTMLButtonElement>('[data-build-number]');
      for (let i = 0; i < n; i++) button?.click();
    }, times);
    await tap(4);
    await expect(page.locator('[data-snackbar]')).toContainText('steps away');
    await tap(3);
    await expect(developer).toBeVisible();
    await expect(page.locator('[data-snackbar]')).toContainText('You are now a developer!');
    await page.locator('[data-dev="rtl"]').check({ force: true });
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await page.locator('[data-dev-reset]').click();
    await expect(developer).toBeHidden();
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });

  test('the theme switch changes and remembers the theme', async ({ page }) => {
    await page.goto('/phone/');
    // The toggle's handler is attached by the page script; on a loaded runner the click can beat it.
    await page.waitForFunction(() => document.documentElement.dataset.scene !== undefined);
    await page.getByRole('button', { name: 'Dark theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});

test.describe('Service manual', () => {
  test('balloons select the matching row of the parts list', async ({ page }) => {
    await page.goto('/manual/?motion=off');
    await page.waitForFunction(() => document.documentElement.dataset.scene !== undefined);
    const balloon = page.getByRole('button', { name: /Item 3: Logic board/ });
    await balloon.scrollIntoViewIfNeeded();
    await balloon.click();
    await expect(balloon).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.part[data-part="board"]')).toHaveClass(/is-active/);
    await expect(page.locator('.part[data-part="display"]')).not.toHaveClass(/is-active/);
  });

  test('scrolling through the exploded view steps through the parts', async ({ page }) => {
    await page.goto('/manual/');
    await page.waitForFunction(() => document.documentElement.dataset.scene === 'live');
    // One viewport of scrolling per part, after a short run-in: these three positions land on items 2, 4 and 6 of the parts list.
    for (const [fraction, part] of [[0.25, 'antenna'], [0.6, 'camera'], [0.95, 'battery']] as const) {
      await page.evaluate((t) => {
        const track = document.querySelector<HTMLElement>('[data-explode-track]');
        const pin = document.querySelector<HTMLElement>('.explode__pin');
        const bar = document.querySelector<HTMLElement>('.bar');
        if (!track || !pin || !bar) return;
        const top = track.getBoundingClientRect().top + scrollY - bar.offsetHeight;
        scrollTo({ top: top + t * (track.offsetHeight - pin.offsetHeight), behavior: 'instant' });
      }, fraction);
      await expect(page.locator('.part.is-active')).toHaveAttribute('data-part', part);
      await expect(page.locator(`.balloon[data-part="${part}"]`)).toHaveAttribute('aria-pressed', 'true');
    }
  });

  test('the print switch turns the sheet into a blueprint', async ({ page }) => {
    await page.goto('/manual/');
    await page.locator('[data-theme-toggle]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});

test.describe('Classic', () => {
  test('choosing a layer filters the work and announces the count', async ({ page }) => {
    await page.goto('/classic/');
    await page.getByRole('button', { name: 'Protocols and crypto', exact: true }).click();
    await expect(page.locator('[data-count]')).toHaveText('Showing 3 projects in Protocols and crypto.');
    await expect(page.locator('#project-quantumlink')).toBeVisible();
    await expect(page.locator('#project-studease')).toBeHidden();
    await page.getByRole('button', { name: 'All', exact: true }).click();
    await expect(page.locator('#project-studease')).toBeVisible();
  });

  test('a layer opens to show what is built there', async ({ page }) => {
    await page.goto('/classic/');
    const button = page.locator('.layer[data-layer="system"] button');
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#layer-system')).toBeVisible();
  });
});
