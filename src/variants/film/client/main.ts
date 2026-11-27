/**
 * Film: the countdown leader, the director (which scene is on, where the camera is, the strip and the
 * timecode), the reel, the rolling counters, the cameos and the 3D set.
 * Positions are measured once per layout change and read from cache while scrolling, so a scroll frame
 * costs a few transforms and no layout.
 */
import Lenis from 'lenis';
import { bootWhenQuiet } from '@/lib/motion/boot';
import { bootFx } from '@/lib/motion/fx';
import { initSweep } from '@/lib/motion/sweep';
import { detectCapabilities } from '@/lib/three/capabilities';
import { clamp01 } from '@/lib/three/math';
import { palettes } from '@/styles/palettes';
import { initAutofocus } from './autofocus';
import { filmGrain } from './grain';
import { type Odometer, odometer } from './odometer';
import type { FilmScene } from './scene';
import { playhead, timecode } from './timeline';

// First: lift the cover if this page arrived through a sweep, before anything else can fail.
initSweep();

const root = document.documentElement;
// Only now may the stylesheet hide anything for an entrance: if this script never runs, nothing is hidden.
root.classList.add('film-ready');

const $ = <T extends Element>(sel: string, scope: ParentNode = document) => scope.querySelector<T>(sel);
const $$ = <T extends Element>(sel: string, scope: ParentNode = document) => [...scope.querySelectorAll<T>(sel)];
const canvas = $<HTMLCanvasElement>('#stage');
// Cheap checks now; the WebGL probe waits for boot(), because creating a context is a long task and the
// countdown has to be on screen, running on the compositor, before the main thread gets busy.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).get('motion') === 'off';
const pal = palettes.film.dark;
const GRADE: Record<string, string> = {
  title: pal.gTitle as string,
  interface: pal.gInterface as string,
  protocol: pal.gProtocol as string,
  services: pal.gServices as string,
  models: pal.gModels as string,
  system: pal.gSystem as string,
  ops: pal.gOps as string,
};
const LAYERS = ['interface', 'protocol', 'services', 'models', 'system', 'ops'];
/** The film "runs" three minutes from the first frame to the end card. */
const RUNTIME = 180;

filmGrain();
bootFx();
const af = initAutofocus();

// ── The acts ───────────────────────────────────────────────────────────────
interface Act {
  id: string;
  el: HTMLElement;
  top: number;
  height: number;
  grade: string;
  label: string;
  link: HTMLAnchorElement | null;
}
const acts: Act[] = $$<HTMLElement>('[data-act]').map((el) => {
  const id = el.dataset.act ?? '';
  const scene = LAYERS.indexOf(id);
  const heading = el.querySelector('h2')?.textContent?.trim() ?? '';
  return {
    id,
    el,
    top: 0,
    height: 0,
    grade: GRADE[id] ?? (GRADE.title as string),
    label: id === 'title' ? 'Main title' : scene >= 0 ? `Scene ${scene + 1} · ${heading}` : heading,
    link: $<HTMLAnchorElement>(`[data-strip="${id}"]`),
  };
});
/** The acts the camera plays through: the main title and the six layers, in page order. */
const camActs = acts.filter((a) => a.id === 'title' || LAYERS.includes(a.id));
const titleAct = acts.find((a) => a.id === 'title');
const reelAct = acts.find((a) => a.id === 'reel');

// ── The reel and its counters ──────────────────────────────────────────────
const track = $<HTMLElement>('.reel__track');
interface Frame {
  el: HTMLElement;
  left: number;
  width: number;
  top: number;
  height: number;
  odos: Odometer[];
  focus: boolean;
}
const frames: Frame[] = $$<HTMLElement>('.frame').map((el) => ({
  el,
  left: 0,
  width: 0,
  top: 0,
  height: 0,
  odos: $$<HTMLElement>('[data-odo]', el)
    .map((o) => odometer(o, reduced))
    .filter((o): o is Odometer => o !== null),
  focus: false,
}));
const loose = $$<HTMLElement>('[data-odo]').filter((el) => !el.closest('.frame'));
const looseObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      looseObserver.unobserve(entry.target);
      (entry.target as HTMLElement & { odo?: Odometer | null }).odo?.roll();
    }
  },
  { threshold: 0.6 },
);
for (const el of loose) {
  (el as HTMLElement & { odo?: Odometer | null }).odo = odometer(el, reduced);
  looseObserver.observe(el);
}

