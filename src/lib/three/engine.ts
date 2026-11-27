/**
 * One WebGL renderer per page, with the housekeeping every scene needs:
 * pixel-ratio clamp, resize, pausing when hidden, context loss, on-demand rendering and disposal.
 */
import { ACESFilmicToneMapping, NeutralToneMapping, NoToneMapping, SRGBColorSpace, WebGLRenderer, type ToneMapping } from 'three';

export interface EngineSize {
  /** CSS pixels */
  width: number;
  height: number;
  dpr: number;
}

export interface EngineOptions {
  alpha?: boolean;
  antialias?: boolean;
  /** Upper bound for devicePixelRatio. */
  maxDpr?: number;
  toneMapping?: 'neutral' | 'aces' | 'none';
  /** Called when the GPU context is lost, so the page can show its still image. */
  onContextLost?: () => void;
  onContextRestored?: () => void;
}

export type FrameCallback = (dt: number, elapsed: number) => void;

export interface Engine {
  readonly renderer: WebGLRenderer;
  readonly size: EngineSize;
  /** Registers a callback that runs before each rendered frame. */
  onFrame(cb: FrameCallback): void;
  onResize(cb: (size: EngineSize) => void): void;
  /** Render continuously (idle animation) or only when `invalidate` is called. */
  setContinuous(on: boolean): void;
  /** Ask for at least `frames` more frames. Cheap to call often. */
  invalidate(frames?: number): void;
  /** Frames rendered so far; used by tests and by the HWUI profile overlay. */
  readonly stats: { frames: number; lastFrameMs: number };
  dispose(): void;
}

const TONE: Record<NonNullable<EngineOptions['toneMapping']>, ToneMapping> = {
  neutral: NeutralToneMapping,
  aces: ACESFilmicToneMapping,
  none: NoToneMapping,
};

export function createEngine(canvas: HTMLCanvasElement, opts: EngineOptions = {}): Engine {
  const renderer = new WebGLRenderer({
    canvas,
    alpha: opts.alpha ?? true,
    antialias: opts.antialias ?? true,
    powerPreference: 'high-performance',
    stencil: false,
  });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = TONE[opts.toneMapping ?? 'neutral'];
  renderer.setClearColor(0x000000, 0);

  const size: EngineSize = { width: 1, height: 1, dpr: 1 };
  const frameCbs: FrameCallback[] = [];
  const resizeCbs: ((s: EngineSize) => void)[] = [];
  const stats = { frames: 0, lastFrameMs: 0 };

  let continuous = true;
  let pending = 2;
  let raf = 0;
  let last = 0;
  let elapsed = 0;
  let lost = false;
  let disposed = false;

  const measure = () => {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, opts.maxDpr ?? 2);
    if (width === size.width && height === size.height && dpr === size.dpr) return;
    size.width = width;
    size.height = height;
    size.dpr = dpr;
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    for (const cb of resizeCbs) cb(size);
    pending = Math.max(pending, 2);
  };

  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    if (lost || document.hidden) {
      last = now;
      return;
    }
    if (!continuous && pending <= 0) {
      last = now;
      return;
    }
    const dt = last === 0 ? 1 / 60 : Math.min(0.05, (now - last) / 1000);
    last = now;
    elapsed += dt;
    if (pending > 0) pending--;
    const t0 = performance.now();
    for (const cb of frameCbs) cb(dt, elapsed);
    stats.lastFrameMs = performance.now() - t0;
    stats.frames++;
  };

  const ro = new ResizeObserver(measure);
  ro.observe(canvas);
  const onWindowResize = () => measure();
  window.addEventListener('resize', onWindowResize, { passive: true });

  const onLost = (e: Event) => {
    e.preventDefault();
    lost = true;
    opts.onContextLost?.();
  };
  const onRestored = () => {
    lost = false;
    pending = 4;
    opts.onContextRestored?.();
  };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);

  measure();
  raf = requestAnimationFrame(tick);

  return {
    renderer,
    size,
    stats,
    onFrame(cb) {
      frameCbs.push(cb);
    },
    onResize(cb) {
      resizeCbs.push(cb);
      cb(size);
    },
    setContinuous(on) {
      continuous = on;
      if (on) pending = Math.max(pending, 1);
    },
    invalidate(frames = 2) {
      pending = Math.max(pending, frames);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', onWindowResize);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      renderer.dispose();
    },
  };
}
