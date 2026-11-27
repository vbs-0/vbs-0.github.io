import { describe, expect, it } from 'vitest';
import { blend, glyphs, playhead, timecode } from '@/variants/film/client/timeline';

describe('film timeline', () => {
  it('writes SMPTE-style timecode at 24 frames per second', () => {
    expect(timecode(0)).toBe('00:00:00:00');
    expect(timecode(1.5)).toBe('00:00:01:12');
    expect(timecode(61 + 23 / 24)).toBe('00:01:01:23');
    expect(timecode(3600)).toBe('01:00:00:00');
    expect(timecode(-4)).toBe('00:00:00:00');
  });

  it('places the playhead between scene centres', () => {
    const centers = [400, 1400, 2400];
    expect(playhead(centers, 0)).toBe(0);
    expect(playhead(centers, 400)).toBe(0);
    expect(playhead(centers, 900)).toBeCloseTo(0.5);
    expect(playhead(centers, 1400)).toBe(1);
    expect(playhead(centers, 2150)).toBeCloseTo(1.75);
    expect(playhead(centers, 9000)).toBe(2);
    expect(playhead([], 50)).toBe(0);
  });

  it('blends between neighbouring shots and clamps at both ends', () => {
    expect(blend(0, 7)).toEqual({ a: 0, b: 1, t: 0 });
    expect(blend(2.25, 7)).toEqual({ a: 2, b: 3, t: 0.25 });
    expect(blend(6, 7)).toEqual({ a: 5, b: 6, t: 1 });
    expect(blend(-3, 7)).toEqual({ a: 0, b: 1, t: 0 });
    expect(blend(40, 7)).toEqual({ a: 5, b: 6, t: 1 });
    expect(blend(3, 1)).toEqual({ a: 0, b: 0, t: 0 });
  });

  it('keeps every character of a measured value and rolls only the digits', () => {
    expect(glyphs('97.99%')).toEqual([{ digit: 9 }, { digit: 7 }, { char: '.' }, { digit: 9 }, { digit: 9 }, { char: '%' }]);
    expect(glyphs('~46 KB').map((g) => ('digit' in g ? String(g.digit) : g.char)).join('')).toBe('~46 KB');
    expect(glyphs('15/15').filter((g) => 'digit' in g)).toHaveLength(4);
  });
});
