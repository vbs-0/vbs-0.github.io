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

test('split headings keep their full text and complete their rise', async ({ page }) => {
  for (const path of ['/classic/', '/manual/', '/phone/?webgl=off']) {
    await page.goto(path);
    await page.waitForTimeout(1600);
    const state = await page.evaluate(() => {
      const el = document.querySelector('[data-split]');
      if (!el) return null;
      const masks = [...el.querySelectorAll('.fx-mask')];
      return {
        inClass: el.classList.contains('fx-in'),
        words: el.querySelectorAll('.fx-word').length,
        // the visually-hidden copy carries the text to screen readers, the masks are hidden from them
        srCopy: (el.firstElementChild?.textContent ?? '').trim(),
        masksHidden: masks.every((m) => m.getAttribute('aria-hidden') === 'true'),
        visibleText: masks.map((m) => m.textContent).join(' '),
      };
    });
    expect(state).not.toBeNull();
    expect(state!.inClass).toBe(true);
    expect(state!.words).toBeGreaterThan(1);
    expect(state!.masksHidden).toBe(true);
    expect(state!.visibleText).toBe(state!.srCopy);
  }
});

test('reduced motion leaves split text fully visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/classic/');
  await page.waitForTimeout(800);
  const hidden = await page.evaluate(() => {
    const el = document.querySelector('[data-split]');
    return el ? el.classList.contains('fx-split') && !el.classList.contains('fx-in') : true;
  });
  expect(hidden).toBe(false);
});

test('a button pulls toward the pointer at its edge', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'touch devices have no fine pointer to pull towards');
  await page.goto('/classic/?webgl=off');
  await page.waitForTimeout(1500);
  const btn = page.locator('.actions .btn').first();
  const box = await btn.boundingBox();
  await page.mouse.move(box!.x + 5, box!.y + box!.height / 2, { steps: 3 });
  await page.waitForTimeout(350);
  expect(await btn.evaluate((el) => el.style.transform)).toMatch(/translate\(-?\d/);
});

test('count-ups never blank the measured value', async ({ page }) => {
  await page.goto('/phone/?webgl=off#app-pam');
  await page.waitForTimeout(2500);
  const first = await page.locator('[data-countup]').first().textContent();
  expect(first).toContain('318');
});

test('the scroll-lit paragraph lights as it enters reading position', async ({ page }) => {
  await page.goto('/classic/?webgl=off');
  await page.waitForTimeout(1500);
  const litAtStart = await page.evaluate(() => {
    const w = [...document.querySelectorAll('.prose [data-scrub] .fx-word')];
    return w.filter((x) => x.classList.contains('fx-lit')).length;
  });
  expect(litAtStart).toBe(0);
  await page.evaluate(() => document.querySelector('#about')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(700);
  const litAfter = await page.evaluate(() => {
    const w = [...document.querySelectorAll('.prose [data-scrub] .fx-word')];
    return w.filter((x) => x.classList.contains('fx-lit')).length;
  });
  expect(litAfter).toBeGreaterThan(20);
});

test('the floating preview follows hovering an app row', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'touch devices have no hover preview');
  await page.goto('/phone/?webgl=off');
  await page.waitForTimeout(1500);
  const row = page.locator('a.row[data-shot]').first();
  await row.scrollIntoViewIfNeeded();
  await row.hover();
  await page.waitForTimeout(400);
  await expect(page.locator('.fx-preview')).toHaveClass(/fx-preview--on/);
});

test.describe('Film', () => {
  test('the countdown leader plays once, then splits open onto the title', async ({ page }) => {
    // A slow load can finish after the intro. Observe the rendered countdown and opening from navigation start.
    await page.addInitScript(() => {
      document.addEventListener('animationstart', (e) => {
        if (e.animationName === 'leader-num' || e.animationName === 'leader-up') performance.mark(`test:${e.animationName}`);
      });
    });
    await page.goto('/film/?leader=on&webgl=off');
    await expect(page.locator('.leader__nums li')).toHaveCount(7);
    await page.waitForFunction(() => ['leader-num', 'leader-up'].every((key) => performance.getEntriesByName(`test:${key}`).length > 0));
    await page.waitForFunction(() => !document.documentElement.dataset.leader, undefined, { timeout: 12000 });
    // The leader is display:none the moment the attribute goes; give the style a frame to land.
    await expect(page.locator('.leader')).toHaveCSS('display', 'none', { timeout: 5000 });
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Veerabhadra');
    expect(await page.evaluate(() => sessionStorage.getItem('vbs-leader'))).toBe('1');
  });

  test('with reduced motion there is no leader and the title is there at once', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/film/?leader=on');
    await expect(page.locator('html')).not.toHaveAttribute('data-leader', /.*/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Challagali');
    await expect(page.locator('.leader')).toBeHidden();
  });

  test('the scene strip jumps to a scene and marks it current', async ({ page }) => {
    await page.goto('/film/?webgl=off');
    await page.waitForFunction(() => document.documentElement.dataset.scene !== undefined);
    await page.locator('[data-strip="models"]').click();
    await expect(page.locator('[data-strip="models"]')).toHaveAttribute('aria-current', 'location');
    await expect(page.locator('[data-act="models"]')).toBeInViewport();
  });

  test('a reel frame opens its whole scene and the way back returns to the reel', async ({ page }) => {
    await page.goto('/film/?webgl=off');
    await page.locator('#frame-pam .frame__open').click();
    await expect(page).toHaveURL(/\/work\/pam\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('PAM');
    await page.getByRole('link', { name: 'The reel' }).click();
    await expect(page).toHaveURL(/#frame-pam$/);
  });

  test('the timecode advances with the film', async ({ page }) => {
    await page.goto('/film/?webgl=off');
    const first = await page.locator('[data-timecode]').textContent();
    await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight * 0.6, behavior: 'instant' }));
    await page.waitForTimeout(400);
    const later = await page.locator('[data-timecode]').textContent();
    expect(later).not.toBe(first);
    expect(later).toMatch(/^00:\d{2}:\d{2}:\d{2}$/);
  });
});

test.describe('System map', () => {
  test('a node opens its facts and the panel offers the whole scene', async ({ page }) => {
    await page.goto('/graph/');
    await page.waitForFunction(() => document.documentElement.dataset.scene !== undefined);
    await page.locator('[data-node="project:pam"]').click();
    const panel = page.locator('#panel');
    await expect(panel.getByRole('heading', { name: 'PAM' })).toBeVisible();
    await expect(panel.getByText('97.99%')).toBeVisible();
    await expect(panel.getByRole('link', { name: /whole scene/i })).toHaveAttribute('href', '/work/pam/');
  });

  test('the palette finds a project and opens it on the map', async ({ page }) => {
    await page.goto('/graph/');
    await page.waitForFunction(() => document.documentElement.dataset.scene !== undefined);
    await page.keyboard.press('Control+k');
    await page.locator('[data-palette-input]').fill('quantum');
    await page.locator('[data-palette-list] .palette__item').first().click();
    await expect(page.locator('#panel').getByRole('heading', { name: 'QuantumLink-PQC' })).toBeVisible();
  });

  test('a layer chip filters the map', async ({ page }) => {
    await page.goto('/graph/');
    await page.waitForFunction(() => document.documentElement.dataset.scene !== undefined);
    await page.locator('[data-filter="models"]').click();
    await expect(page.locator('[data-filter="models"]')).toHaveAttribute('aria-pressed', 'true');
    const dimmed = await page.locator('.node.is-dim').count();
    expect(dimmed).toBeGreaterThan(0);
  });
});
