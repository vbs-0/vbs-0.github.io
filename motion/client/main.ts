import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { worldIds, worlds, type World } from '../worlds';
import type { MaterialScene } from './material';

const root = document.documentElement;
const world = root.dataset.world as World;
const stage = document.querySelector<HTMLElement>('[data-stage]')!;
const canvas = stage.querySelector('canvas')!;
const pause = document.querySelector<HTMLInputElement>('[data-pause]')!;
const transit = document.querySelector<HTMLElement>('[data-transit]')!;
const transitName = document.querySelector<HTMLElement>('[data-transit-name]')!;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const webglOff = new URLSearchParams(location.search).get('webgl') === 'off';
const session = {
  write(key: string, value: string) { try { sessionStorage.setItem(key, value); } catch { /* Optional. */ } },
};

let inView = false;
let firstPaint = false;
let triedWebGL = false;
let material: MaterialScene | undefined;
let scrollMotion: gsap.Context | undefined;
let cut: gsap.core.Timeline | undefined;
let next: URL | undefined;
let release = 0;
const moving = () => !reduced.matches && !root.hasAttribute('data-paused');

gsap.registerPlugin(ScrollTrigger);

function resetTransit() {
  cut?.kill();
  cut = undefined;
  window.clearTimeout(release);
  next = undefined;
  delete root.dataset.arrival;
  delete transit.dataset.color;
  transit.hidden = true;
  gsap.set([...transit.querySelectorAll('svg'), transitName], { clearProps: 'transform,opacity' });
}

function showTransit(id: World) {
  transit.dataset.color = id;
  transitName.textContent = worlds[id].name;
  transit.hidden = false;
  return transit.querySelector<SVGElement>(`[data-sheet="${id}"]`)!;
}

const directions: Record<World, [xPercent: number, yPercent: number]> = { flow: [0, -105], tide: [0, 106], kiln: [-110, 37] };

if (root.dataset.arrival) {
  const sheet = showTransit(world);
  const [x, y] = directions[world];
  cut = gsap.timeline({
    onComplete() {
      resetTransit();
      if (document.activeElement === document.body && !location.hash) document.getElementById('page-title')?.focus({ preventScroll: true });
    },
  })
    .to(transitName, { y: y > 0 ? -42 : 42, opacity: 0, duration: .31, ease: 'power2.in' }, .075)
    .to(sheet, { xPercent: -x, yPercent: -y, duration: .69, ease: 'power3.inOut' }, 0);
}

document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element) || event.defaultPrevented || event.button !== 0 ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !moving()) return;
  const link = event.target.closest<HTMLAnchorElement>('a[data-to-world]');
  if (!link) return;
  const id = link.dataset.toWorld as World;
  if (!worldIds.includes(id) || id === world) return;
  const url = new URL(link.href);
  if (url.origin !== location.origin) return;
  event.preventDefault();
  if (next) {
    next = url;
    transitName.textContent = worlds[id].name;
    return;
  }
  resetTransit();
  next = url;
  const sheet = showTransit(id);
  const [x, y] = directions[id];
  cut = gsap.timeline({ onComplete() {
    if (!next) return;
    session.write('vbs-motion-arrival', next.pathname);
    location.assign(next.href);
  } })
    .fromTo(sheet, { xPercent: x, yPercent: y }, { xPercent: 0, yPercent: 0, duration: .48, ease: 'power3.inOut' }, 0)
    .fromTo(transitName, { y: y > 0 ? 32 : -32, opacity: 0 }, { y: 0, opacity: 1, duration: .25, ease: 'power2.out' }, .25);
  release = window.setTimeout(resetTransit, 2200);
});

function updateMotion() {
  const enabled = moving() && !document.hidden;
  const active = enabled && inView;
  stage.toggleAttribute('data-out-of-view', !inView || document.hidden);
  material?.setActive(active);
  if (firstPaint && active && !webglOff && !triedWebGL) {
    triedWebGL = true;
    // The animated vector art is already moving before the GPU compile begins.
    void import('./material').then(({ mountMaterial }) => {
      material = mountMaterial(canvas, world, (live) => { stage.dataset.render = live ? 'webgl' : 'css'; });
      material.setActive(moving() && inView && !document.hidden);
    }).catch(() => { stage.dataset.render = 'css'; });
  }
}

function updateControls() {
  if (!moving()) {
    if (next) location.assign(next.href);
    resetTransit();
    scrollMotion?.revert();
    scrollMotion = undefined;
  } else if (!scrollMotion) {
    scrollMotion = gsap.context(() => {
      for (const image of document.querySelectorAll<HTMLImageElement>('[data-project-image]')) {
        gsap.fromTo(image, { yPercent: 3.2, scale: 1.015 }, {
          yPercent: -3.2, scale: 1.015, ease: 'none',
          scrollTrigger: { trigger: image.parentElement, start: 'top bottom', end: 'bottom top', scrub: .3 },
        });
      }
    });
  }
  updateMotion();
}

pause.checked = root.hasAttribute('data-paused') || pause.checked;
root.toggleAttribute('data-paused', pause.checked);
pause.addEventListener('change', () => {
  root.toggleAttribute('data-paused', pause.checked);
  session.write('vbs-motion-paused', String(pause.checked));
  updateControls();
});
reduced.addEventListener('change', updateControls);
new IntersectionObserver(([entry]) => {
  inView = !!entry?.isIntersecting;
  updateMotion();
}, { threshold: .01 }).observe(stage);
document.addEventListener('visibilitychange', updateMotion);
window.addEventListener('pageshow', (event) => { if (event.persisted) resetTransit(); });
stage.addEventListener('pointermove', (event) => {
  if (!material || event.pointerType === 'touch') return;
  const area = stage.getBoundingClientRect();
  material.point((event.clientX - area.left) / area.width, (event.clientY - area.top) / area.height);
}, { passive: true });
stage.addEventListener('pointerleave', () => material?.point(.5, .5), { passive: true });
requestAnimationFrame(() => window.setTimeout(() => {
  firstPaint = true;
  updateMotion();
}, 1060));
updateControls();
