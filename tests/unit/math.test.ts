import { describe, expect, it } from 'vitest';
import { angleDelta, clamp01, damp, dampAngle, easeInOutCubic, easeOutExpo, lerp, remap, seededRandom, smoothstep } from '@/lib/three/math';

describe('math', () => {
  it('clamps and interpolates', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(lerp(10, 20, 0.25)).toBe(12.5);
  });
  it('smoothstep is 0 and 1 outside the edges and 0.5 in the middle', () => {
    expect(smoothstep(0, 1, -5)).toBe(0);
    expect(smoothstep(0, 1, 5)).toBe(1);
    expect(smoothstep(2, 4, 3)).toBeCloseTo(0.5, 6);
    expect(smoothstep(1, 1, 0)).toBe(0);
    expect(smoothstep(1, 1, 1)).toBe(1);
  });
  it('remap clamps to the output range', () => {
    expect(remap(5, 0, 10, 100, 200)).toBe(150);
    expect(remap(-5, 0, 10, 100, 200)).toBe(100);
    expect(remap(50, 0, 10, 100, 200)).toBe(200);
    expect(remap(1, 3, 3, 7, 9)).toBe(7);
  });
  it('damp converges without overshoot and does not move when dt is 0', () => {
    expect(damp(0, 10, 5, 0)).toBe(0);
    let v = 0;
    for (let i = 0; i < 600; i++) {
      const next = damp(v, 10, 5, 1 / 60);
      expect(next).toBeGreaterThanOrEqual(v);
      expect(next).toBeLessThanOrEqual(10);
      v = next;
    }
    expect(v).toBeCloseTo(10, 4);
  });
  it('takes the short way round a circle', () => {
    expect(angleDelta(0, Math.PI / 2)).toBeCloseTo(Math.PI / 2, 6);
    expect(angleDelta(0.1, Math.PI * 2 - 0.1)).toBeCloseTo(-0.2, 6);
    expect(dampAngle(0.1, Math.PI * 2 - 0.1, 1000, 1)).toBeCloseTo(-0.1, 4);
  });
  it('eases from 0 to 1', () => {
    for (const f of [easeOutExpo, easeInOutCubic]) {
      expect(f(0)).toBeCloseTo(0, 6);
      expect(f(1)).toBe(1);
      expect(f(0.5)).toBeGreaterThan(0);
      expect(f(0.5)).toBeLessThan(1);
    }
  });
  it('seeded random is repeatable and stays in [0, 1)', () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    const seq = Array.from({ length: 50 }, () => a());
    expect(Array.from({ length: 50 }, () => b())).toEqual(seq);
    for (const v of seq) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
    expect(new Set(seq).size).toBeGreaterThan(45);
  });
});
