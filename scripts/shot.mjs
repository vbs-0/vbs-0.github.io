#!/usr/bin/env node
/**
 * Takes a screenshot of a page with the installed Chrome, for visual checks during development.
 *   node scripts/shot.mjs <url> <out.png> [width] [height] [--full] [--wait=ms] [--dark] [--reduced] [--dpr=2] [--scroll=px|fraction] [--click=selector] [--settle=ms]
 */
import { chromium } from '@playwright/test';

const [url, out, w = '1440', h = '900', ...flags] = process.argv.slice(2);
if (!url || !out) {
  console.error('usage: node scripts/shot.mjs <url> <out.png> [width] [height] [--full] [--wait=ms] [--dark] [--reduced] [--dpr=2]');
  process.exit(2);
}
const flag = (name) => flags.find((f) => f === `--${name}` || f.startsWith(`--${name}=`));
const value = (name, fallback) => (flag(name)?.includes('=') ? flag(name).split('=')[1] : fallback);

const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
});
const context = await browser.newContext({
  viewport: { width: Number(w), height: Number(h) },
  deviceScaleFactor: Number(value('dpr', '1')),
  colorScheme: flag('dark') ? 'dark' : 'light',
  reducedMotion: flag('reduced') ? 'reduce' : 'no-preference',
});
const page = await context.newPage();
const problems = [];
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
await page.goto(url, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(Number(value('wait', '1500')));
if (flag('scroll')) {
  // --scroll=1200 scrolls to a pixel offset, --scroll=0.5 to a fraction of the page
  const target = Number(value('scroll', '0'));
  await page.evaluate((t) => window.scrollTo({ top: t <= 1 ? t * (document.documentElement.scrollHeight - innerHeight) : t, behavior: 'instant' }), target);
  await page.waitForTimeout(Number(value('settle', '1800')));
}
if (flag('click')) {
  await page.click(value('click', 'body'));
  await page.waitForTimeout(Number(value('settle', '1800')));
}
await page.screenshot({ path: out, fullPage: Boolean(flag('full')) });
await browser.close();
for (const p of problems) console.log(p);
console.log(`saved ${out} (${w}x${h})${problems.length ? ` with ${problems.length} problem(s)` : ''}`);
