import { describe, expect, it } from 'vitest';
import { VARIANTS } from '@site';
import { contrast } from '@/lib/color';
import { contrastPairs, cssVars, palettes, themeCss } from '@/styles/palettes';

describe('palettes', () => {
  for (const variant of VARIANTS) {
    for (const theme of ['light', 'dark'] as const) {
      const p = palettes[variant][theme];
      it(`${variant}/${theme}: every colour is a 6-digit hex`, () => {
        for (const [k, v] of Object.entries(p)) expect(v, k).toMatch(/^#[0-9a-f]{6}$/);
      });
      for (const [fg, bg, min] of contrastPairs[variant]) {
        it(`${variant}/${theme}: ${fg} on ${bg} is at least ${min}:1`, () => {
          const a = p[fg];
          const b = p[bg];
          expect(a, fg).toBeDefined();
          expect(b, bg).toBeDefined();
          expect(contrast(a as string, b as string)).toBeGreaterThanOrEqual(min);
        });
      }
    }
  }
  it('emits kebab-case custom properties', () => {
    expect(cssVars({ textMuted: '#111111', bg: '#ffffff' })).toBe('--c-text-muted:#111111;--c-bg:#ffffff');
  });
  it('emits one rule for a single-theme build and three for a two-theme build', () => {
    expect(themeCss('classic').match(/\{/g)?.length).toBe(1);
    expect(themeCss('phone')).toContain('prefers-color-scheme:dark');
    expect(themeCss('phone')).toContain('[data-theme="dark"]');
  });
});
