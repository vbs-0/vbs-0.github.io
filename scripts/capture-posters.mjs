#!/usr/bin/env node
/**
 * Renders still images of the 3D scenes for the no-WebGL fallback, and the social cards.
 * Needs the dev server (npm run dev) on port 4321 and an installed Chrome.
 *
 *   node scripts/capture-posters.mjs            every poster
 *   node scripts/capture-posters.mjs manual     only names that contain "manual"
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'src', 'assets', 'posters');
const base = process.env.POSTER_BASE ?? 'http://127.0.0.1:4321';
const only = process.argv[2];

/** [file name, lab query, size in CSS px] rendered at 2x on a transparent background. */
const POSTERS = [
  ['manual-cover-light', 'style=ink&theme=light&yaw=28&pitch=10&fill=0.86', 700],
  ['manual-cover-dark', 'style=ink&theme=dark&yaw=28&pitch=10&fill=0.86', 700],
  ['manual-exploded-light', 'style=ink&theme=light&explode=1&active=board&nofocus=1&fill=0.6', 800],
  ['manual-exploded-dark', 'style=ink&theme=dark&explode=1&active=board&nofocus=1&fill=0.6', 800],
  ['phone-hero-light', 'style=pbr&theme=light&yaw=24&pitch=8&fill=0.86', 700],
  ['phone-hero-dark', 'style=pbr&theme=dark&yaw=24&pitch=8&fill=0.86', 700],
  ['phone-exploded-light', 'style=pbr&theme=light&explode=1&active=board&nofocus=1&fill=0.6', 800],
  ['phone-exploded-dark', 'style=pbr&theme=dark&explode=1&active=board&nofocus=1&fill=0.6', 800],
];

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const [name, query, size] of POSTERS) {
  if (only && !name.includes(only)) continue;
  const context = await browser.newContext({ viewport: { width: size, height: size }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.goto(`${base}/lab/?${query}&bg=none`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.dataset.ready === '1', undefined, { timeout: 30000 });
  await page.waitForTimeout(1200);
  const png = await page.screenshot({ omitBackground: true });
  const file = join(outDir, `${name}.webp`);
  await sharp(png).webp({ quality: 86, alphaQuality: 90 }).toFile(file);
  console.log(`poster  ${name}.webp`);
  await context.close();
}
await browser.close();
