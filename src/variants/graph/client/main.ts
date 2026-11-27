/**
 * System map: the nodes ride on the 3D chart, the panel reads out whatever is selected, the palette finds
 * anything by name, and the chips filter by layer. Positions come from the scene each frame; without WebGL
 * the nodes stay where the server put them.
 */
import { bootWhenQuiet } from '@/lib/motion/boot';
import { bootFx } from '@/lib/motion/fx';
import { initSweep } from '@/lib/motion/sweep';
import { detectCapabilities } from '@/lib/three/capabilities';
import { initPalette } from './palette';
import type { GraphEdge, GraphNode, GraphScene } from './scene';

initSweep();
bootFx();

const root = document.documentElement;
const $ = <T extends Element>(sel: string, scope: ParentNode = document) => scope.querySelector<T>(sel);
const $$ = <T extends Element>(sel: string, scope: ParentNode = document) => [...scope.querySelectorAll<T>(sel)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).get('motion') === 'off';

interface Detail {
  kind: 'project' | 'layer' | 'skill';
  title: string;
  meta: string;
  line: string;
  body?: string;
  metric?: { value: string; label: string } | null;
  stack: string[];
  projects?: string[];
  links?: { label: string; url: string; icon: string }[];
  href: string;
  layer: string;
}
interface Payload {
  nodes: GraphNode[];
  edges: GraphEdge[];
  details: Record<string, Detail>;
  palette: { id: string; label: string; kind: string; layer: string }[];
  hrefs: Record<string, string>;
}

const payload = JSON.parse($('#map-data')?.textContent ?? '{}') as Payload;
const map = $<HTMLElement>('.map');
const canvas = $<HTMLCanvasElement>('#map-canvas');
const panel = $<HTMLElement>('#panel');
const nodeEls = $$<HTMLButtonElement>('[data-node]');
const chips = $$<HTMLButtonElement>('[data-filter]');
const liveNodes = new Map(nodeEls.map((el) => [el.dataset.node ?? '', el]));
let scene: GraphScene | undefined;
let selected: string | null = null;
let filter: string | null = null;

// ── The panel ──────────────────────────────────────────────────────────────
function action(href: string, label: string, icon: string, primary = false): HTMLAnchorElement {
  const a = document.createElement('a');
  a.className = primary ? 'btn btn--signal' : 'btn';
  a.href = href;
  a.innerHTML = `<svg class="icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"></svg><span></span>`;
  const svg = a.querySelector('svg');
  const span = a.querySelector('span');
  if (span) span.textContent = label;
  if (svg) svg.innerHTML = ICONS[icon] ?? ICONS.external ?? '';
  return a;
}

const ICONS: Record<string, string> = {
  external: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
  github: '<path d="M9 19c-4 1.5-4-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.8 2.8 5.8 3.1 5.8 3.1a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  package: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  evidence: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15l2 2 4-4"/>',
};

function resetPanel(): void {
  if (!panel) return;
  panel.classList.remove('is-open');
  panel.innerHTML = '';
  const kicker = document.createElement('p');
  kicker.className = 'panel__kicker';
  kicker.textContent = 'System map';
  const title = document.createElement('h1');
  title.className = 'panel__title';
  title.textContent = 'Everything I build, on one chart.';
  const hint = document.createElement('p');
  hint.className = 'panel__hint';
  hint.append('Pick a node, or press ');
  const kbd = document.createElement('kbd');
  kbd.textContent = '⌘K';
  hint.append(kbd, ' and type.');
  panel.append(kicker, title, hint);
}

function showPanel(id: string): void {
  const d = payload.details[id];
  if (!d || !panel) return;
  panel.classList.add('is-open');
  panel.innerHTML = '';
  const kicker = document.createElement('p');
  kicker.className = 'panel__kicker';
  kicker.textContent = d.kind === 'project' ? 'Project' : d.kind === 'layer' ? 'Layer' : 'Tool';
  const title = document.createElement('h2');
  title.className = 'panel__title';
  title.textContent = d.title;
  const meta = document.createElement('p');
  meta.className = 'panel__meta';
  meta.textContent = d.meta;
  panel.append(kicker, title, meta);

  if (d.metric) {
    const m = document.createElement('p');
    m.className = 'panel__metric';
    const b = document.createElement('b');
    b.textContent = d.metric.value;
    m.append(b, ` ${d.metric.label}`);
    panel.append(m);
  }
  if (d.line) {
    const p = document.createElement('p');
    p.className = 'panel__line';
    p.textContent = d.line;
    panel.append(p);
  }
  if (d.body) {
    const p = document.createElement('p');
    p.className = 'panel__body';
    p.textContent = d.body;
    panel.append(p);
  }
  if (d.stack.length > 0) {
    const ul = document.createElement('ul');
    ul.className = 'panel__tags';
    ul.setAttribute('aria-label', d.kind === 'layer' ? 'Built with' : 'Stack');
    for (const s of d.stack) {
      const li = document.createElement('li');
      li.textContent = s;
      ul.append(li);
    }
    panel.append(ul);
  }
  if (d.projects && d.projects.length > 0) {
    const ul = document.createElement('ul');
    ul.className = 'panel__projects';
    ul.setAttribute('aria-label', 'Projects');
    for (const name of d.projects) {
      const li = document.createElement('li');
      li.textContent = name;
      ul.append(li);
    }
    panel.append(ul);
  }
  const actions = document.createElement('div');
  actions.className = 'panel__actions';
  if (d.href) actions.append(action(d.href, d.kind === 'project' ? 'The whole scene' : d.kind === 'layer' ? 'See this layer in the film' : 'The reel', 'external', true));
  for (const l of d.links ?? []) actions.append(action(l.url, l.label, l.icon));
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'panel__back';
  back.textContent = 'Whole map';
  back.addEventListener('click', () => select(null));
  actions.append(back);
  panel.append(actions);
}

