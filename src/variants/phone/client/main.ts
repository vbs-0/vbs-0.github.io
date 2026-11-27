/** About phone: wires the theme, the collapsing title, routing, search, hardware selection and the 3D device. */
import type { PhonePartId } from '@/content/types';
import { flood } from '@/lib/motion/flood';
import { bootWhenQuiet } from '@/lib/motion/boot';
import { initSweep } from '@/lib/motion/sweep';
import { detectCapabilities } from '@/lib/three/capabilities';
import { type Theme, palettes } from '@/styles/palettes';
import { initDevOptions } from './devopts';
import { createRouter } from './router';
import type { PhoneScene } from './scene';
import { initSearch } from './searchbox';

// First: lift the cover if this page arrived through a sweep, before anything else can fail.
initSweep();

const root = document.documentElement;
const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel);
const $$ = <T extends Element>(sel: string) => [...document.querySelectorAll<T>(sel)];
// Probe on the canvas the scene will use: one context, created once.
const caps = detectCapabilities(document.querySelector<HTMLCanvasElement>('#stage'));
let scene: PhoneScene | undefined;

// ── Theme ──────────────────────────────────────────────────────────────────
const systemDark = matchMedia('(prefers-color-scheme: dark)');
const theme = (): Theme => (root.dataset.theme === 'light' || root.dataset.theme === 'dark' ? root.dataset.theme : systemDark.matches ? 'dark' : 'light');
const themeButton = $<HTMLButtonElement>('[data-theme-toggle]');
const showTheme = () => themeButton?.setAttribute('aria-pressed', String(theme() === 'dark'));
let switching = false;
themeButton?.addEventListener('click', (event) => {
  if (switching) return;
  const next: Theme = theme() === 'dark' ? 'light' : 'dark';
  switching = true;
  flood(event, palettes.phone[next].bg as string, () => {
    root.dataset.theme = next;
    try {
      localStorage.setItem('vbs-theme', next);
    } catch {
      /* the choice will not persist */
    }
    showTheme();
    scene?.setTheme(next);
    switching = false;
  });
});
systemDark.addEventListener('change', () => {
  showTheme();
  scene?.setTheme(theme());
});
showTheme();

// ── Collapsing title ───────────────────────────────────────────────────────
const title = $<HTMLElement>('.title');
if (title) new IntersectionObserver(([e]) => document.body.classList.toggle('is-scrolled', !e?.isIntersecting), { rootMargin: '-64px 0px 0px 0px' }).observe(title);

// ── Hardware: the selected part comes apart on the phone ───────────────────
const hardware = $<HTMLElement>('[data-hardware]');
const hwRows = hardware ? [...hardware.querySelectorAll<HTMLElement>('[data-part]')] : [];
const desktop = matchMedia('(min-width: 1000px)');
let selected: PhonePartId | null = null;

function select(id: PhonePartId | null): void {
  if (id === selected) return;
  selected = id;
  for (const r of hwRows) {
    const on = r.dataset.part === id;
    r.classList.toggle('is-selected', on);
    r.querySelector('[data-part-button]')?.setAttribute('aria-expanded', String(on));
  }
  sync();
}
const pickLine = () => innerHeight * (desktop.matches ? 0.46 : 0.66);

function pickByScroll(): void {
  if (!hardware || router.current()) return;
  const line = pickLine();
  const box = hardware.getBoundingClientRect();
  if (box.top > line || box.bottom < line - 40) return select(null);
  let pick: PhonePartId | null = null;
  for (const r of hwRows) if (r.getBoundingClientRect().top <= line) pick = r.dataset.part as PhonePartId;
  select(pick);
}
for (const r of hwRows) {
  r.querySelector('[data-part-button]')?.addEventListener('click', () => {
    const top = r.getBoundingClientRect().top;
    window.scrollTo({ top: window.scrollY + top - pickLine() + 28, behavior: caps.reducedMotion ? 'auto' : 'smooth' });
    select(r.dataset.part as PhonePartId);
  });
}

// ── Views, search, Developer options ───────────────────────────────────────
const router = createRouter(() => {
  select(null);
  sync();
});
initSearch((href) => {
  location.hash = href;
  const row = href.startsWith('#layer-') ? document.getElementById(href.slice(1)) : null;
  row?.querySelector<HTMLElement>('[data-part-button]')?.click();
});
const dev = initDevOptions(() => scene);

// ── 3D device ──────────────────────────────────────────────────────────────
const slots = { device: $('[data-slot="device"]'), inline: $('[data-slot="device-inline"]'), hardware: $('[data-slot="hardware"]') };
const shown = (el: Element | null): number => {
  if (!el) return 0;
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return 0;
  return Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) / r.height;
};

function sync(): void {
  if (!scene) return;
  const app = router.current();
  let slot: Element | null;
  if (shown(slots.device) > 0) slot = slots.device;
  else if (app) slot = null;
  else slot = shown(slots.hardware) > shown(slots.inline) ? slots.hardware : shown(slots.inline) > 0 ? slots.inline : null;
  const max = document.documentElement.scrollHeight - innerHeight;
  scene.setState({ slot, active: app ? null : selected, app: app ? { name: app.name, metric: app.metric, screen: app.screen } : null, scroll: max > 0 ? Math.min(1, scrollY / max) : 0 });
}
let ticking = false;
const onScroll = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    pickByScroll();
    sync();
  });
};
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll);

// Drag sideways on the phone to turn it; vertical drags still scroll the page.
for (const slot of Object.values(slots)) {
  if (!(slot instanceof HTMLElement)) continue;
  let lastX: number | null = null;
  slot.addEventListener('pointerdown', (e) => {
    lastX = e.clientX;
    slot.setPointerCapture(e.pointerId);
  });
  slot.addEventListener('pointermove', (e) => {
    if (lastX === null) return;
    scene?.nudge(e.clientX - lastX);
    lastX = e.clientX;
  });
  const end = () => (lastX = null);
  slot.addEventListener('pointerup', end);
  slot.addEventListener('pointercancel', end);
}

async function boot(): Promise<void> {
  const canvas = $<HTMLCanvasElement>('#stage');
  if (!caps.webgl || !canvas) {
    root.dataset.scene = 'still';
    return;
  }
  try {
    const { createPhoneScene } = await import('./scene');
    scene = createPhoneScene(canvas, {
      theme: theme(),
      reducedMotion: caps.reducedMotion,
      tier: caps.tier,
      onContextLost: () => (root.dataset.scene = 'still'),
      onContextRestored: () => (root.dataset.scene = 'live'),
    });
    scene.setRows($$<HTMLElement>('[data-view="home"] [data-mini]').map((el) => el.dataset.mini ?? ''));
    scene.onAfterFrame(dev.frame);
    root.dataset.scene = 'live';
    pickByScroll();
    sync();
  } catch (err) {
    console.warn('3D phone unavailable, showing the still image.', err);
    root.dataset.scene = 'still';
  }
}
bootWhenQuiet(() => void boot());