// ── Chrome ─────────────────────────────────────────────────────────────────
const sceneLabel = $<HTMLElement>('[data-scene-label]');
const strip = $<HTMLElement>('.strip__acts');
const head = $<HTMLElement>('.strip__head');
const tc = $<HTMLElement>('[data-timecode]');
const leakEl = $<HTMLElement>('.leak');
let scene: FilmScene | undefined;
let lenis: Lenis | null = null;

let vh = innerHeight;
let docH = 1;
/** Tall or narrow windows stack the picture above the words; the reel runs sideways only on wide ones. */
const STACKED = matchMedia('(max-aspect-ratio: 1/1), (max-width: 599px)');
const SIDEWAYS = matchMedia('(min-width: 900px) and (min-aspect-ratio: 1/1)');
let mobile = STACKED.matches;
let pinned = false;
let reelLen = 0;
let trackView = 1;
let stripLeft = 0;
let stripWidth = 1;
let activeIdx = -1;
let shotNow = 0;

function leak(color: string): void {
  if (!leakEl || reduced) return;
  leakEl.style.setProperty('--leak', color);
  leakEl.animate(
    [
      { opacity: 0, transform: 'translate3d(-55%, 0, 0)' },
      { opacity: 0.5, offset: 0.4 },
      { opacity: 0, transform: 'translate3d(55%, 0, 0)' },
    ],
    { duration: 950, easing: 'cubic-bezier(0.2, 0.6, 0.2, 1)' },
  );
}

function reveal(el: HTMLElement, base = 120): void {
  if (el.classList.contains('is-on')) return;
  $$<HTMLElement>('.rise', el).forEach((r, i) => (r.style.transitionDelay = `${base + i * 90}ms`));
  el.classList.add('is-on');
}

function setActive(idx: number, quiet: boolean): void {
  const act = acts[idx];
  if (!act) return;
  const prev = acts[activeIdx];
  activeIdx = idx;
  root.dataset.actNow = act.id;
  root.toggleAttribute('data-in-stack', LAYERS.includes(act.id));
  root.style.setProperty('--g-now', act.grade);
  if (sceneLabel) sceneLabel.textContent = act.label;
  for (const a of acts) a.link?.removeAttribute('aria-current');
  act.link?.setAttribute('aria-current', 'location');
  scene?.set({ grade: act.grade });
  if (!quiet && prev && prev.grade !== act.grade) leak(act.grade);
}

function focusFrame(frame: Frame, on: boolean): void {
  if (frame.focus === on) return;
  frame.focus = on;
  frame.el.classList.toggle('is-focus', on);
  if (on) for (const o of frame.odos) o.roll();
}

