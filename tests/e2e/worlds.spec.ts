import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const variants = [
  { id: 'pop', action: 'Spin the loop', work: 'Play with my work' },
  { id: 'tide', action: 'Send a ripple', work: 'Explore the work' },
  { id: 'kiln', action: 'Stoke the fire', work: 'See the workbench' },
] as const;

for (const { id, action, work } of variants) {
  test.describe(id, () => {
    test('shows its own skippable opening', async ({ page }) => {
      const time = new Date('2026-01-01T00:00:00Z');
      await page.clock.install({ time });
      await page.clock.pauseAt(new Date(+time + 60_000));
      await page.goto(`/${id}/?intro=on&webgl=off`);
      await expect(page.locator('html')).toHaveAttribute('data-world-phase', 'intro');
      const skip = page.getByRole('button', { name: 'Skip intro' });
      await expect(skip).toBeVisible();
      await skip.focus();
      await page.keyboard.press('Enter');
      await page.clock.resume();
      await expect(page.locator('html')).not.toHaveAttribute('data-world-phase', /.+/);
      await expect(page.getByRole('link', { name: work })).toBeVisible();
    });

    test('plays a material cut and puts focus at the work destination', async ({ page }) => {
      await page.goto(`/${id}/?intro=off&webgl=off`);
      await expect(page.getByRole('button', { name: action })).toBeVisible();
      const phases = await page.evaluateHandle(() => {
        const seen: string[] = [];
        const root = document.documentElement;
        new MutationObserver(() => {
          if (root.dataset.worldPhase) seen.push(root.dataset.worldPhase);
        }).observe(root, { attributes: true, attributeFilter: ['data-world-phase'] });
        return seen;
      });
      await page.getByRole('link', { name: work }).click();
      await expect(page).toHaveURL(/#work$/);
      await expect(page.locator('#work')).toBeFocused();
      await expect(page.locator('html')).not.toHaveAttribute('data-world-phase', /.+/);
      expect(await phases.jsonValue()).toEqual(['cover', 'out']);
    });

    test('animates the still art on demand and honors pause', async ({ page }) => {
      await page.goto(`/${id}/?intro=off&webgl=off`);
      await page.getByRole('button', { name: action }).click();
      await expect(page.locator('[data-world-stage]')).toHaveAttribute('data-pulse', 'on');
      await page.getByRole('button', { name: 'Pause motion' }).click();
      await expect(page.getByRole('button', { name: 'Pause motion' })).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByRole('button', { name: action })).toBeHidden();
      await page.getByRole('link', { name: work }).click();
      await expect(page).toHaveURL(/#work$/);
      await expect(page.locator('html')).not.toHaveAttribute('data-world-phase', /.+/);
    });

    test('uses still art and no curtain with reduced motion, even if the opening is forced', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/${id}/?intro=on`);
      await expect(page.locator('html')).toHaveAttribute('data-scene', 'still');
      await expect(page.locator('[data-world-stage] .world-static-layer')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Skip intro' })).toBeHidden();
      await expect(page.getByRole('button', { name: action })).toBeHidden();
      await page.getByRole('link', { name: work }).click();
      await expect(page).toHaveURL(/#work$/);
      await expect(page.locator('html')).not.toHaveAttribute('data-world-phase', /.+/);
    });
  });
}

test('each new 3D scene renders without shader or renderer errors', async ({ page }) => {
  test.slow();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  for (const { id } of variants) {
    await page.goto(`/${id}/?intro=off`);
    await expect(page.locator('html')).toHaveAttribute('data-scene', 'live', { timeout: 15_000 });
    await expect(page.locator('[data-world-stage] canvas')).toBeVisible();
    await expect(page.locator('[data-world-stage] .world-static-layer')).toBeHidden();
  }
  expect(errors).toEqual([]);
});

test('Kiln workbench switches real evidence with the keyboard and accepts deep links', async ({ page }, testInfo) => {
  await page.goto('/kiln/?webgl=off');
  const clip = page.getByRole('tab', { name: 'ClipBridge' });
  await expect(clip).toHaveAttribute('aria-selected', 'true');
  await clip.focus();
  await page.keyboard.press(testInfo.project.name === 'phone' ? 'ArrowRight' : 'ArrowDown');
  await expect(page.getByRole('tab', { name: 'TermADB' })).toBeFocused();
  await expect(page.getByRole('tabpanel', { name: 'TermADB' })).toBeVisible();
  await expect(page.getByRole('tabpanel', { name: 'ClipBridge' })).toBeHidden();

  await page.goto('/kiln/?webgl=off#project-notepad');
  const notepad = page.getByRole('tabpanel', { name: 'Notepad, four ways' });
  await expect(notepad).toBeVisible();
  await expect(notepad.getByText('24,741 bytes', { exact: true })).toBeVisible();
  await expect(notepad.getByRole('link', { name: 'Source and measurements' })).toHaveAttribute('href', /^https:\/\/github\.com\/vbs-0\//);
});

test('the chooser gives each edition a working direct link and no axe violations', async ({ page }) => {
  test.slow();
  await page.goto('/editions/');
  const choices = page.getByRole('list', { name: 'Motion editions' });
  for (const { id } of variants) await expect(choices.getByRole('link', { name: `Open ${id}` })).toHaveAttribute('href', `/${id}/`);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations.map((violation) => violation.id)).toEqual([]);
  await choices.getByRole('link', { name: 'Open Pop' }).click();
  await expect(page).toHaveURL(/\/pop\/$/);
  await expect(page.getByRole('link', { name: 'Compare the editions' })).toHaveAttribute('href', '/editions/');
});
