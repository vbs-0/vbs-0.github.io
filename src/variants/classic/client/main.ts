/** Classic: layer accordion, the work filter, section highlighting and the 3D stack and skyline. */
import type { LayerId } from '@/content/types';
import { initReveal } from '@/lib/motion/reveal';
import { bootFx } from '@/lib/motion/fx';
import { bootWhenQuiet } from '@/lib/motion/boot';
import { initSweep } from '@/lib/motion/sweep';
import { withViewTransition } from '@/lib/motion/view-transition';
import { detectCapabilities } from '@/lib/three/capabilities';
import { palettes } from '@/styles/palettes';
import type { ClassicScene } from './scene';

// First: lift the cover if this page arrived through a sweep, before anything else can fail.
initSweep();

const root = document.documentElement;
const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel);
const $$ = <T extends Element>(sel: string) => [...document.querySelectorAll<T>(sel)];
// Probe on the canvas the scene will use: one context, created once.
const caps = detectCapabilities(document.querySelector<HTMLCanvasElement>('#stage'));
const data = JSON.parse($('#scene-data')?.textContent ?? '{"weeks":[],"layers":[]}') as {
  weeks: ({ level: number; count: number } | null)[][];
  layers: { id: LayerId; name: string }[];
};
let scene: ClassicScene | undefined;

// ── Layers: one open at a time ─────────────────────────────────────────────
const layerItems = $$<HTMLElement>('.layer');
let selected: LayerId | null = null;
function selectLayer(id: LayerId | null): void {
  selected = id;
  for (const li of layerItems) {
    const on = li.dataset.layer === id;
    li.classList.toggle('is-open', on);
    li.querySelector('button')?.setAttribute('aria-expanded', String(on));
  }
  sync();
}
for (const li of layerItems) {
  li.querySelector('button')?.addEventListener('click', () => selectLayer(selected === li.dataset.layer ? null : (li.dataset.layer as LayerId)));
}

// ── Work filter ────────────────────────────────────────────────────────────
const filters = $$<HTMLButtonElement>('.filter');
const filterable = $$<HTMLElement>('[data-layers]');
const count = $<HTMLElement>('[data-count]');
function applyFilter(id: string): void {
  const keep = filterable.filter((el) => id === 'all' || (el.dataset.layers ?? '').split(' ').includes(id));
  const update = () => {
    for (const el of filterable) el.hidden = !keep.includes(el);
    for (const f of filters) f.setAttribute('aria-pressed', String(f.dataset.filter === id));
    const name = data.layers.find((l) => l.id === id)?.name;
    if (count) count.textContent = name ? `Showing ${keep.length} ${keep.length === 1 ? 'project' : 'projects'} in ${name}.` : `Showing all ${keep.length} projects.`;
  };
  // The projects that stay keep a name, so the browser moves them to their new places instead of
  // cross-fading the whole list. One view transition per filter.
  for (const el of filterable) el.style.viewTransitionName = '';
  for (const el of keep) if (el.id) el.style.viewTransitionName = `p-${el.id}`;
  const finished = withViewTransition(update);
  let cleared = false;
  const clear = () => {
    if (cleared) return;
    cleared = true;
    for (const el of keep) el.style.viewTransitionName = '';
  };
  if (finished) void finished.then(clear);
  else clear();
  // A backstop: a transition the browser abandons must never leave names behind.
  window.setTimeout(clear, 900);
}
for (const f of filters) f.addEventListener('click', () => applyFilter(f.dataset.filter ?? 'all'));
for (const a of $$<HTMLAnchorElement>('[data-filter-link]')) a.addEventListener('click', () => applyFilter(a.dataset.filterLink ?? 'all'));

// ── Which section is on screen ─────────────────────────────────────────────
const navLinks = $$<HTMLAnchorElement>('.nav__links a');
const spy = new IntersectionObserver(
  (entries) => {
    for (const e of entries) if (e.isIntersecting) for (const a of navLinks) a.setAttribute('aria-current', String(a.hash === `#${e.target.id}`));
  },
  { rootMargin: '-40% 0px -55% 0px' },
);
for (const a of navLinks) {
  const section = document.getElementById(a.hash.slice(1));
  if (section) spy.observe(section);
}

// ── Scene ──────────────────────────────────────────────────────────────────
const slots = { hero: $('[data-slot="hero"]'), stack: $('[data-slot="stack"]'), skyline: $('[data-slot="skyline"]') };
const shown = (el: Element | null): number => {
  if (!el) return 0;
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return 0;
  return Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) / r.height;
};
function sync(): void {
  if (!scene) return;
  const v = { hero: shown(slots.hero), stack: shown(slots.stack), skyline: shown(slots.skyline) };
  const best = (Object.keys(v) as (keyof typeof v)[]).reduce((a, b) => (v[b] > v[a] ? b : a));
  if (v[best] <= 0) return scene.setState({ subject: null, slot: null, open: 0, selected });
  if (best === 'skyline') return scene.setState({ subject: 'skyline', slot: slots.skyline, open: 0, selected });
  scene.setState({ subject: 'stack', slot: slots[best], open: best === 'stack' ? 1 : 0, selected: best === 'stack' ? selected : null });
}
addEventListener('scroll', sync, { passive: true });
addEventListener('resize', sync);

// Selecting a slab in the 3D stack opens its layer.
const stackSlot = slots.stack;
if (stackSlot instanceof HTMLElement) {
  stackSlot.addEventListener('pointermove', (e) => (stackSlot.style.cursor = scene?.pick(e.clientX, e.clientY) ? 'pointer' : ''));
  stackSlot.addEventListener('click', (e) => {
    const id = scene?.pick(e.clientX, e.clientY);
    if (id) selectLayer(selected === id ? null : id);
  });
}

async function boot(): Promise<void> {
  const canvas = $<HTMLCanvasElement>('#stage');
  if (!caps.webgl || !canvas) {
    root.dataset.scene = 'still';
    return;
  }
  try {
    const { createClassicScene } = await import('./scene');
    const p = palettes.classic.dark;
    const key = (id: string) => `layer${id.charAt(0).toUpperCase()}${id.slice(1)}`;
    scene = createClassicScene(canvas, {
      layers: data.layers.map((l) => ({ ...l, color: p[key(l.id)] ?? '#ffffff' })),
      weeks: data.weeks,
      accent: p.accent ?? '#edca71',
      reducedMotion: caps.reducedMotion,
      tier: caps.tier,
      onContextLost: () => (root.dataset.scene = 'still'),
      onContextRestored: () => (root.dataset.scene = 'live'),
    });
    root.dataset.scene = 'live';
    sync();
  } catch (err) {
    console.warn('3D scene unavailable, showing the still version.', err);
    root.dataset.scene = 'still';
  }
}
bootFx();
initReveal('.project, .more__row, .contact');
bootWhenQuiet(() => void boot());