/** One scroll frame: reads cached positions, writes transforms and a few attributes. */
function update(quiet = false): void {
  const y = scrollY;
  const center = y + vh * 0.5;
  let idx = 0;
  for (let i = 0; i < acts.length; i++) if ((acts[i] as Act).top <= center) idx = i;
  if (idx !== activeIdx) setActive(idx, quiet);

  // The camera: scene k is fully on when its act is centred (on a phone, when its picture fills the top).
  const centers = camActs.map((a) => a.top + (mobile ? vh * 0.5 : a.height * 0.5));
  shotNow = playhead(centers, center);
  const last = camActs[camActs.length - 1];
  const end = last ? last.top + last.height : 0;
  const presence = 1 - clamp01((center - (end - vh * 0.1)) / (vh * 0.55));
  if (canvas) canvas.style.opacity = presence < 0.999 ? presence.toFixed(3) : '';
  scene?.set({ shot: shotNow, presence });

  // The strip: the playhead runs through the active act's segment as the act plays.
  const act = acts[idx];
  const within = act ? clamp01((center - act.top) / Math.max(1, act.height)) : 0;
  if (head) head.style.transform = `translate3d(${(stripLeft + ((idx + within) / acts.length) * stripWidth).toFixed(1)}px, 0, 0)`;
  if (tc) {
    const text = timecode(clamp01(y / Math.max(1, docH - vh)) * RUNTIME);
    if (tc.textContent !== text) tc.textContent = text;
  }

  // The reel: sideways on wide screens, a column on phones. A frame is graded until it is in focus.
  if (track && reelAct) {
    const onScreen = y + vh > reelAct.top + vh * 0.3 && y < reelAct.top + reelAct.height - vh * 0.3;
    if (pinned) {
      const shift = reelLen > 0 ? clamp01((y - reelAct.top) / reelLen) * reelLen : 0;
      track.style.transform = `translate3d(${(-shift).toFixed(1)}px, 0, 0)`;
      for (const f of frames) {
        const mid = f.left + f.width * 0.5;
        focusFrame(f, onScreen && mid > shift + trackView * 0.18 && mid < shift + trackView * 0.86);
      }
    } else {
      for (const f of frames) {
        const mid = f.top + f.height * 0.5;
        focusFrame(f, mid > y + vh * 0.15 && mid < y + vh * 0.85);
      }
    }
  }
  af.refresh();
}

function measure(): void {
  vh = innerHeight;
  mobile = STACKED.matches;
  pinned = SIDEWAYS.matches && track !== null;
  if (track) {
    // The pinned reel is as tall as its sideways travel: set that first, it moves everything below it.
    // The track scrolls inside its window, the .reel__view; that window's width is what is on screen.
    const view = track.parentElement ?? track;
    reelLen = pinned ? Math.max(0, track.scrollWidth - view.clientWidth) : 0;
    trackView = Math.max(1, view.clientWidth);
    root.style.setProperty('--reel-len', `${reelLen}px`);
    if (!pinned) track.style.transform = '';
  }
  const y = scrollY;
  for (const a of acts) {
    const r = a.el.getBoundingClientRect();
    a.top = r.top + y;
    a.height = r.height;
  }
  for (const f of frames) {
    f.left = f.el.offsetLeft - (track?.offsetLeft ?? 0);
    f.width = f.el.offsetWidth;
    const r = f.el.getBoundingClientRect();
    f.top = r.top + y;
    f.height = r.height;
  }
  docH = document.documentElement.scrollHeight;
  if (strip?.parentElement) {
    const r = strip.getBoundingClientRect();
    stripLeft = r.left - strip.parentElement.getBoundingClientRect().left;
    stripWidth = r.width;
  }
  update(true);
}

let measuring = 0;
const remeasure = () => {
  if (!measuring) measuring = requestAnimationFrame(() => ((measuring = 0), measure()));
};

// ── Scrolling: smooth wheel on desktop, native touch, nothing smoothed with reduced motion ──
if (!reduced) {
  lenis = new Lenis({ autoRaf: true, lerp: 0.1, smoothWheel: true, syncTouch: false, anchors: false });
  lenis.on('scroll', () => update());
} else {
  let ticking = false;
  addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        update();
      });
    },
    { passive: true },
  );
}
measure();
addEventListener('resize', remeasure, { passive: true });
addEventListener('load', remeasure);
void document.fonts?.ready.then(remeasure);
const main = $<HTMLElement>('main');
if (main) new ResizeObserver(remeasure).observe(main);

/** Scrolls to an act (a scene lands with its shot established) and moves keyboard focus there. */
function go(target: HTMLElement): void {
  let top = target.getBoundingClientRect().top + scrollY;
  const act = acts.find((a) => a.el === target);
  if (act && LAYERS.includes(act.id) && !mobile) top += Math.max(0, (act.height - vh) * 0.5);
  const focus = () => {
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  };
  history.pushState(null, '', `#${target.id}`);
  if (lenis) lenis.scrollTo(top, { duration: Math.min(2.6, 0.9 + Math.abs(top - scrollY) / 5000), onComplete: focus });
  else {
    scrollTo({ top, behavior: 'auto' });
    focus();
  }
}

