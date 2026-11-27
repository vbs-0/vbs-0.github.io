/**
 * Scroll reveals: one observer for the whole page, transform and opacity only.
 * Elements are hidden by CSS only when JavaScript is running, so nothing is ever lost without it.
 */
export function initReveal(selector = '[data-reveal]'): void {
  const items = [...document.querySelectorAll<HTMLElement>(selector)];
  if (items.length === 0) return;
  // Only now may the CSS hide them: if this module never runs, nothing is hidden.
  document.documentElement.classList.add('reveal-ready');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'off';
  if (reduced || !('IntersectionObserver' in window)) {
    for (const el of items) el.classList.add('is-in');
    return;
  }
  const show = (el: HTMLElement) => el.classList.add('is-in');
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        show(entry.target as HTMLElement);
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
  );
  for (const el of items) {
    const box = el.getBoundingClientRect();
    // Anything already on screen when the page loads appears at once, with no animation.
    if (box.top < innerHeight * 0.9 && box.bottom > 0) show(el);
    else observer.observe(el);
  }
}
