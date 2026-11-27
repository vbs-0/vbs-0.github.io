/**
 * fx — the small motion pieces award sites are built from, hand-rolled and cheap:
 * masked split-text reveals, magnetic elements, counters, scroll-lit words,
 * a cursor-follow floating preview, and a rotating type ring.
 * Everything animates transform or opacity, scans the DOM once by attribute,
 * re-scans after in-page swaps, and switches fully off under reduced motion.
 */

const reduce = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = () => typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches;

/* ------------------------------------------------------------------ split */
/** Wrap each word of an element in a mask with an inner span, so the words can rise in one by one. */
function splitWords(el: HTMLElement): HTMLElement[] {
  const text = el.textContent ?? '';
  el.textContent = '';
  // A visually-hidden copy carries the full text to screen readers: the masks are aria-hidden,
  // and aria-label is not allowed on non-semantic elements such as paragraphs.
  const sr = document.createElement('span');
  sr.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap';
  sr.textContent = text.trim();
  const inner: HTMLElement[] = [];
  const frag = document.createDocumentFragment();
  frag.append(sr);
  for (const word of text.split(/(\s+)/)) {
    if (!word) continue;
    if (/^\s+$/.test(word)) {
      frag.append(document.createTextNode(' '));
      continue;
    }
    const mask = document.createElement('span');
    mask.className = 'fx-mask';
    mask.setAttribute('aria-hidden', 'true');
    const w = document.createElement('span');
    w.className = 'fx-word';
    w.textContent = word;
    mask.append(w);
    inner.push(w);
    frag.append(mask);
  }
  el.append(frag);
  return inner;
}

function initSplit(el: HTMLElement) {
  const words = splitWords(el);
  if (reduce()) return;
  el.classList.add('fx-split');
  words.forEach((w, i) => (w.style.transitionDelay = `${i * 45}ms`));
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          el.classList.add('fx-in');
          io.disconnect();
        }
      }
    },
    { threshold: 0.2 },
  );
  io.observe(el);
}

/* --------------------------------------------------------------- magnetic */
function initMagnetic(el: HTMLElement) {
  if (!fine() || reduce()) return;
  const strength = Number(el.dataset.magnetic) || 0.35;
  let raf = 0;
  let mx = 0;
  let my = 0;
  const apply = () => {
    raf = 0;
    el.style.transform = `translate(${mx * strength}px, ${my * strength}px)`;
  };
  el.classList.add('fx-magnet');
  el.addEventListener('pointerenter', () => el.classList.add('fx-magnet--live'));
  el.addEventListener('pointermove', (ev) => {
    const r = el.getBoundingClientRect();
    mx = ev.clientX - (r.left + r.width / 2);
    my = ev.clientY - (r.top + r.height / 2);
    if (!raf) raf = requestAnimationFrame(apply);
  });
  el.addEventListener('pointerleave', () => {
    el.classList.remove('fx-magnet--live');
    el.style.transform = '';
  });
}

/* ---------------------------------------------------------------- count */
/** Count the first integer in the element up from zero when it enters view. */
function initCount(el: HTMLElement) {
  const m = (el.textContent ?? '').match(/\d[\d,]*/);
  if (!m || m.index === undefined) return;
  const target = parseInt(m[0].replace(/,/g, ''), 10);
  if (!target || reduce()) return;
  const full = el.textContent ?? '';
  const render = (n: number) => {
    el.textContent = full.slice(0, m.index) + n.toLocaleString('en-US') + full.slice(m.index! + m[0].length);
  };
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.disconnect();
        render(0);
        el.classList.add('fx-counting');
        const t0 = performance.now();
        const dur = 900;
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          render(Math.round(target * eased));
          if (p < 1) requestAnimationFrame(tick);
          else el.classList.remove('fx-counting');
        };
        requestAnimationFrame(tick);
      }
    },
    { threshold: 0.6 },
  );
  io.observe(el);
}

