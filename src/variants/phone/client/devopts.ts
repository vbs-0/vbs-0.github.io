/**
 * Build number and Developer options, as on Android: seven taps unlock a group of switches.
 * Each switch does what its name says to this page.
 */
import type { PhoneScene } from './scene';
import { toast } from './toast';

const KEY = 'vbs-dev';
const root = document.documentElement;

export function initDevOptions(getScene: () => PhoneScene | undefined): { frame(): void } {
  const section = document.querySelector<HTMLElement>('[data-developer]');
  const build = document.querySelector<HTMLButtonElement>('[data-build-number]');
  const hwui = document.querySelector<HTMLCanvasElement>('[data-hwui]');
  const inputs = [...document.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-dev]')];
  const stored = (): boolean => {
    try {
      return localStorage.getItem(KEY) === '1';
    } catch {
      return false;
    }
  };
  const store = (on: boolean) => {
    try {
      if (on) localStorage.setItem(KEY, '1');
      else localStorage.removeItem(KEY);
    } catch {
      /* unlocked for this visit only */
    }
  };

  let unlocked = stored();
  let taps = 0;
  let tapTimer = 0;
  if (section) section.hidden = !unlocked;

  build?.addEventListener('click', () => {
    if (unlocked) {
      toast('No need, you are already a developer.');
      return;
    }
    taps++;
    window.clearTimeout(tapTimer);
    tapTimer = window.setTimeout(() => (taps = 0), 6000);
    const left = 7 - taps;
    if (left <= 0) {
      unlocked = true;
      store(true);
      if (section) {
        section.hidden = false;
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      toast('You are now a developer!');
    } else if (left <= 3) {
      toast(`You are now ${left} ${left === 1 ? 'step' : 'steps'} away from being a developer.`, 4000);
    }
  });

  // Profile HWUI rendering: frame times as bars with the 16 ms line.
  const samples: number[] = [];
  let profiling = false;
  function drawProfile(): void {
    if (!profiling || !hwui) return;
    const scene = getScene();
    samples.push(scene ? scene.frameMs() : 0);
    if (samples.length > 110) samples.shift();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = hwui.clientWidth * dpr;
    const h = hwui.clientHeight * dpr;
    if (hwui.width !== w || hwui.height !== h) {
      hwui.width = w;
      hwui.height = h;
    }
    const ctx = hwui.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    const scale = (h * 0.6) / 16;
    const bar = w / 110;
    samples.forEach((ms, i) => {
      ctx.fillStyle = ms > 16 ? '#e5484d' : '#3d9bf0';
      ctx.fillRect(i * bar, h - Math.min(h, ms * scale), Math.max(1, bar - 1), Math.min(h, ms * scale));
    });
    ctx.fillStyle = '#2fbf71';
    ctx.fillRect(0, h - 16 * scale, w, Math.max(1, dpr));
  }

  function apply(input: HTMLInputElement | HTMLSelectElement): void {
    const scene = getScene();
    const on = input instanceof HTMLInputElement ? input.checked : false;
    switch (input.dataset.dev) {
      case 'bounds':
        if (on) root.dataset.bounds = '';
        else delete root.dataset.bounds;
        scene?.setBounds(on);
        break;
      case 'overdraw':
      case 'hwui':
        if (on && !scene) {
          (input as HTMLInputElement).checked = false;
          toast('This one needs the live 3D phone, which is not running here.');
          return;
        }
        if (input.dataset.dev === 'overdraw') scene?.setOverdraw(on);
        else {
          profiling = on;
          samples.length = 0;
          if (hwui) hwui.hidden = !on;
        }
        break;
      case 'rtl':
        root.dir = on ? 'rtl' : 'ltr';
        break;
      case 'motion': {
        const scale = Number(input.value);
        root.style.setProperty('--motion', String(scale));
        if (scale === 0) root.dataset.motion = 'off';
        else delete root.dataset.motion;
        try {
          if (scale === 0) localStorage.setItem('vbs-motion', 'off');
          else localStorage.removeItem('vbs-motion');
        } catch {
          /* applies to this visit only */
        }
        scene?.setMotionScale(scale);
        break;
      }
    }
  }
  for (const input of inputs) input.addEventListener('change', () => apply(input));

  document.querySelector('[data-dev-reset]')?.addEventListener('click', () => {
    for (const input of inputs) {
      if (input instanceof HTMLInputElement) input.checked = false;
      else input.value = '1';
      apply(input);
    }
    unlocked = false;
    taps = 0;
    store(false);
    if (section) section.hidden = true;
    build?.focus();
    toast('Developer options are off.');
  });

  return { frame: drawProfile };
}
