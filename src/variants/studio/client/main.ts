/**
 * Studio: the loading counter, smooth wheel, the hero's dust field, the work list's pointer picture,
 * the progress line and the pill's current section. Everything reads cached positions while scrolling.
 * Three.js is loaded with dynamic imports after first paint (or behind the loading counter).
 */
import Lenis from 'lenis';
import { bootWhenQuiet } from '@/lib/motion/boot';
import { bootFx } from '@/lib/motion/fx';
import { initSweep } from '@/lib/motion/sweep';
import { detectCapabilities } from '@/lib/three/capabilities';
import { clamp01 } from '@/lib/three/math';
import type { Plane } from './plane';

// First: lift the cover if this page arrived through a sweep, before anything else can fail.
initSweep();

const root = document.documentElement;
// Only now may the stylesheet hide anything for an entrance: if this script never runs, nothing is hidden.
root.classList.add('studio-ready');

const $ = <T extends Element>(sel: string, scope: ParentNode = document) => scope.querySelector<T>(sel);
const $$ = <T extends Element>(sel: string, scope: ParentNode = document) => [...scope.querySelectorAll<T>(sel)];
const motionOff = root.dataset.motion === 'off' || new URLSearchParams(location.search).get('motion') === 'off';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || motionOff;
const fine = matchMedia('(pointer: fine)').matches;

bootFx();

const hero = $<HTMLElement>('.hero');
const progress = $<HTMLElement>('.progress');
const canvas = $<HTMLCanvasElement>('#field');
let lenis: Lenis | null = null;
let webgl = false;

// ── Scroll: one write per frame ─────────────────────────────────────────────
let last = -1;
function onScroll(): void {
  const max = document.documentElement.scrollHeight - innerHeight;
  const p = max > 0 ? clamp01(scrollY / max) : 0;
  if (p !== last && progress) {
    progress.style.setProperty('--p', p.toFixed(4));
    last = p;
  }
}
if (!reduced) {
  lenis = new Lenis({ autoRaf: true, lerp: 0.1, smoothWheel: true, syncTouch: false, anchors: true });
  lenis.on('scroll', onScroll);
} else {
  addEventListener('scroll', onScroll, { passive: true });
}
onScroll();

// ── The pill shows where you are ────────────────────────────────────────────
const links = new Map($$<HTMLAnchorElement>('.pill__nav a').map((a) => [a.hash.slice(1), a] as const));
const marks = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const [id, a] of links) {
        if (id === entry.target.id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      }
    }
  },
  { rootMargin: '-45% 0px -50% 0px' },
);
for (const id of links.keys()) {
  const el = document.getElementById(id);
  if (el) marks.observe(el);
}

// ── The hero's entrance ─────────────────────────────────────────────────────
let titleLit = false;
function startTitle(): void {
  if (titleLit || !hero) return;
  titleLit = true;
  $$<HTMLElement>('.rise', hero).forEach((el, i) => (el.style.transitionDelay = `${260 + i * 110}ms`));
  hero.classList.add('is-on');
}

// ── Loading: the counter follows the real work ──────────────────────────────
const leaderOn = root.dataset.leader === 'on';
const done = { fonts: false, field: false, load: document.readyState === 'complete' };
if (!done.load) addEventListener('load', () => (done.load = true), { once: true });
void (document.fonts?.ready ?? Promise.resolve()).then(() => (done.fonts = true));

function endLoading(): void {
  if (root.dataset.leader !== 'on') return;
  root.dataset.leader = 'out';
  lenis?.start();
  window.setTimeout(startTitle, 280);
  window.setTimeout(() => {
    if (root.dataset.leader === 'out') delete root.dataset.leader;
  }, 900);
}

