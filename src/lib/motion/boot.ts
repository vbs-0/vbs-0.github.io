/**
 * Starts the 3D scene only once the page is quiet.
 * If the page arrived through a sweep, that means after the cover has left: the cover animates on the
 * compositor, but booting a WebGL scene on the main thread while it runs is how a transition starts to
 * stutter on a slow phone.
 */
export function bootWhenQuiet(start: () => void): void {
  const idle = () => {
    if ('requestIdleCallback' in window) requestIdleCallback(() => start(), { timeout: 1500 });
    else setTimeout(start, 200);
  };
  const root = document.documentElement;
  if (!root.dataset.sweep) {
    idle();
    return;
  }
  let tries = 0;
  const wait = () => {
    if (!root.dataset.sweep || tries++ > 40) {
      idle();
      return;
    }
    setTimeout(wait, 100);
  };
  setTimeout(wait, 150);
}