/* ----------------------------------------------------------------- scrub */
/** Words of a paragraph light up one after another as the element crosses the viewport. */
function initScrub(el: HTMLElement) {
  const words = splitWords(el);
  if (reduce()) return;
  el.classList.add('fx-scrub');
  const n = words.length;
  let raf = 0;
  const update = () => {
    raf = 0;
    const r = el.getBoundingClientRect();
    const vh = innerHeight;
    // starts lighting as the top crosses the lower fifth of the viewport, fully lit by its middle
    const p = Math.min(1, Math.max(0, (vh * 0.9 - r.top) / (vh * 0.45)));
    const lit = Math.floor(p * (n + 2));
    words.forEach((w, i) => w.classList.toggle('fx-lit', i < lit));
  };
  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(update);
  };
  addEventListener('scroll', onScroll, { passive: true });
  update();
}

/* -------------------------------------------------------------- preview */
/** A screenshot that floats next to the cursor while hovering rows marked data-shot. */
let previewEl: HTMLImageElement | null = null;
function preview(): HTMLImageElement {
  if (!previewEl) {
    previewEl = document.createElement('img');
    previewEl.className = 'fx-preview';
    previewEl.alt = '';
    previewEl.setAttribute('aria-hidden', 'true');
    document.body.append(previewEl);
  }
  return previewEl;
}
function initPreview(el: HTMLElement) {
  if (!fine() || reduce()) return;
  const src = el.dataset.shot;
  if (!src) return;
  let raf = 0;
  let x = 0;
  let y = 0;
  const img = preview();
  const apply = () => {
    raf = 0;
    img.style.transform = `translate(${x + 22}px, ${y - 120}px)`;
  };
  el.addEventListener('pointerenter', () => {
    if (img.src !== src) img.src = src;
    img.classList.add('fx-preview--on');
  });
  el.addEventListener('pointermove', (ev) => {
    x = ev.clientX;
    y = ev.clientY;
    if (!raf) raf = requestAnimationFrame(apply);
  });
  el.addEventListener('pointerleave', () => img.classList.remove('fx-preview--on'));
}

/* ------------------------------------------------------------------ ring */
/** Even the circular type out along its path: SVG font metrics are unreliable enough
    that a fixed string either gaps or clips, so measure both and adjust the tracking. */
function initRing(textPath: SVGTextPathElement) {
  const fit = () => {
    const href = textPath.getAttribute('href') ?? '';
    const path = document.querySelector<SVGPathElement>(href);
    if (!path) return;
    // Measure the natural length first: reset any earlier correction so repeated fits stay idempotent.
    textPath.style.letterSpacing = '';
    const total = path.getTotalLength();
    const len = textPath.getComputedTextLength();
    const chars = (textPath.textContent ?? '').length;
    if (!chars || !len) return;
    const base = parseFloat(getComputedStyle(textPath).letterSpacing) || 0;
    textPath.style.letterSpacing = `${base + (total - len) / chars}px`;
  };
  if (document.fonts?.ready) void document.fonts.ready.then(fit);
  fit();
}

/* ------------------------------------------------------------------ scan */
function scan(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-split]:not([data-fx])').forEach((el) => {
    el.dataset.fx = 'split';
    initSplit(el);
  });
  root.querySelectorAll<HTMLElement>('.btn:not([data-fx]), [data-magnetic]:not([data-fx])').forEach((el) => {
    el.dataset.fx = 'magnetic';
    initMagnetic(el);
  });
  root.querySelectorAll<HTMLElement>('[data-countup]:not([data-fx])').forEach((el) => {
    el.dataset.fx = 'count';
    initCount(el);
  });
  root.querySelectorAll<HTMLElement>('[data-scrub]:not([data-fx])').forEach((el) => {
    el.dataset.fx = 'scrub';
    initScrub(el);
  });
  root.querySelectorAll<HTMLElement>('[data-shot]:not([data-fx])').forEach((el) => {
    el.dataset.fx = 'shot';
    initPreview(el);
  });
  root.querySelectorAll<SVGTextPathElement>('.ring textPath:not([data-fx])').forEach((el) => {
    el.dataset.fx = 'ring';
    initRing(el);
  });
}

export function bootFx() {
  scan();
  // in-page swaps (the phone's app pages) bring fresh DOM; expose a rescan hook
  (window as unknown as { __fxscan?: () => void }).__fxscan = () => scan();
  document.addEventListener('astro:after-swap', () => scan());
}