if (leaderOn) {
  lenis?.stop();
  // The pre-paint watchdog can remove the cover before the counter gets another frame.
  const watchdog = new MutationObserver(() => {
    if (root.dataset.leader) return;
    watchdog.disconnect();
    lenis?.start();
    startTitle();
  });
  watchdog.observe(root, { attributes: true, attributeFilter: ['data-leader'] });
  const num = $<HTMLElement>('[data-pre-count]');
  const bar = $<HTMLElement>('[data-pre-bar]');
  const t0 = performance.now();
  let shown = 0;
  let skipped = false;
  for (const type of ['keydown', 'pointerdown', 'touchstart'] as const) addEventListener(type, () => (skipped = true), { once: true, passive: true });
  const tick = () => {
    if (root.dataset.leader !== 'on') return;
    const t = performance.now() - t0;
    const real = 0.12 + (done.fonts ? 0.3 : 0) + (done.field ? 0.33 : 0) + (done.load ? 0.25 : 0);
    // A floor on the time keeps the counter readable even on a warm cache; a ceiling keeps it honest on a cold one.
    const goal = skipped || t > 4500 ? 1 : Math.min(real, t / 1100);
    shown += (goal - shown) * (skipped ? 0.5 : 0.1);
    if (goal >= 1 && shown > 0.995) shown = 1;
    if (num) num.textContent = String(Math.round(shown * 100));
    bar?.style.setProperty('--p', shown.toFixed(3));
    if (shown >= 1) window.setTimeout(endLoading, 160);
    else requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
} else {
  // Arriving through a sweep, the cover is still leaving: start the title as it goes.
  window.setTimeout(startTitle, root.dataset.sweep ? 380 : 60);
}

// ── The dust field ──────────────────────────────────────────────────────────
async function bootField(): Promise<void> {
  const caps = detectCapabilities(canvas);
  webgl = caps.webgl;
  if (!caps.webgl || !canvas) {
    root.dataset.scene = 'still';
    done.field = true;
    return;
  }
  try {
    const { createField } = await import('./field');
    const set = await createField(canvas, {
      tier: caps.tier,
      reducedMotion: reduced,
      onContextLost: () => (root.dataset.scene = 'still'),
      onContextRestored: () => (root.dataset.scene = 'live'),
    });
    await set.ready;
    root.dataset.scene = 'live';
    new IntersectionObserver((entries) => set.visible(entries.some((e) => e.isIntersecting))).observe(hero ?? canvas);
    if (fine && !reduced && hero) {
      addEventListener(
        'pointermove',
        (e) => {
          const r = hero.getBoundingClientRect();
          if (r.bottom < 0) return;
          set.point(e.clientX / innerWidth, 1 - (e.clientY - r.top) / r.height);
        },
        { passive: true },
      );
    }
  } catch (err) {
    console.warn('The dust field is unavailable, showing the still hero.', err);
    root.dataset.scene = 'still';
  }
  done.field = true;
}
if (leaderOn) requestAnimationFrame(() => requestAnimationFrame(() => window.setTimeout(() => void bootField(), 40)));
else bootWhenQuiet(() => void bootField());

// ── The work list's picture ─────────────────────────────────────────────────
if (fine && !reduced) {
  const rows = $$<HTMLElement>('.row[data-preview]');
  let plane: Plane | null = null;
  let loading: Promise<Plane | null> | null = null;
  let hovered: HTMLElement | null = null;
  const pt = { x: 0, y: 0 };
  const apply = (p: Plane) => {
    const row = hovered;
    if (!row?.dataset.preview) return;
    const w = Number(row.dataset.w) || 720;
    const h = Number(row.dataset.h) || 450;
    p.show(row.dataset.preview, h / w);
  };
  const ensure = () => {
    loading ??= (async () => {
      if (!webgl) return null;
      try {
        const el = document.createElement('canvas');
        el.className = 'plane';
        el.setAttribute('aria-hidden', 'true');
        document.body.append(el);
        const { createPlane } = await import('./plane');
        plane = await createPlane(el, () => el.remove());
        root.dataset.plane = 'live';
        plane.move(pt.x, pt.y);
        if (hovered) apply(plane);
        return plane;
      } catch (err) {
        console.warn('The work picture is unavailable.', err);
        return null;
      }
    })();
    return loading;
  };
  for (const row of rows) {
    row.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      hovered = row;
      plane?.move(e.clientX, e.clientY);
      if (plane) apply(plane);
      else void ensure();
    });
    row.addEventListener(
      'pointermove',
      (e) => {
        pt.x = e.clientX;
        pt.y = e.clientY;
        plane?.move(e.clientX, e.clientY);
      },
      { passive: true },
    );
    row.addEventListener('pointerleave', () => {
      if (hovered === row) hovered = null;
      plane?.hide();
    });
  }
}
