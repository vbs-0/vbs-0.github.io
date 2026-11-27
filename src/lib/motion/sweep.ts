/**
 * The sweep between builds.
 *
 * Clicking a link to another build: seven bands slide in from the right, one after another, with three
 * accent blades crossing faster and a flash at the start. When the screen is covered the page navigates.
 * The next page paints already covered (its inline head script reads the flag), then the bands leave to
 * the left. Nothing fades; the world is wiped and replaced, like a scene change.
 *
 * The bands are server-rendered in every page (components/shared/Sweep.astro) but hidden and `contain:
 * strict` while idle, so they cost nothing. They are only animated on transform and opacity.
 * The destination page is prefetched on hover or focus, so the swap happens while the screen is covered.
 */
import type { VariantId } from '@site';

// The freshness window (8 s) lives in the inline head script in BaseHead, which reads the same key.
const FLAG = 'vbs-sweep';

import { type SweepSkin, SWEEP_SKINS } from './skins';

export { type SweepSkin, SWEEP_SKINS };

interface Flag {
  to: VariantId;
  at: number;
}

const root = document.documentElement;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || root.dataset.motion === 'off';

/** Reads a millisecond timing from the stylesheet, so CSS and the navigation timer never drift apart. */
function ms(name: string, fallback: number): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : fallback;
}

function clearFlag(): void {
  try {
    sessionStorage.removeItem(FLAG);
  } catch {
    /* nothing to clear */
  }
}

function skinElement(el: HTMLElement, skin: SweepSkin): void {
  el.style.setProperty('--sweep-paper', skin.paper);
  el.style.setProperty('--sweep-paper-alt', skin.paperAlt);
  el.style.setProperty('--sweep-ink', skin.ink);
  el.style.setProperty('--sweep-accent', skin.accent);
  el.style.setProperty('--sweep-font', skin.font);
  el.style.setProperty('--sweep-stretch', skin.stretch);
  el.style.setProperty('--sweep-case', skin.transform);
  const label = el.querySelector<HTMLElement>('.sweep__label');
  if (label) label.textContent = skin.label;
  const caption = el.querySelector<HTMLElement>('.sweep__caption');
  if (caption) caption.textContent = skin.caption;
}

/** Prefetch a page once, so the swap happens under the sweep instead of after it. */
function prefetch(href: string): void {
  if (document.querySelector(`link[rel="prefetch"][href="${CSS.escape(href)}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  link.as = 'document';
  document.head.append(link);
}

/**
 * Wires the sweep. Call once per page, after the DOM is ready.
 * @param onLeave called with the destination before navigating, for a last-moment state save.
 */
export function initSweep(onLeave?: (to: VariantId) => void): void {
  const sweep = document.querySelector<HTMLElement>('.sweep');

  // The entrance: this page painted already covered, so take the cover away.
  if (root.dataset.sweep === 'enter') {
    clearFlag();
    if (reduced() || !sweep) {
      delete root.dataset.sweep;
    } else {
      // No frame to wait for: the cover was painted before first paint, and the animation's first
      // frame is the covered state, so starting now cannot flash the page behind it.
      root.dataset.sweep = 'exit';
      const done = () => {
        delete root.dataset.sweep;
      };
      window.setTimeout(done, ms('--sweep-out', 300) + 6 * ms('--sweep-out-stagger', 16) + 80);
    }
  }

  // Back and forward: the browser may restore the page from its cache mid-sweep.
  addEventListener('pageshow', (event) => {
    if (event.persisted) delete root.dataset.sweep;
  });

  for (const link of document.querySelectorAll<HTMLAnchorElement>('a[data-sweep]')) {
    const to = link.dataset.sweep as VariantId;
    if (!(to in SWEEP_SKINS)) continue;
    const go = () => prefetch(link.href);
    link.addEventListener('pointerenter', go, { once: true, passive: true });
    link.addEventListener('focus', go, { once: true, passive: true });
  }

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[data-sweep]');
    if (!link) return;
    const to = link.dataset.sweep as VariantId;
    if (!(to in SWEEP_SKINS)) return;
    if (new URL(link.href).pathname === location.pathname) return;
    event.preventDefault();
    onLeave?.(to);
    if (reduced() || !sweep) {
      location.href = link.href;
      return;
    }
    skinElement(sweep, SWEEP_SKINS[to]);
    try {
      sessionStorage.setItem(FLAG, JSON.stringify({ to, at: Date.now() } satisfies Flag));
    } catch {
      /* the next page simply paints uncovered */
    }
    // The bands are already in the DOM and laid out, so the animation can start in this same tick:
    // waiting for animation frames here costs a slow device a second before anything moves.
    root.dataset.sweep = 'leave';
    let gone = false;
    const nav = () => {
      if (gone) return;
      gone = true;
      location.href = link.href;
    };
    // Navigate once the last band has landed: duration plus six stagger steps, plus a frame.
    window.setTimeout(nav, ms('--sweep-ms', 280) + 6 * ms('--sweep-stagger', 14) + 60);
  });
}
