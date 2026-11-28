/** Hold the opaque frame until the latest destination has landed, even if the main thread is late. */
export function createFilmCut(el: HTMLElement, motionOff: boolean) {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let phase: 'idle' | 'covering' | 'leaving' = 'idle';
  let pending: (() => void) | undefined;
  let safety = 0;
  let warmTimer = 0;
  let ready = false;
  let played = false;

  function prime(): void {
    if (played || !ready || !el.hidden || document.hidden || preference.matches || motionOff) return;
    el.dataset.priming = '';
    el.hidden = false;
    // Decoding isn't rasterization. Give the compositor the textures before the first input,
    // then release the idle surface if the visitor stays to read.
    warmTimer = window.setTimeout(finish, 5000);
  }

  function prepare(): void {
    const template = el.querySelector('template');
    if (!template || motionOff || preference.matches) return;
    template.replaceWith(template.content);
    const plates = [...el.querySelectorAll('img'), document.querySelector<HTMLImageElement>('.backlot__night')];
    void Promise.all(plates.map((img) => img?.decode())).then(() => {
      ready = true;
      requestAnimationFrame(prime);
    }, () => {});
  }

  function land(): void {
    const action = pending;
    pending = undefined;
    action?.();
  }
  function finish(): void {
    clearTimeout(safety);
    clearTimeout(warmTimer);
    el.hidden = true;
    delete el.dataset.priming;
    delete el.dataset.running;
    delete el.dataset.releasing;
    phase = 'idle';
    land();
  }
  function cancel(): void {
    pending = undefined;
    finish();
  }
  el.addEventListener('animationend', (event) => {
    if (event.animationName === 'cut-density' && phase === 'covering') {
      phase = 'leaving';
      land();
      el.dataset.releasing = '';
    } else if (event.animationName === 'cut-clear' && phase === 'leaving') finish();
  });
  preference.addEventListener('change', () => preference.matches ? finish() : prepare());
  document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); });
  addEventListener('pagehide', cancel);
  const playLink = document.querySelector('a.btn[href="#interface"]');
  playLink?.addEventListener('pointerenter', prime, { once: true });
  playLink?.addEventListener('focus', prime, { once: true });
  prepare();

  return {
    cancel,
    play(action: () => void): void {
      if (motionOff || preference.matches || !ready || document.hidden || phase === 'leaving') {
        action();
        return;
      }
      pending = action;
      if (phase === 'covering') return;
      phase = 'covering';
      played = true;
      clearTimeout(warmTimer);
      delete el.dataset.priming;
      el.dataset.running = '';
      el.hidden = false;
      // Only a fail-open guard (e.g. an extension disabled animations); it never times a normal cut.
      safety = window.setTimeout(finish, 1800);
    },
  };
}
