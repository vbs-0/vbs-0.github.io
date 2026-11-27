/**
 * The rolling counter: each digit of a measured value becomes a reel of 0 to 9 that turns to its value.
 * The real value is on screen until the roll starts, so a counter that never rolls still reads true,
 * and screen readers get the value as plain text.
 */
import { glyphs } from './timeline';

export interface Odometer {
  roll(): void;
}

export function odometer(el: HTMLElement, reduced: boolean): Odometer | null {
  const value = (el.textContent ?? '').trim();
  const parts = glyphs(value);
  if (!parts.some((g) => 'digit' in g)) return null;
  const sr = document.createElement('span');
  sr.className = 'odo__sr';
  sr.textContent = value;
  const face = document.createElement('span');
  face.className = 'odo__face';
  face.setAttribute('aria-hidden', 'true');
  const cols: { col: HTMLElement; digit: number }[] = [];
  for (const g of parts) {
    if ('digit' in g) {
      const window_ = document.createElement('span');
      window_.className = 'odo__d';
      const col = document.createElement('span');
      col.className = 'odo__col';
      for (let k = 0; k < 20; k++) {
        const n = document.createElement('span');
        n.textContent = String(k % 10);
        col.append(n);
      }
      col.style.transition = 'none';
      col.style.transform = `translate3d(0, ${-g.digit}em, 0)`;
      window_.append(col);
      face.append(window_);
      cols.push({ col, digit: g.digit });
    } else {
      const c = document.createElement('span');
      c.className = 'odo__c';
      c.textContent = g.char === ' ' ? '\u00a0' : g.char;
      face.append(c);
    }
  }
  el.classList.add('odo');
  el.textContent = '';
  el.append(sr, face);

  let rolled = false;
  return {
    roll() {
      if (rolled || reduced) return;
      rolled = true;
      for (const { col } of cols) col.style.transform = 'translate3d(0, 0, 0)';
      // Two frames: the zero position must be applied before the transition to the value starts.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          cols.forEach(({ col, digit }, i) => {
            col.style.transition = '';
            col.style.transitionDelay = `${i * 80}ms`;
            col.style.transform = `translate3d(0, ${-(10 + digit)}em, 0)`;
          });
        }),
      );
    },
  };
}