document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const link = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
  if (link) {
    const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    go(target);
    return;
  }
  // Opening a project from the reel: the frame's title and picture morph into the project page's hero.
  const work = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="/work/"]');
  const id = work?.pathname.split('/')[2];
  const frame = id ? document.getElementById(`frame-${id}`) : null;
  if (!frame) return;
  const r = frame.getBoundingClientRect();
  if (r.right < 0 || r.left > innerWidth || r.bottom < 0 || r.top > innerHeight) return;
  const title = $<HTMLElement>('.frame__title', frame);
  const img = $<HTMLElement>('.frame__media img', frame);
  if (title) title.style.viewTransitionName = `title-${id}`;
  if (img) img.style.viewTransitionName = `shot-${id}`;
});
addEventListener('pageshow', () => {
  for (const el of $$<HTMLElement>('.frame__title, .frame__media img')) el.style.viewTransitionName = '';
});

// ── The strip: click a segment to cut to it, drag along it to scrub ───────
if (strip) {
  const scrubTo = (clientX: number) => {
    const r = strip.getBoundingClientRect();
    const f = clamp01((clientX - r.left) / Math.max(1, r.width)) * acts.length;
    const i = Math.min(acts.length - 1, Math.floor(f));
    const a = acts[i];
    if (!a) return;
    const y = Math.max(0, a.top + (f - i) * a.height - vh * 0.5);
    if (lenis) lenis.scrollTo(y, { immediate: true });
    else scrollTo(0, y);
  };
  strip.addEventListener('pointerdown', (down) => {
    if (down.button !== 0) return;
    let dragging = false;
    const move = (ev: PointerEvent) => {
      if (!dragging && Math.abs(ev.clientX - down.clientX) < 6) return;
      if (!dragging) {
        dragging = true;
        strip.setPointerCapture(down.pointerId);
      }
      scrubTo(ev.clientX);
    };
    const up = () => {
      strip.removeEventListener('pointermove', move);
      strip.removeEventListener('pointerup', up);
      strip.removeEventListener('pointercancel', up);
    };
    strip.addEventListener('pointermove', move);
    strip.addEventListener('pointerup', up);
    strip.addEventListener('pointercancel', up);
  });
}

// ── Entrances ──────────────────────────────────────────────────────────────
const entrances = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entrances.unobserve(entry.target);
      reveal(entry.target as HTMLElement);
    }
  },
  { rootMargin: '0px 0px -30% 0px' },
);
for (const a of acts) if (a !== titleAct) entrances.observe(a.el);

// ── Cameos, the toast and the director's HUD ───────────────────────────────
const toastEl = $<HTMLElement>('.toast');
let toastTimer = 0;
function toast(text: string): void {
  if (!toastEl) return;
  toastEl.textContent = text;
  toastEl.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove('is-on'), 2600);
}

let hud: HTMLElement | null = null;
let hudTimer = 0;
function toggleHud(on = !hud): void {
  if (on && !hud) {
    const panel = document.createElement('div');
    panel.className = 'hud';
    panel.setAttribute('aria-hidden', 'true');
    document.body.append(panel);
    hud = panel;
    const tick = () => {
      const s = scene?.stats();
      const act = acts[activeIdx]?.id ?? '';
      panel.innerHTML = s
        ? `<span>Director's HUD</span><span><b>${s.fps}</b> fps · <b>${s.ms}</b> ms a frame</span><span><b>${s.calls}</b> draw calls · <b>${s.triangles.toLocaleString('en-US')}</b> triangles</span><span>pixel ratio <b>${s.dpr}</b> · ${s.level}</span><span>shot <b>${shotNow.toFixed(2)}</b> · ${act}</span>`
        : `<span>Director's HUD</span><span>Still frames: WebGL is off</span><span>act ${act}</span>`;
    };
    tick();
    hudTimer = window.setInterval(tick, 250);
  } else if (!on && hud) {
    hud.remove();
    hud = null;
    clearInterval(hudTimer);
  }
}

