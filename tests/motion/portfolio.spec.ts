import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator } from '@playwright/test';
import sharp from 'sharp';

const editions = [
  { path: '/', id: 'flow', title: 'Software in motion.' },
  { path: '/tide/', id: 'tide', title: 'Built below the surface.' },
  { path: '/kiln/', id: 'kiln', title: 'Build it. Prove it.' },
];

async function sampledFrame(stage: Locator): Promise<Buffer> {
  return sharp(await stage.screenshot()).resize(120, 90).removeAlpha().raw().toBuffer();
}

function changed(left: Buffer, right: Buffer): number {
  let pixels = 0;
  for (let i = 0; i < left.length; i++) {
    if (Math.abs(left[i]! - right[i]!) > 14) pixels++;
  }
  return pixels / left.length;
}

for (const { path, id, title } of editions) {
  test(`${id} moves by itself when WebGL is unavailable`, async ({ page }) => {
    await page.goto(`${path}?webgl=off`);
    const stage = page.locator('[data-stage]');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(stage).toHaveAttribute('data-render', 'css');
    // Compare frames after the one-shot opening, not the opening against the resting art.
    await stage.locator('.scene-matte').evaluate(async (node) => {
      await Promise.all(node.getAnimations().map((animation) => animation.finished));
    });
    const first = await sampledFrame(stage);
    await expect.poll(async () => changed(first, await sampledFrame(stage))).toBeGreaterThan(.025);
    await page.getByRole('checkbox', { name: 'Pause motion' }).check();
    await expect(page.getByRole('checkbox', { name: 'Pause motion' })).toBeChecked();
    const paused = await sampledFrame(stage);
    await page.waitForTimeout(200);
    expect(changed(paused, await sampledFrame(stage))).toBeLessThan(.005);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
  });

  test(`${id} draws moving WebGL frames without shader errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(path);
    const stage = page.locator('[data-stage]');
    await expect(stage).toHaveAttribute('data-render', 'webgl', { timeout: 15_000 });
    await expect(page.locator('[data-stage] .scene-fallback')).toBeHidden();
    const first = await sampledFrame(stage);
    await expect.poll(async () => changed(first, await sampledFrame(stage))).toBeGreaterThan(.02);
    expect(errors).toEqual([]);
  });

  test(`${id} retains readable content and a working resume and contact with JavaScript off`, async ({ browser, baseURL, isMobile, viewport }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport, isMobile, hasTouch: isMobile });
    try {
      const page = await context.newPage();
      await page.goto(`${baseURL}${path}`);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
      await expect(page.getByText('Veerabhadra Swami Challagali', { exact: true }).first()).toBeVisible();
      await expect(page.getByRole('heading', { name: 'More work' })).toBeVisible();
      await expect(page.locator('a[href^="mailto:"]')).toBeVisible();
      await expect(page.locator('a[href^="tel:"]')).toBeVisible();
      const resume = await page.locator('.top a[download]').getAttribute('href');
      const response = await page.request.get(`${baseURL}${resume}`);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/pdf');
    } finally { await context.close(); }
  });

  test(`${id} passes the axe contrast and accessibility checks`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations.map(({ id, nodes }) => [id, nodes.map(({ target }) => target)])).toEqual([]);
  });
}

test('changing editions plays a cover and reveal and reaches a linked portfolio', async ({ page }) => {
  await page.addInitScript(() => {
    new MutationObserver((records) => {
      if (records.some(({ target, attributeName, oldValue }) =>
        attributeName === 'data-color' && target instanceof HTMLElement && target.hasAttribute('data-transit') && oldValue === null,
      )) {
        sessionStorage.setItem(`cut:${location.pathname}`, 'played');
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-color'], attributeOldValue: true });
  });
  await page.goto('/?webgl=off');
  await expect(page.getByRole('checkbox', { name: 'Pause motion' })).toBeVisible();
  await page.getByRole('navigation', { name: 'Choose a motion edition' }).getByRole('link', { name: 'Tide' }).click();
  await expect(page).toHaveURL(/\/tide\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  expect(await page.evaluate(() => [sessionStorage.getItem('cut:/'), sessionStorage.getItem('cut:/tide/')])).toEqual(['played', 'played']);
  await expect(page.locator('[data-transit]')).toBeHidden();
});

test('reduced motion skips graphics effects but retains edition switching', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const stage = page.locator('[data-stage]');
  await expect(page.getByRole('checkbox', { name: 'Pause motion' })).toBeHidden();
  expect(await stage.evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(0);
  await page.getByRole('navigation', { name: 'Choose a motion edition' }).getByRole('link', { name: 'Kiln' }).click();
  await expect(page).toHaveURL(/\/kiln\/$/);
  await expect(page.locator('[data-stage]')).toHaveAttribute('data-render', 'css');
  await expect(page.locator('[data-transit]')).toBeHidden();
});
