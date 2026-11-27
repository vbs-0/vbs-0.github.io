import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { looksLikeAYear, parseContributionTotal, parseContributions } from '../../scripts/lib/contrib.mjs';

const fixture = readFileSync(fileURLToPath(new URL('../fixtures/contrib.html', import.meta.url)), 'utf8');

describe('parseContributions', () => {
  const days = parseContributions(fixture) as { date: string; count: number; level: number }[];
  it('reads every day cell, sorted by date', () => {
    expect(days.length).toBe(15);
    expect(days[0]?.date).toBe('2026-08-05');
    expect(days.at(-1)?.date).toBe('2026-08-19');
    expect([...days].sort((a, b) => a.date.localeCompare(b.date))).toEqual(days);
  });
  it('takes counts from the tooltips and levels from the cells', () => {
    const byDate = Object.fromEntries(days.map((d) => [d.date, d]));
    expect(byDate['2026-08-06']).toEqual({ date: '2026-08-06', count: 4, level: 1 });
    expect(byDate['2026-08-13']).toEqual({ date: '2026-08-13', count: 26, level: 3 });
    expect(byDate['2026-08-17']).toEqual({ date: '2026-08-17', count: 43, level: 4 });
    expect(byDate['2026-08-07']?.count).toBe(0);
  });
  it('returns nothing for empty or foreign input', () => {
    expect(parseContributions('')).toEqual([]);
    expect(parseContributions('<html><td>plain cell</td></html>')).toEqual([]);
    expect(parseContributions(undefined as unknown as string)).toEqual([]);
  });
  it('falls back to the level when a tooltip is missing', () => {
    const html = '<td data-date="2026-01-02" id="c-1" data-level="3"></td><td data-date="2026-01-01" id="c-0" data-level="0"></td>';
    expect(parseContributions(html)).toEqual([
      { date: '2026-01-01', count: 0, level: 0 },
      { date: '2026-01-02', count: 3, level: 3 },
    ]);
  });
  it('reads the yearly total from the heading', () => {
    expect(parseContributionTotal(fixture)).toBe(520);
    expect(parseContributionTotal('<h2>nothing</h2>')).toBeUndefined();
  });
});

describe('looksLikeAYear', () => {
  const year = Array.from({ length: 365 }, (_, i) => ({ date: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10), count: i % 3, level: 0 }));
  it('accepts a sorted year of days', () => expect(looksLikeAYear(year)).toBe(true));
  it('rejects short, unsorted or malformed calendars', () => {
    expect(looksLikeAYear(year.slice(0, 100))).toBe(false);
    expect(looksLikeAYear([...year].reverse())).toBe(false);
    expect(looksLikeAYear(year.map((d) => ({ ...d, count: -1 })))).toBe(false);
    expect(looksLikeAYear(null)).toBe(false);
  });
});
