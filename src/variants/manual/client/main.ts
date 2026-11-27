/** Service manual: theme switch, sheet navigation, the parts list, and the scroll that takes the phone apart. */
import type { PhonePartId } from '@/content/types';
import { detectCapabilities } from '@/lib/three/capabilities';
import { clamp01, smoothstep } from '@/lib/three/math';
import type { Theme } from '@/styles/palettes';
import type { ManualScene } from './scene';

const root = document.documentElement;
const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel);
const $$ = <T extends Element>(sel: string) => [...document.querySelectorAll<T>(sel)];

let scene: ManualScene | undefined;
const caps = detectCapabilities();
if (caps.reducedMotion) root.dataset.motion = 'off';

// ── Theme ──────────────────────────────────────────────────────────────────
const systemDark = matchMedia('(prefers-color-scheme: dark)');
const theme = (): Theme => (root.dataset.theme === 'light' || root.dataset.theme === 'dark' ? root.dataset.theme : systemDark.matches ? 'dark' : 'light');
const themeButton = $<HTMLButtonElement>('[data-theme-toggle]');
const showTheme = () => themeButton?.setAttribute('aria-pressed', String(theme() === 'dark'));
themeButton?.addEventListener('click', () => {
  const next: Theme = theme() === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try {
    localStorage.setItem('vbs-theme', next);
  } catch {
    /* the choice simply will not persist */
  }
  showTheme();
  scene?.setTheme(next);
});
systemDark.addEventListener('change', () => {
  showTheme();
  scene?.setTheme(theme());
});
showTheme();

// ── Which sheet is on screen ───────────────────────────────────────────────
const navLinks = $$<HTMLAnchorElement>('.bar__nav a');
const spy = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      for (const a of navLinks) a.setAttribute('aria-current', String(a.hash === `#${e.target.id}`));
    }
  },
  { rootMargin: '-40% 0px -55% 0px' },
);
for (const s of $$<HTMLElement>('.sheet')) spy.observe(s);

// ── Parts list ─────────────────────────────────────────────────────────────
const rows = $$<HTMLElement>('.part');
const balloons = $$<HTMLButtonElement>('.balloon');
const ids = rows.map((r) => r.dataset.part as PhonePartId);
let active = -1;

function select(i: number): void {
  active = i;
  rows.forEach((r, k) => {
    r.classList.toggle('is-active', k === i);
    r.querySelector('button')?.setAttribute('aria-expanded', String(k === i));
  });
  balloons.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
}

// ── The scroll that takes the phone apart ──────────────────────────────────
const track = $<HTMLElement>('[data-explode-track]');
const pin = $<HTMLElement>('.explode__pin');
const bar = $<HTMLElement>('.bar');
const slots = { cover: $('[data-slot="cover"]'), exploded: $('[data-slot="exploded"]') };
const RUN_IN = 0.08;
const pinned = () => root.dataset.scene === 'live' && root.dataset.motion !== 'off';

function span(): { top: number; length: number } {
  if (!track || !pin) return { top: 0, length: 0 };
  const rect = track.getBoundingClientRect();
  return { top: (bar?.offsetHeight ?? 0) - rect.top, length: rect.height - pin.offsetHeight };
}

function goToStep(i: number): void {
  if (!pinned()) {
    select(i);
    rows[i]?.scrollIntoView({ block: 'nearest', behavior: caps.reducedMotion ? 'auto' : 'smooth' });
    sync();
    return;
  }
  const s = span();
  const p = RUN_IN + ((i + 0.5) / rows.length) * (1 - RUN_IN);
  window.scrollTo({ top: window.scrollY - s.top + p * s.length, behavior: 'smooth' });
}
rows.forEach((r, i) => r.querySelector('button')?.addEventListener('click', () => goToStep(i)));
balloons.forEach((b, i) => b.addEventListener('click', () => goToStep(i)));

const shown = (el: Element | null): number => {
  if (!el) return 0;
  const r = el.getBoundingClientRect();
  const h = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
  return r.height > 0 ? Math.max(0, h) / r.height : 0;
};

function sync(): void {
  const coverShown = shown(slots.cover);
  const explodedShown = shown(slots.exploded);
  const slot = explodedShown > 0 && explodedShown >= coverShown ? slots.exploded : coverShown > 0 ? slots.cover : null;
  let explode = slot === slots.exploded ? 1 : 0;
  if (pinned()) {
    const s = span();
    const p = s.length > 0 ? clamp01(s.top / s.length) : 0;
    explode = slot === slots.exploded ? smoothstep(0, RUN_IN * 0.85, p) : 0;
    const step = slot === slots.exploded && p >= RUN_IN ? Math.min(rows.length - 1, Math.floor(((p - RUN_IN) / (1 - RUN_IN)) * rows.length)) : -1;
    if (step !== active) select(step);
  }
  scene?.setState({ slot, explode, active: active >= 0 ? (ids[active] ?? null) : null });
}
addEventListener('scroll', sync, { passive: true });
addEventListener('resize', sync);

// ── Leader line from the selected balloon to its part ──────────────────────
const leader = $<SVGSVGElement>('.leader');
const line = leader?.querySelector('line');
const dot = leader?.querySelector('circle');
function drawLeader(): void {
  if (!leader || !line || !dot || !scene) return;
  const balloon = balloons[active];
  const id = ids[active];
  if (!balloon || !id || root.dataset.scene !== 'live') {
    leader.style.visibility = 'hidden';
    return;
  }
  const from = balloon.getBoundingClientRect();
  const to = scene.anchor(id);
  // Start on the rim of the balloon, not at its centre.
  const cx = from.left + from.width / 2;
  const cy = from.top + from.height / 2;
  const len = Math.hypot(to.x - cx, to.y - cy) || 1;
  const r = from.width / 2;
  leader.style.visibility = from.width > 0 ? 'visible' : 'hidden';
  line.setAttribute('x1', String(cx + ((to.x - cx) / len) * r));
  line.setAttribute('y1', String(cy + ((to.y - cy) / len) * r));
  line.setAttribute('x2', String(to.x));
  line.setAttribute('y2', String(to.y));
  dot.setAttribute('cx', String(to.x));
  dot.setAttribute('cy', String(to.y));
}

// ── Scene ──────────────────────────────────────────────────────────────────
const canvas = $<HTMLCanvasElement>('#stage');
async function boot(): Promise<void> {
  if (!caps.webgl || !canvas) {
    root.dataset.scene = 'still';
    return;
  }
  try {
    const { createManualScene } = await import('./scene');
    scene = createManualScene(canvas, {
      theme: theme(),
      reducedMotion: caps.reducedMotion,
      tier: caps.tier,
      onContextLost: () => (root.dataset.scene = 'still'),
      onContextRestored: () => (root.dataset.scene = 'live'),
    });
    scene.onAfterFrame(drawLeader);
    root.dataset.scene = 'live';
    if (!pinned() && active < 0) select(0);
    sync();
  } catch (err) {
    console.warn('3D drawing unavailable, showing the still image.', err);
    root.dataset.scene = 'still';
  }
}
if ('requestIdleCallback' in window) requestIdleCallback(() => void boot(), { timeout: 1200 });
else setTimeout(() => void boot(), 200);
