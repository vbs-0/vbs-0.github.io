/** A project page in the Film build: grain, smooth wheel, the hero's entrance, counters and graded shots. */
import Lenis from 'lenis';
import { bootFx } from '@/lib/motion/fx';
import { initSweep } from '@/lib/motion/sweep';
import { initAutofocus } from './autofocus';
import { filmGrain } from './grain';
import { type Odometer, odometer } from './odometer';

initSweep();
const root = document.documentElement;
root.classList.add('film-ready');
// No live set on these pages: the shots are the picture.
root.dataset.scene = 'still';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

filmGrain();
bootFx();
initAutofocus();
if (!reduced) new Lenis({ autoRaf: true, lerp: 0.1, smoothWheel: true, syncTouch: false });

const hero = document.querySelector<HTMLElement>('.work__hero');
if (hero) {
  hero.querySelectorAll<HTMLElement>('.rise').forEach((el, i) => (el.style.transitionDelay = `${180 + i * 90}ms`));
  requestAnimationFrame(() => hero.classList.add('is-on'));
}

// Counters roll, and shots come out of the grade, as they reach the middle of the screen.
const watch = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      watch.unobserve(entry.target);
      const el = entry.target as HTMLElement & { odo?: Odometer | null };
      if (el.odo) el.odo.roll();
      else el.classList.add('is-focus');
    }
  },
  { rootMargin: '-15% 0px -15% 0px' },
);
for (const el of document.querySelectorAll<HTMLElement>('[data-odo]')) {
  (el as HTMLElement & { odo?: Odometer | null }).odo = odometer(el, reduced);
  watch.observe(el);
}
for (const fig of document.querySelectorAll<HTMLElement>('.work__shots figure, .work__lead')) watch.observe(fig);
