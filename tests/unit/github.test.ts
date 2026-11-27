import { describe, expect, it } from 'vitest';
import { projects } from '@/content';
import { contribMonths, contribStats, contribWeeks, github, languagePresence, projectDates, projectLanguages, repoByName } from '@/lib/github';

describe('github snapshot', () => {
  it('holds about a year of sorted days whose counts add up to the total', () => {
    const { days, total } = github.contributions;
    expect(days.length).toBeGreaterThanOrEqual(300);
    for (let i = 1; i < days.length; i++) expect((days[i]?.date ?? '') > (days[i - 1]?.date ?? '')).toBe(true);
    expect(days.reduce((s, d) => s + d.count, 0)).toBe(total);
  });
  it('contains every repository a project points at', () => {
    for (const p of projects) for (const full of p.repos) expect(repoByName(full), `${p.id}: ${full}`).toBeDefined();
  });
  it('gives each project dates and languages', () => {
    for (const p of projects) {
      const d = projectDates(p);
      expect(d, p.id).toBeDefined();
      expect((d?.created ?? '') <= (d?.pushed ?? '')).toBe(true);
    }
    const langs = projectLanguages({ repos: ['vbs-0/clipbridge'] }).map((l) => l.name);
    expect(langs).toEqual(expect.arrayContaining(['Rust', 'Kotlin']));
    expect(projectLanguages({ repos: ['nobody/nothing'] })).toEqual([]);
  });
  it('counts languages by repository, most common first, forks excluded', () => {
    const list = languagePresence();
    expect(list[0]?.name).toBe('Python');
    for (let i = 1; i < list.length; i++) expect((list[i]?.repos ?? 0) <= (list[i - 1]?.repos ?? 0)).toBe(true);
    expect(list.map((l) => l.name)).toEqual(expect.arrayContaining(['Rust', 'Kotlin', 'TypeScript']));
  });
  it('lays the calendar out as full weeks', () => {
    const weeks = contribWeeks();
    expect(weeks.length).toBeGreaterThanOrEqual(52);
    for (const w of weeks) expect(w.length).toBe(7);
    expect(weeks.flat().filter(Boolean).length).toBe(github.contributions.days.length);
    expect(weeks[0]?.find(Boolean)?.date).toBe(github.contributions.from);
  });
  it('summarises months and the busiest day', () => {
    expect(contribMonths().reduce((s, m) => s + m.total, 0)).toBe(github.contributions.total);
    const stats = contribStats();
    expect(stats.activeDays).toBeGreaterThan(0);
    expect(stats.busiestDay?.count).toBe(Math.max(...github.contributions.days.map((d) => d.count)));
  });
});
