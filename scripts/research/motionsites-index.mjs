// Indexes every card on motionsites.ai: name, poster image, the card's own preview video, categories.
// Usage: node scripts/research/motionsites-index.mjs <out.json>
// Cards are not links: each has an img[alt=name] and (usually) its own <video> inside the card.
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const out = process.argv[2] ?? 'motionsites-index.json';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const results = new Map();

async function harvest(cat) {
  const items = await page.evaluate(() => {
    const found = [];
    for (const img of document.querySelectorAll('img[alt]')) {
      const alt = img.alt.trim();
      if (!alt || alt.length > 60 || alt === 'MotionSites logo') continue;
      let card = img.parentElement;
      while (card && card.parentElement && card.parentElement.querySelectorAll('img[alt]').length === 1) card = card.parentElement;
      const v = card?.querySelector('video');
      const video = v ? (v.currentSrc || v.src || v.querySelector('source')?.src || '') : '';
      found.push({ name: alt, img: img.currentSrc || img.src, video });
    }
    return found;
  });
  for (const it of items) {
    const prev = results.get(it.name);
    if (!prev) results.set(it.name, { ...it, cats: [cat] });
    else {
      if (!prev.cats.includes(cat)) prev.cats.push(cat);
      if (!prev.video && it.video) prev.video = it.video;
    }
  }
}

async function loadAll(cat) {
  let last = 0, same = 0;
  for (let i = 0; i < 120 && same < 5; i++) {
    await page.mouse.wheel(0, 1300);
    await page.waitForTimeout(260);
    if (i % 3 === 0) await harvest(cat);
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    same = h === last ? same + 1 : 0;
    last = h;
  }
  await harvest(cat);
}

await page.goto('https://motionsites.ai/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(5000);
for (const cat of ['All', 'Portfolios', '3D & interactive', 'Landing pages', 'Sections', 'Agency & creative', 'SaaS & tech', 'AI products']) {
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(300);
  try { await page.getByRole('button', { name: cat, exact: true }).first().click({ timeout: 5000 }); } catch { continue; }
  await page.waitForTimeout(2000);
  await loadAll(cat);
  console.log(cat, results.size);
}
await page.goto('https://motionsites.ai/3d-websites', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);
await loadAll('3d-page');
fs.writeFileSync(out, JSON.stringify([...results.values()], null, 1));
console.log('cards', results.size, 'with own video', [...results.values()].filter((r) => r.video).length);
await browser.close();
