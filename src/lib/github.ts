/** Typed access to the committed GitHub snapshot (src/data/github.json, written by scripts/sync-github.mjs). */
import raw from '@/data/github.json';

export interface Repo {
  fullName: string;
  name: string;
  description: string;
  url: string;
  homepage: string;
  language: string;
  languages: Record<string, number>;
  topics: string[];
  fork: boolean;
  archived: boolean;
  createdAt: string;
  pushedAt: string;
}

export type Level = 0 | 1 | 2 | 3 | 4;
export interface Day {
  date: string;
  count: number;
  level: Level;
}

const days: Day[] = (raw.contributions.days as [string, number, number][]).map(([date, count, level]) => ({
  date,
  count,
  level: Math.min(4, Math.max(0, level)) as Level,
}));

export const github = {
  fetchedAt: raw.fetchedAt,
  user: raw.user,
  repos: raw.repos as Repo[],
  contributions: { total: raw.contributions.total, from: raw.contributions.from, to: raw.contributions.to, days },
};

const byName = new Map(github.repos.map((r) => [r.fullName.toLowerCase(), r]));

export function repoByName(fullName: string): Repo | undefined {
  return byName.get(fullName.toLowerCase());
}

/** Earliest creation and latest push across a project's repositories. */
export function projectDates(project: { repos: string[] }): { created: string; pushed: string } | undefined {
  const repos = project.repos.map(repoByName).filter((r): r is Repo => r !== undefined);
  if (repos.length === 0) return undefined;
  return {
    created: repos.map((r) => r.createdAt).sort()[0] as string,
    pushed: repos.map((r) => r.pushedAt).sort().at(-1) as string,
  };
}

/** Languages of a project, largest first, as shares of all bytes in its repositories. */
export function projectLanguages(project: { repos: string[] }, minShare = 0.03): { name: string; share: number }[] {
  const totals = new Map<string, number>();
  for (const full of project.repos) {
    for (const [lang, bytes] of Object.entries(repoByName(full)?.languages ?? {})) totals.set(lang, (totals.get(lang) ?? 0) + bytes);
  }
  const sum = [...totals.values()].reduce((a, b) => a + b, 0);
  if (sum === 0) return [];
  return [...totals]
    .map(([name, bytes]) => ({ name, share: bytes / sum }))
    .filter((l) => l.share >= minShare)
    .sort((a, b) => b.share - a.share);
}

/**
 * In how many original repositories each language appears.
 * A language counts for a repository when it is at least 5% of that repository's bytes,
 * which keeps one-line batch files and build scripts out of the picture.
 */
export function languagePresence(): { name: string; repos: number }[] {
  const counts = new Map<string, number>();
  for (const r of github.repos) {
    if (r.fork) continue;
    const sum = Object.values(r.languages).reduce((a, b) => a + b, 0);
    if (sum === 0) continue;
    for (const [lang, bytes] of Object.entries(r.languages)) if (bytes / sum >= 0.05) counts.set(lang, (counts.get(lang) ?? 0) + 1);
  }
  return [...counts].map(([name, repos]) => ({ name, repos })).sort((a, b) => b.repos - a.repos || a.name.localeCompare(b.name));
}

export const originalRepoCount = github.repos.filter((r) => !r.fork && r.fullName.toLowerCase().startsWith(`${raw.user.login.toLowerCase()}/`)).length;

/** The calendar as week columns, Sunday first. Days outside the range are null. */
export function contribWeeks(): (Day | null)[][] {
  const first = days[0];
  if (!first) return [];
  const lead = new Date(`${first.date}T00:00:00Z`).getUTCDay();
  const cells: (Day | null)[] = [...Array<null>(lead).fill(null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (Day | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Totals per calendar month, oldest first. `key` is YYYY-MM. */
export function contribMonths(): { key: string; total: number }[] {
  const totals = new Map<string, number>();
  for (const d of days) totals.set(d.date.slice(0, 7), (totals.get(d.date.slice(0, 7)) ?? 0) + d.count);
  return [...totals].map(([key, total]) => ({ key, total }));
}

export function contribStats() {
  const active = days.filter((d) => d.count > 0);
  const busiest = days.reduce<Day | undefined>((best, d) => (best === undefined || d.count > best.count ? d : best), undefined);
  return { total: github.contributions.total, activeDays: active.length, busiestDay: busiest, days: days.length };
}
