/** Small numeric helpers shared by the scenes. Pure functions, unit-tested. */

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const clamp01 = (v: number) => clamp(v, 0, 1);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** 0 below `lo`, 1 above `hi`, smooth in between. */
export function smoothstep(lo: number, hi: number, v: number): number {
  if (lo === hi) return v < lo ? 0 : 1;
  const t = clamp01((v - lo) / (hi - lo));
  return t * t * (3 - 2 * t);
}

/** Maps v from [inLo, inHi] to [outLo, outHi], clamped. */
export function remap(v: number, inLo: number, inHi: number, outLo: number, outHi: number): number {
  if (inLo === inHi) return outLo;
  return lerp(outLo, outHi, clamp01((v - inLo) / (inHi - inLo)));
}

/**
 * Frame-rate independent smoothing: moves `current` towards `target`.
 * `lambda` is the speed (higher is snappier), `dt` the frame time in seconds.
 */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

/** Shortest signed difference between two angles in radians, in (-PI, PI]. */
export function angleDelta(from: number, to: number): number {
  const d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) return d - Math.PI * 2;
  if (d <= -Math.PI) return d + Math.PI * 2;
  return d;
}

export function dampAngle(current: number, target: number, lambda: number, dt: number): number {
  return current + angleDelta(current, target) * (1 - Math.exp(-lambda * dt));
}

export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * clamp01(t)));
export const easeInOutCubic = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
};

export const degToRad = (deg: number) => (deg * Math.PI) / 180;

/** Deterministic pseudo-random generator (mulberry32), so procedural detail is identical on every load. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
