/** What this browser and device can do. Decides between the live scene and the still image. */

export type Tier = 'high' | 'low';

export interface Capabilities {
  /** WebGL 2 is available and not switched off by the visitor or a test. */
  webgl: boolean;
  /** The visitor asked for less motion (system setting, or the site's own switch). */
  reducedMotion: boolean;
  tier: Tier;
  touch: boolean;
}

const SOFTWARE_RENDERER = /swiftshader|llvmpipe|software|basic render/i;

/**
 * Checks for WebGL 2 on the canvas the scene will use, so only one context is ever created.
 * Creating a throwaway context and losing it costs hundreds of milliseconds on a software renderer,
 * and that lands as a long task on page load.
 */
function probeWebGL(canvas?: HTMLCanvasElement | null): { ok: boolean; software: boolean } {
  try {
    const target = canvas ?? document.createElement('canvas');
    const gl = target.getContext('webgl2', { failIfMajorPerformanceCaveat: false });
    if (!gl) return { ok: false, software: false };
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
    return { ok: true, software: SOFTWARE_RENDERER.test(renderer) };
  } catch {
    return { ok: false, software: false };
  }
}

/**
 * Query-string overrides, for tests and for looking at the fallbacks on purpose:
 *   ?webgl=off   use the still image
 *   ?tier=low    force the cheaper rendering path
 *   ?motion=off  behave as if reduced motion were requested
 */
function prefersReduced(): boolean {
  return (
    matchMedia('(prefers-reduced-motion: reduce)').matches ||
    new URLSearchParams(location.search).get('motion') === 'off' ||
    document.documentElement.dataset.motion === 'off'
  );
}

export function detectCapabilities(canvas?: HTMLCanvasElement | null): Capabilities {
  const params = new URLSearchParams(location.search);
  // Switched off by the visitor or by a test: do not touch WebGL at all.
  if (params.get('webgl') === 'off') return { webgl: false, reducedMotion: prefersReduced(), tier: 'low', touch: matchMedia('(pointer: coarse)').matches };
  const probe = probeWebGL(canvas);
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 8;
  const touch = matchMedia('(pointer: coarse)').matches;
  const weak = probe.software || memory <= 4 || cores <= 4 || (touch && cores <= 6);
  const forcedTier = params.get('tier');

  return {
    webgl: probe.ok,
    reducedMotion: prefersReduced(),
    tier: forcedTier === 'low' || forcedTier === 'high' ? forcedTier : weak ? 'low' : 'high',
    touch,
  };
}

/** Calls back when the system reduced-motion setting changes. Returns an unsubscribe function. */
export function watchReducedMotion(cb: (reduced: boolean) => void): () => void {
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  const handler = () => cb(mq.matches);
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}
