import { createEngine, type Engine, type EngineSize } from './engine';
import type { WorldScene } from '@/lib/motion/world';

interface Direction {
  resize(size: EngineSize): void;
  draw(dt: number, elapsed: number): void;
  point(x: number, y: number): void;
  pulse(x: number, y: number): void;
}

export function mountStage(
  canvas: HTMLCanvasElement,
  build: (engine: Engine) => Direction,
  options: { maxDpr?: number; antialias?: boolean } = {},
): WorldScene {
  const root = document.documentElement;
  let active = false;
  let allowsIdle = true;
  let firstFrame = true;
  let resized = false;
  const engine = createEngine(canvas, {
    maxDpr: options.maxDpr ?? 1.35,
    antialias: options.antialias ?? false,
    onContextLost: () => { root.dataset.scene = 'still'; },
    onContextRestored: () => { firstFrame = true; resized = active; },
    onDegrade: (level) => { if (level === 'minimal') allowsIdle = false; },
  });
  let scene: Direction;
  try {
    scene = build(engine);
  } catch (error) {
    engine.dispose();
    throw error;
  }
  engine.setContinuous(false);
  engine.onResize((size) => {
    scene.resize(size);
    resized = !firstFrame;
  });
  engine.onFrame((dt, elapsed) => {
    if (!active && !resized) return;
    resized = false;
    scene.draw(active ? dt : 0, elapsed);
    if (firstFrame) {
      root.dataset.scene = 'live';
      firstFrame = false;
    }
  });
  return {
    active(on) {
      if (active === on) return;
      active = on;
      engine.setContinuous(on && allowsIdle);
      if (on) engine.invalidate();
    },
    point(x, y) {
      if (!active) return;
      scene.point(x, y);
      if (!allowsIdle) engine.invalidate(6);
    },
    pulse(x, y) {
      if (!active) return;
      scene.pulse(x, y);
      if (!allowsIdle) engine.invalidate(45);
    },
  };
}

export function colorsFor(canvas: HTMLCanvasElement): (token: string) => string {
  const style = getComputedStyle(canvas);
  return (token) => style.getPropertyValue(`--c-${token}`).trim();
}
