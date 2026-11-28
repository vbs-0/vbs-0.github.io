import { bootWhenQuiet } from './boot';
import { initSweep } from './sweep';

export interface WorldScene {
  active(on: boolean): void;
  point(x: number, y: number): void;
  pulse(x: number, y: number): void;
}

export function mountWorld(loadScene: (canvas: HTMLCanvasElement) => Promise<WorldScene>): void {
  const root = document.documentElement;
  const curtain = document.querySelector<HTMLElement>('[data-world-curtain]');
  const stage = document.querySelector<HTMLElement>('[data-world-stage]');
  const canvas = stage?.querySelector('canvas');
  if (!curtain || !stage || !canvas) return;

  const surface = canvas;
  initSweep();
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const supportsMotion = () => !preference.matches && root.dataset.motion !== 'off';
  const allowWebgl = new URLSearchParams(location.search).get('webgl') !== 'off';
  const pause = document.querySelector<HTMLButtonElement>('[data-world-pause]');
  const action = document.querySelector<HTMLButtonElement>('[data-world-action]');
  const skip = curtain.querySelector<HTMLButtonElement>('[data-skip-intro]');
  let paused = false;
  let visible = false;
  let scene: WorldScene | undefined;
  let attempted = false;
  let coverEnd = 0;
  let pulseEnd = 0;
  let destination: { section: HTMLElement; hash: string } | undefined;
  root.dataset.scene = 'still';

  const active = () => visible && !paused && supportsMotion() && !root.dataset.worldPhase;
  function syncStage(): void {
    const running = active();
    scene?.active(running);
    if (!running || attempted || !allowWebgl) return;
    attempted = true;
    // Never compile the first frame in the same paint as the entrance or the cut.
    requestAnimationFrame(() => requestAnimationFrame(() => bootWhenQuiet(() => {
      if (!active()) {
        attempted = false;
        return;
      }
      void loadScene(surface).then((loaded) => {
        scene = loaded;
        scene.active(active());
      }).catch(() => { root.dataset.scene = 'still'; });
    })));
  }
  new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    syncStage();
  }, { threshold: 0.03 }).observe(stage);
  // The inline head's watchdog can also retire a cover if the entry module loads late.
  new MutationObserver(syncStage).observe(root, { attributes: true, attributeFilter: ['data-world-phase'] });

  function clearCover(): void {
    window.clearTimeout(coverEnd);
    delete root.dataset.worldPhase;
    syncStage();
  }

  function leaveCover(): void {
    window.clearTimeout(coverEnd);
    root.dataset.worldPhase = 'out';
    coverEnd = window.setTimeout(clearCover, 640);
  }

  function skipIntro(): void {
    if (root.dataset.worldPhase !== 'intro') return;
    if (document.activeElement === skip) document.querySelector<HTMLElement>('main')?.focus({ preventScroll: true });
    clearCover();
  }
  skip?.addEventListener('click', skipIntro);
  if (root.dataset.worldPhase === 'intro') {
    const readyAt = performance.now() + 630;
    const cap = new Promise<void>((resolve) => window.setTimeout(resolve, 750));
    void Promise.race([document.fonts.ready, cap]).then(() => {
      if (root.dataset.worldPhase !== 'intro') return;
      coverEnd = window.setTimeout(() => {
        if (root.dataset.worldPhase === 'intro') {
          if (document.activeElement === skip) document.querySelector<HTMLElement>('main')?.focus({ preventScroll: true });
          leaveCover();
        }
      }, Math.max(0, readyAt - performance.now()));
    });
    addEventListener('keydown', skipIntro);
  }

  function syncPreference(): void {
    const enabled = supportsMotion();
    root.toggleAttribute('data-world-paused', paused || !enabled);
    if (pause) {
      pause.hidden = !enabled;
      pause.setAttribute('aria-pressed', String(paused));
    }
    if (action) action.hidden = !enabled || paused;
    if ((!enabled || paused) && root.dataset.worldPhase) {
      land();
      clearCover();
    }
    syncStage();
  }
  pause?.addEventListener('click', () => {
    paused = !paused;
    syncPreference();
  });
  preference.addEventListener('change', syncPreference);
  syncPreference();

  function land(): void {
    if (!destination) return;
    const { section, hash } = destination;
    destination = undefined;
    if (hash !== location.hash) history.pushState(null, '', hash);
    section.scrollIntoView({ behavior: 'instant' });
    section.focus({ preventScroll: true });
  }

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element) || event.defaultPrevented || event.button !== 0 ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest<HTMLAnchorElement>('a[data-world-jump]');
    if (!link || paused || !supportsMotion() || root.dataset.worldPhase === 'out') return;
    const section = document.getElementById(link.hash.slice(1));
    if (!section) return;
    event.preventDefault();
    destination = { section, hash: link.hash };
    if (root.dataset.worldPhase === 'cover') return;
    clearCover();
    root.dataset.worldPhase = 'cover';
    syncStage();
    // Follow the actual moving panes, not a scroll timeout. The cap also covers a background tab.
    const animation = curtain.querySelector('.world-curtain__material');
    const ends = animation?.getAnimations({ subtree: true }).map((item) => item.finished) ?? [];
    const covered = () => {
      if (root.dataset.worldPhase !== 'cover') return;
      land();
      leaveCover();
    };
    coverEnd = window.setTimeout(covered, 560);
    if (ends.length > 0) void Promise.allSettled(ends).then(covered);
  });

  const coordinate = (event: PointerEvent) => {
    const rect = stage.getBoundingClientRect();
    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    return [clamp((event.clientX - rect.left) / rect.width), clamp((event.clientY - rect.top) / rect.height)] as const;
  };
  stage.addEventListener('pointermove', (event) => {
    if (scene && active() && event.pointerType !== 'touch') scene.point(...coordinate(event));
  }, { passive: true });
  stage.addEventListener('pointerleave', () => scene?.point(0.5, 0.5));
  action?.addEventListener('click', () => {
    scene?.pulse(0.5, 0.5);
    window.clearTimeout(pulseEnd);
    delete stage.dataset.pulse;
    requestAnimationFrame(() => {
      stage.dataset.pulse = 'on';
      pulseEnd = window.setTimeout(() => { delete stage.dataset.pulse; }, 1050);
    });
  });

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>('a[data-project-jump]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(link.hash.slice(1));
    if (target instanceof HTMLDetailsElement) target.open = true;
  });
}