function select(id: string | null): void {
  selected = id;
  for (const el of nodeEls) {
    const on = el.dataset.node === id;
    el.classList.toggle('is-selected', on);
    if (on) el.setAttribute('aria-current', 'true');
    else el.removeAttribute('aria-current');
  }
  scene?.select(id);
  if (id) showPanel(id);
  else resetPanel();
  if (id) map?.classList.add('has-selection');
  else map?.classList.remove('has-selection');
}

// ── Filters ────────────────────────────────────────────────────────────────
function applyFilter(layer: string | null): void {
  filter = layer;
  for (const chip of chips) {
    const on = (chip.dataset.filter ?? 'all') === (layer ?? 'all');
    chip.classList.toggle('is-on', on);
    chip.setAttribute('aria-pressed', String(on));
  }
  for (const el of nodeEls) {
    el.classList.toggle('is-dim', layer !== null && el.dataset.layer !== layer);
  }
  scene?.filter(layer);
  if (selected && layer && payload.nodes.find((n) => n.id === selected)?.layer !== layer) select(null);
}
for (const chip of chips) chip.addEventListener('click', () => applyFilter(chip.dataset.filter === 'all' ? null : (chip.dataset.filter ?? null)));

// ── Nodes ──────────────────────────────────────────────────────────────────
for (const el of nodeEls) {
  const id = el.dataset.node ?? '';
  el.addEventListener('click', () => select(id));
  el.addEventListener('pointerenter', () => {
    scene?.hover(id);
    el.classList.add('is-hover');
  });
  el.addEventListener('pointerleave', () => {
    scene?.hover(null);
    el.classList.remove('is-hover');
  });
  el.addEventListener('focus', () => scene?.hover(id));
  el.addEventListener('blur', () => scene?.hover(null));
}

// ── The palette ────────────────────────────────────────────────────────────
initPalette({
  items: payload.palette,
  hrefs: payload.hrefs,
  onSelect(id) {
    if (id.startsWith('action:')) return 'navigate';
    const node = payload.nodes.find((n) => n.id === id);
    if (node) {
      applyFilter(null);
      select(id);
      liveNodes.get(id)?.focus({ preventScroll: true });
    }
    return 'select';
  },
});

// ── The live chart ─────────────────────────────────────────────────────────
async function boot(): Promise<void> {
  const caps = detectCapabilities(canvas);
  if (!caps.webgl || !canvas) {
    root.dataset.scene = 'still';
    return;
  }
  try {
    const { createGraphScene } = await import('./scene');
    const set = await createGraphScene(canvas, {
      nodes: payload.nodes,
      edges: payload.edges,
      tier: caps.tier,
      reducedMotion: reduced,
      onContextLost: () => (root.dataset.scene = 'still'),
      onContextRestored: () => (root.dataset.scene = 'live'),
    });
    scene = set;
    await set.ready;
    root.dataset.scene = 'live';
    map?.classList.add('is-live');

    const list: { id: string; x: number; y: number; depth: number; visible: boolean }[] = [];
    const draw = () => {
      requestAnimationFrame(draw);
      if (document.hidden) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight) return;
      set.project(list);
      for (const p of list) {
        const el = liveNodes.get(p.id);
        if (!el) continue;
        // The camera is framed so the whole chart fits the box; positions are used as projected.
        el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
        el.style.opacity = p.visible ? String(1 - p.depth * 0.45) : '0';
        el.style.pointerEvents = p.visible ? '' : 'none';
        el.style.zIndex = String(1000 - Math.round(p.depth * 900));
      }
    };
    draw();
    if (selected) set.select(selected);
    if (filter) set.filter(filter);
  } catch (err) {
    console.warn('The chart is not available; the flat map is shown instead.', err);
    root.dataset.scene = 'still';
  }
}
bootWhenQuiet(() => void boot());

if (!reduced && matchMedia('(pointer: fine)').matches) {
  addEventListener('pointermove', (e) => scene?.pointer((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1), { passive: true });
}
