/**
 * The theme flood: a disc in the new theme's colour grows out of the switch and covers the page, then the
 * theme flips underneath it and the disc is removed in the same frame, so nothing flashes.
 * One transform animation on one layer. With reduced motion the theme just changes.
 */
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'off';

/**
 * @param event the click, used for the disc's centre
 * @param color the new theme's page colour
 * @param apply switches the theme; called while the disc covers the page
 */
export function flood(event: Event, color: string, apply: () => void): void {
  const target = event.currentTarget instanceof Element ? event.currentTarget : null;
  if (reduced() || !target) {
    apply();
    return;
  }
  const rect = target.getBoundingClientRect();
  const disc = document.createElement('div');
  disc.className = 'flood';
  disc.setAttribute('aria-hidden', 'true');
  disc.style.background = color;
  disc.style.left = `${rect.left + rect.width / 2}px`;
  disc.style.top = `${rect.top + rect.height / 2}px`;
  document.body.append(disc);
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    apply();
    disc.remove();
  };
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      disc.classList.add('flood--grow');
      disc.style.transform = 'scale(1)';
    });
  });
  disc.addEventListener('transitionend', finish, { once: true });
  // A watchdog, in case the transition never fires (a hidden tab, a browser that skips it).
  window.setTimeout(finish, 900);
}