const cameos = $$<HTMLElement>('.cameo');
let found = new Set<string>();
try {
  found = new Set(JSON.parse(sessionStorage.getItem('vbs-cameos') ?? '[]') as string[]);
} catch {
  /* a fresh hunt */
}
for (const c of cameos) {
  const id = c.dataset.cameo ?? '';
  if (found.has(id)) c.classList.add('is-found');
  c.addEventListener('click', () => {
    if (found.has(id)) return;
    found.add(id);
    c.classList.add('is-found');
    try {
      sessionStorage.setItem('vbs-cameos', JSON.stringify([...found]));
    } catch {
      /* the hunt will not survive a reload */
    }
    if (found.size === cameos.length) {
      toast("Every cameo found. Director's HUD on");
      toggleHud(true);
    } else toast(`Cameo ${found.size} of ${cameos.length}`);
  });
}
let typed = '';
addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
  typed = (typed + e.key.toLowerCase()).slice(-3);
  if (typed !== 'vbs') return;
  toggleHud();
  toast(hud ? "Director's HUD on" : "Director's HUD off");
});

// ── The pointer moves the set a little ─────────────────────────────────────
if (!reduced && matchMedia('(pointer: fine)').matches) {
  addEventListener('pointermove', (e) => scene?.set({ px: (e.clientX / innerWidth) * 2 - 1, py: (e.clientY / innerHeight) * 2 - 1 }), { passive: true });
}

// ── The leader and the main title ──────────────────────────────────────────
const leaderOn = root.dataset.leader === 'on';
let leaderDone = !leaderOn;
let sceneSettled = false;
let titleLit = false;
/** Seven numbers, 190 ms each: the stylesheet runs the same count. */
const COUNT_MS = 7 * 190;

function startTitle(): void {
  if (titleLit) return;
  titleLit = true;
  if (titleAct) reveal(titleAct.el, 260);
  scene?.lights(true);
}
function endLeader(): void {
  if (leaderDone) return;
  leaderDone = true;
  root.dataset.leader = 'out';
  lenis?.start();
  window.setTimeout(() => {
    if (root.dataset.leader === 'out') delete root.dataset.leader;
  }, 820);
  window.setTimeout(startTitle, 150);
}
if (leaderOn) {
  lenis?.stop();
  for (const type of ['keydown', 'pointerdown', 'wheel', 'touchstart'] as const) addEventListener(type, endLeader, { once: true, passive: true });
  // The count started at first paint. Hold on the last number until the set is ready, but never for long.
  const check = () => {
    if (leaderDone) return;
    const t = performance.now();
    if (t >= COUNT_MS && (sceneSettled || t > 2400)) endLeader();
    else window.setTimeout(check, 50);
  };
  check();
} else {
  // Arriving through a sweep, the cover is still leaving: start the title as it goes.
  window.setTimeout(startTitle, root.dataset.sweep ? 360 : 80);
}

// ── The 3D set ─────────────────────────────────────────────────────────────
async function boot(): Promise<void> {
  // Probe on the canvas the scene will use: one context, created once.
  const caps = detectCapabilities(canvas);
  if (!caps.webgl || !canvas) {
    root.dataset.scene = 'still';
    sceneSettled = true;
    return;
  }
  try {
    const { createFilmScene } = await import('./scene');
    const set = await createFilmScene(canvas, {
      tier: caps.tier,
      reducedMotion: reduced,
      onContextLost: () => (root.dataset.scene = 'still'),
      onContextRestored: () => (root.dataset.scene = 'live'),
    });
    scene = set;
    set.set({ grade: acts[activeIdx]?.grade ?? (GRADE.title as string) });
    update(true);
    await set.ready;
    root.dataset.scene = 'live';
    if (titleLit) set.lights(true);
  } catch (err) {
    console.warn('3D set unavailable, showing the still frames.', err);
    root.dataset.scene = 'still';
  }
  sceneSettled = true;
}
// Under the leader the set boots behind the countdown, once its first frames are on screen; otherwise once
// the page is quiet.
if (leaderOn) requestAnimationFrame(() => requestAnimationFrame(() => window.setTimeout(() => void boot(), 40)));
else bootWhenQuiet(() => void boot());
