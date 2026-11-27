#!/usr/bin/env node
/**
 * Writes src/data/github.json from public GitHub data. The build never calls the network; it reads this file.
 *
 *   node scripts/sync-github.mjs
 *
 * Uses GITHUB_TOKEN when it is set (CI). Without one it stays inside the anonymous rate limit by
 * re-using the languages of repositories that have not been pushed since the last snapshot.
 * If anything fails or looks wrong, the previous snapshot is kept and the script exits 0 with a warning.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { looksLikeAYear, parseContributions } from './lib/contrib.mjs';

const LOGIN = 'vbs-0';
/** Repositories outside the user account that the portfolio also shows. */
const EXTRA_REPOS = ['Garuda-Technologies/pulse'];

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'github.json');
const previous = existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : null;
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const headers = {
  'User-Agent': `${LOGIN}-portfolio-sync`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

async function api(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status} ${res.statusText}`);
  return res.json();
}

function toRepo(r, languages) {
  return {
    fullName: r.full_name,
    name: r.name,
    description: r.description ?? '',
    url: r.html_url,
    homepage: r.homepage || '',
    language: r.language ?? '',
    languages,
    topics: r.topics ?? [],
    fork: Boolean(r.fork),
    archived: Boolean(r.archived),
    createdAt: r.created_at,
    pushedAt: r.pushed_at,
  };
}

async function languagesFor(r) {
  const old = previous?.repos?.find((p) => p.fullName === r.full_name);
  if (old && old.pushedAt === r.pushed_at && old.languages) return old.languages;
  return api(`/repos/${r.full_name}/languages`);
}

async function contributionsFromGraphQL() {
  const query = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel}}}}}}`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { login: LOGIN } }),
  });
  if (!res.ok) throw new Error(`GraphQL -> ${res.status}`);
  const json = await res.json();
  const cal = json?.data?.user?.contributionsCollection?.contributionCalendar;
  if (!cal) throw new Error(`GraphQL returned no calendar: ${JSON.stringify(json?.errors ?? json).slice(0, 200)}`);
  const levels = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
  return cal.weeks.flatMap((w) => w.contributionDays).map((d) => ({ date: d.date, count: d.contributionCount, level: levels[d.contributionLevel] ?? 0 }));
}

async function contributionsFromPage() {
  const res = await fetch(`https://github.com/users/${LOGIN}/contributions`, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'X-Requested-With': 'XMLHttpRequest' },
  });
  if (!res.ok) throw new Error(`contribution page -> ${res.status}`);
  return parseContributions(await res.text());
}

async function contributions() {
  if (token) {
    try {
      const days = await contributionsFromGraphQL();
      if (looksLikeAYear(days)) return days;
    } catch (err) {
      console.warn(`GraphQL calendar failed, falling back to the public page: ${err.message}`);
    }
  }
  const days = await contributionsFromPage();
  if (!looksLikeAYear(days)) throw new Error(`calendar did not look like a year (${days.length} days)`);
  return days;
}

async function main() {
  const user = await api(`/users/${LOGIN}`);
  const list = [];
  for (let page = 1; page <= 5; page++) {
    const batch = await api(`/users/${LOGIN}/repos?per_page=100&sort=pushed&page=${page}`);
    list.push(...batch);
    if (batch.length < 100) break;
  }
  if (list.length === 0) throw new Error('repository list came back empty');
  for (const full of EXTRA_REPOS) list.push(await api(`/repos/${full}`));

  const repos = [];
  for (const r of list) repos.push(toRepo(r, r.fork ? {} : await languagesFor(r)));
  repos.sort((a, b) => b.pushedAt.localeCompare(a.pushedAt));

  const days = await contributions();
  const snapshot = {
    fetchedAt: new Date().toISOString(),
    user: { login: user.login, name: user.name ?? '', url: user.html_url, publicRepos: user.public_repos, createdAt: user.created_at },
    repos,
    contributions: {
      total: days.reduce((sum, d) => sum + d.count, 0),
      from: days[0].date,
      to: days[days.length - 1].date,
      days: days.map((d) => [d.date, d.count, d.level]),
    },
  };
  writeFileSync(out, `${JSON.stringify(snapshot, null, 1)}\n`);
  console.log(`github.json: ${repos.length} repositories, ${snapshot.contributions.total} contributions from ${snapshot.contributions.from} to ${snapshot.contributions.to}`);
}

main().catch((err) => {
  if (previous) {
    console.warn(`GitHub sync failed, keeping the snapshot from ${previous.fetchedAt}: ${err.message}`);
    process.exit(0);
  }
  console.error(`GitHub sync failed and there is no earlier snapshot: ${err.message}`);
  process.exit(1);
});
