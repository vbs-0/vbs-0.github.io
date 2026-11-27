/** The search itself: pure, with no content imports, so the browser bundle stays small. */

export interface SearchEntry {
  id: string;
  group: 'Section' | 'Layer' | 'Project';
  title: string;
  subtitle: string;
  /** Extra words that should match but are not shown. */
  keywords: string;
  href: string;
}

/** Every word of the query must appear somewhere in an entry. Title matches rank first. */
export function search(index: SearchEntry[], query: string, limit = 8): SearchEntry[] {
  const words = query.toLowerCase().split(/[^a-z0-9+#.]+/).filter(Boolean);
  if (words.length === 0) return [];
  const scored: { entry: SearchEntry; score: number; order: number }[] = [];
  index.forEach((entry, order) => {
    const title = entry.title.toLowerCase();
    const subtitle = entry.subtitle.toLowerCase();
    const rest = entry.keywords.toLowerCase();
    let score = 0;
    for (const w of words) {
      if (title.startsWith(w)) score += 6;
      else if (title.includes(w)) score += 4;
      else if (subtitle.includes(w)) score += 2;
      else if (rest.includes(w)) score += 1;
      else return;
    }
    scored.push({ entry, score, order });
  });
  return scored
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, limit)
    .map((s) => s.entry);
}
