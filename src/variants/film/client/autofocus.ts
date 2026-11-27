/**
 * The cursor's autofocus brackets: four corners that hunt around the pointer and lock onto whatever can be
 * pressed, the way a camera's focus box does. The system cursor stays; this only frames the target.
 * Fine pointers only, and off with reduced motion.
 */
import { damp } from '@/lib/three/math';

export interface Autofocus {
  /** Re-aims at the locked target, after a scroll moved it. */
  refresh(): void;
}

const LOCKS = 'a, button, [data-af], .cameo';

export function initAutofocus(): Autofocus {
  const af = document.querySelector<HTMLElement>('.af');
  const off: Autofocus = { refresh() {} };
  if (!af || !matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return off;
  const corners = [...af.children] as HTMLElement[];
  const S = 11;
  const box = { x: -80, y: -80, w: 22, h: 22 };
  const goal = { ...box };
  let locked: Element | null = null;
  let px = -80;
  let py = -80;
  let raf = 0;
  let last = 0;

  const aim = () => {
    if (locked?.isConnected) {
      const r = locked.getBoundingClientRect();
      goal.x = r.left - 6;
      goal.y = r.top - 6;
      goal.w = r.width + 12;
      goal.h = r.height + 12;
    } else {
      goal.x = px - 11;
      goal.y = py - 11;
      goal.w = 22;
      goal.h = 22;
    }
  };
  const draw = (now: number) => {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const k = locked ? 17 : 24;
    box.x = damp(box.x, goal.x, k, dt);
    box.y = damp(box.y, goal.y, k, dt);
    box.w = damp(box.w, goal.w, k, dt);
    box.h = damp(box.h, goal.h, k, dt);
    const [a, b, c, d] = corners;
    if (a) a.style.transform = `translate3d(${box.x}px, ${box.y}px, 0)`;
    if (b) b.style.transform = `translate3d(${box.x + box.w - S}px, ${box.y}px, 0)`;
    if (c) c.style.transform = `translate3d(${box.x}px, ${box.y + box.h - S}px, 0)`;
    if (d) d.style.transform = `translate3d(${box.x + box.w - S}px, ${box.y + box.h - S}px, 0)`;
    const rest = Math.abs(box.x - goal.x) + Math.abs(box.y - goal.y) + Math.abs(box.w - goal.w) + Math.abs(box.h - goal.h);
    if (rest < 0.3) {
      raf = 0;
      last = 0;
    } else raf = requestAnimationFrame(draw);
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(draw);
  };

  addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      px = e.clientX;
      py = e.clientY;
      locked = (e.target as Element | null)?.closest(LOCKS) ?? null;
      aim();
      if (box.x < -40) Object.assign(box, goal);
      af.style.opacity = '1';
      kick();
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => (af.style.opacity = '0'));
  document.documentElement.addEventListener('pointerenter', () => (af.style.opacity = '1'));
  return {
    refresh() {
      if (!locked) return;
      aim();
      kick();
    },
  };
}
