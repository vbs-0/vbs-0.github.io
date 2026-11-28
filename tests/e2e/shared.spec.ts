import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = ['/', '/studio/', '/film/', '/graph/', '/phone/', '/manual/', '/classic/'] as const;
const NAME = 'Veerabhadra Swami Challagali';

for (const path of PAGES) {
  test.describe(path, () => {
    test('loads without errors and shows who this is', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      await page.goto(path);
      await expect(page.getByText(NAME).first()).toBeVisible();
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('a[href^="mailto:chvbswami@gmail.com"]').first()).toBeAttached();
      await expect(page.locator('a[href="tel:+916304114599"]').first()).toBeAttached();
      await page.waitForFunction(() => document.documentElement.dataset.scene !== undefined);
      expect(errors).toEqual([]);
    });

    test('never scrolls sideways', async ({ page }) => {
      await page.goto(path);
      await page.waitForFunction(() => document.documentElement.dataset.scene !== undefined);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });

    test('has no detectable accessibility violations', async ({ page }) => {
      // The canvas is hidden from assistive technology, so the scan runs on the still version: same DOM, no GPU load.
      test.slow();
      await page.goto(`${path}?webgl=off`);
      await page.waitForFunction(() => document.documentElement.dataset.scene !== undefined);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target.join(' ')}`)).toEqual([]);
    });

    test('falls back to the still version when WebGL is off', async ({ page }) => {
      await page.goto(`${path}?webgl=off`);
      await expect(page.locator('html')).toHaveAttribute('data-scene', 'still');
      await expect(page.getByText(NAME).first()).toBeVisible();
    });

    test('offers the résumé PDF', async ({ page, request }) => {
      await page.goto(path);
      const href = await page.locator('a[href$="Resume.pdf"]').first().getAttribute('href');
      expect(href).toBeTruthy();
      const res = await request.get(href as string);
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toContain('pdf');
    });
  });
}

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  for (const path of PAGES) {
    test(`${path} still shows every project and the contact details`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByText(NAME).first()).toBeVisible();
      for (const project of ['StudEase', 'QuantumLink-PQC', 'TermADB', 'Predoctor']) await expect(page.getByText(project).first()).toBeVisible();
      await expect(page.getByText('chvbswami@gmail.com').first()).toBeVisible();
    });
  }
});

test('an unknown address gets the 404 page with a way home', async ({ page }) => {
  const res = await page.goto('/404.html');
  expect(res?.ok()).toBe(true);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('does not exist');
  await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
});
