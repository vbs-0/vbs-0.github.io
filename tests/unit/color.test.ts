import { describe, expect, it } from 'vitest';
import { contrast, hexToRgb, mix, oklch } from '@/lib/color';

describe('oklch', () => {
  it('maps the achromatic ends exactly', () => {
    expect(oklch(1, 0, 0)).toBe('#ffffff');
    expect(oklch(0, 0, 0)).toBe('#000000');
  });
  it('reduces chroma instead of clipping when a colour is out of gamut', () => {
    const hex = oklch(0.93, 0.4, 104);
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    const [r, g, b] = hexToRgb(hex);
    expect(r).toBeGreaterThan(200);
    expect(g).toBeGreaterThan(200);
    expect(b).toBeLessThan(120);
  });
  it('keeps hue for an in-gamut colour', () => {
    const [r, g, b] = hexToRgb(oklch(0.6, 0.15, 150));
    expect(g).toBeGreaterThan(r);
    expect(g).toBeGreaterThan(b);
  });
});

describe('contrast', () => {
  it('is 21 for black on white and 1 for identical colours', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 2);
    expect(contrast('#336699', '#336699')).toBeCloseTo(1, 5);
  });
  it('is symmetric and accepts short hex', () => {
    expect(contrast('#000', '#fff')).toBeCloseTo(contrast('#ffffff', '#000000'), 5);
  });
});

describe('mix', () => {
  it('returns the endpoints at 0 and 1', () => {
    expect(mix('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mix('#000000', '#ffffff', 1)).toBe('#ffffff');
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
  });
});
