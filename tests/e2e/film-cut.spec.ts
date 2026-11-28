import { expect, test, type Page } from '@playwright/test';

const route = '/film/?webgl=off';

async function openSet(page: Page) {
  await page.goto(route);
  await page.waitForSelector('html[data-scene="still"]');
  await page.evaluate(() => Promise.all(
    [...document.querySelectorAll<HTMLImageElement>('.film-cut img, .backlot__plate')].map((img) => img.decode()),
  ));
}

/** Sample the actual composited positions when the curtain starts to open, not after an arbitrary sleep. */
async function coveredFrame(page: Page, trigger: () => Promise<unknown>) {
  const [frame] = await Promise.all([
    page.evaluate(() => new Promise<{
      exposure: string | undefined; focus: string | undefined; opacity: number; silkAcrossCenter: boolean;
    }>((resolve) => {
      const capture = (event: AnimationEvent) => {
        if (event.animationName !== 'cut-density') return;
        document.removeEventListener('animationend', capture);
        const silk = document.querySelector<HTMLImageElement>('.cut__silk--near')!;
        const r = silk.getBoundingClientRect();
        resolve({
          exposure: document.documentElement.dataset.exposure,
          focus: document.activeElement?.id,
          opacity: Number(getComputedStyle(event.target as Element).opacity)
            * Number(getComputedStyle(document.querySelector('.cut__cover')!).opacity),
          silkAcrossCenter: silk.naturalWidth > 0 && r.left < innerWidth * 0.35 && r.right > innerWidth * 0.65
            && r.top < innerHeight * 0.35 && r.bottom > innerHeight * 0.65,
        });
      };
      document.addEventListener('animationend', capture);
    })),
    trigger(),
  ]);
  return frame;
}

test.describe('Film cut', () => {
  test('plays on the first keyboard jump and replays in reverse, swapping on the opaque frame', async ({ page }) => {
    await openSet(page);
    const play = page.getByRole('link', { name: 'Play first scene' });
    await play.focus();
    const front = await coveredFrame(page, () => play.press('Enter'));
    expect(front).toEqual({ exposure: 'night', focus: 'interface', opacity: 1, silkAcrossCenter: true });
    await expect(page.locator('.film-cut')).toBeHidden();
    const back = await coveredFrame(page, () => page.locator('[data-strip="title"]').click());
    expect(back).toEqual({ exposure: 'day', focus: 'title', opacity: 1, silkAcrossCenter: true });
    await expect(page.locator('.film-cut')).toBeHidden();
  });

  test('the first native scroll cuts, and rapid strip choices land only on the last one', async ({ page }) => {
    await openSet(page);
    const frame = await coveredFrame(page, () => page.locator('#interface').evaluate((el) => el.scrollIntoView()));
    expect(frame.exposure).toBe('night');
    await expect(page.locator('.film-cut')).toBeHidden();
    const length = await page.evaluate(() => history.length);
    await page.evaluate(() => {
      for (const id of ['ops', 'protocol']) document.querySelector<HTMLAnchorElement>(`[data-strip="${id}"]`)!.click();
    });
    await expect(page.locator('#protocol')).toBeFocused();
    await expect(page).toHaveURL(/#protocol$/);
    await expect(page.locator('html')).toHaveAttribute('data-exposure', 'day');
    expect(await page.evaluate(() => history.length)).toBe(length + 1);
  });

  test('reduced motion lands immediately on deep links and does not fetch the effects plates', async ({ page }) => {
    const effects: string[] = [];
    page.on('request', (r) => { if (/\/(?:dust|standard)\.[^/]+\.webp/.test(r.url())) effects.push(r.url()); });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`${route}#interface`);
    await expect(page.locator('[data-strip="interface"]')).toHaveAttribute('aria-current', 'location');
    await expect(page.locator('html')).toHaveAttribute('data-exposure', 'night');
    await page.locator('[data-strip="title"]').click();
    await expect(page.locator('#title')).toBeFocused();
    await expect(page.locator('.film-cut')).toBeHidden();
    expect(effects).toEqual([]);
  });

  test('an unavailable silk plate cannot block the scene or keyboard focus', async ({ page }) => {
    await page.route(/\/standard\.[^/]+\.webp/, (r) => r.abort());
    await page.goto(route);
    await page.getByRole('link', { name: 'Play first scene' }).click();
    await expect(page.locator('#interface')).toBeFocused();
    await expect(page.locator('.film-cut')).toBeHidden();
    await expect(page.locator('html')).toHaveAttribute('data-exposure', 'night');
  });
});
