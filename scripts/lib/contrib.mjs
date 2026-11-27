/**
 * Parses the public contribution calendar that github.com serves at /users/<login>/contributions.
 * Pure text in, plain data out, so it can be unit-tested without the network.
 */

const attr = (tag, name) => {
  // The attribute must start at a word boundary, so "data-date" never matches inside "x-data-date".
  const m = new RegExp(`(?:^|[^A-Za-z0-9_-])${name}="([^"]*)"`).exec(tag);
  return m ? m[1] : undefined;
};

/**
 * @param {string} html
 * @returns {{ date: string, count: number, level: 0|1|2|3|4 }[]} days sorted by date
 */
export function parseContributions(html) {
  if (typeof html !== 'string' || html.length === 0) return [];

  /** id -> count, read from the tooltips ("26 contributions on August 13th." / "No contributions on ...") */
  const counts = new Map();
  for (const m of html.matchAll(/<tool-tip\b([^>]*)>([^<]*)<\/tool-tip>/g)) {
    const id = attr(m[1], 'for');
    if (!id) continue;
    const text = m[2].trim();
    const n = /^(\d[\d,]*)\s+contribution/.exec(text);
    if (n) counts.set(id, Number(n[1].replace(/,/g, '')));
    else if (/^No\s+contribution/i.test(text)) counts.set(id, 0);
  }

  const days = [];
  for (const m of html.matchAll(/<td\b([^>]*)>/g)) {
    const tag = m[1];
    const date = attr(tag, 'data-date');
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const level = Number(attr(tag, 'data-level') ?? 0);
    const id = attr(tag, 'id');
    const known = id ? counts.get(id) : undefined;
    // Without a tooltip the level is all we know: keep the day, count 0 for level 0, otherwise the level as a floor.
    const count = known ?? (level > 0 ? level : 0);
    days.push({ date, count, level: Math.min(4, Math.max(0, level)) });
  }
  days.sort((a, b) => a.date.localeCompare(b.date));
  return days;
}

/** "520 contributions in the last year" -> 520, or undefined when the heading is missing. */
export function parseContributionTotal(html) {
  const m = /<h2[^>]*id="js-contribution-activity-description"[^>]*>\s*([\d,]+)\s+contributions?/.exec(html ?? '');
  return m ? Number(m[1].replace(/,/g, '')) : undefined;
}

/** Sanity check used before a new snapshot replaces the old one. */
export function looksLikeAYear(days) {
  if (!Array.isArray(days) || days.length < 300 || days.length > 400) return false;
  for (let i = 1; i < days.length; i++) if (days[i].date <= days[i - 1].date) return false;
  return days.every((d) => Number.isInteger(d.count) && d.count >= 0);
}
