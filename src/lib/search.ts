/** A small in-page search over the portfolio's own content. No library, no network. */
import { certifications, education, experience, hackathons, layers, profile, projects } from '@/content';

export interface SearchEntry {
  id: string;
  group: 'Section' | 'Layer' | 'Project';
  title: string;
  subtitle: string;
  /** Extra words that should match but are not shown. */
  keywords: string;
  href: string;
}

export interface SearchLinks {
  section(id: 'about' | 'experience' | 'education' | 'hackathons' | 'contact' | 'activity'): string;
  layer(id: string): string;
  project(id: string): string;
}

/** Builds the index. Each build passes its own addresses, since the three builds route differently. */
export function buildSearchIndex(links: SearchLinks): SearchEntry[] {
  const entries: SearchEntry[] = [
    { id: 'about', group: 'Section', title: 'About', subtitle: `${profile.role}, ${profile.focus}`, keywords: profile.about.join(' '), href: links.section('about') },
    {
      id: 'experience',
      group: 'Section',
      title: 'Experience',
      subtitle: `${experience.roles[0]?.title ?? ''} at ${experience.employer}`,
      keywords: [experience.product, experience.leadNote, ...experience.bullets].join(' '),
      href: links.section('experience'),
    },
    {
      id: 'education',
      group: 'Section',
      title: 'Education and certification',
      subtitle: education.map((e) => e.degree).join(', '),
      keywords: [...education.map((e) => `${e.field} ${e.school}`), ...certifications.map((c) => `${c.issuer} ${c.name} ${c.note}`)].join(' '),
      href: links.section('education'),
    },
    { id: 'hackathons', group: 'Section', title: 'Hackathons', subtitle: hackathons[0] ? `${hackathons[0].name}, ${hackathons[0].result}` : '', keywords: hackathons.map((h) => `${h.name} ${h.result} ${h.detail}`).join(' '), href: links.section('hackathons') },
    { id: 'contact', group: 'Section', title: 'Contact', subtitle: profile.email, keywords: profile.contacts.map((c) => `${c.label} ${c.value}`).join(' '), href: links.section('contact') },
    { id: 'activity', group: 'Section', title: 'GitHub activity', subtitle: 'Repositories, contributions, languages', keywords: 'github commits contributions languages repositories', href: links.section('activity') },
  ];
  for (const l of layers) {
    entries.push({ id: `layer-${l.id}`, group: 'Layer', title: l.name, subtitle: `${l.partName}. ${l.line}`, keywords: [l.body, ...l.skills, l.workNote ?? ''].join(' '), href: links.layer(l.id) });
  }
  for (const p of projects) {
    entries.push({
      id: `project-${p.id}`,
      group: 'Project',
      title: p.name,
      subtitle: p.oneLiner,
      keywords: [p.resumeTitle ?? '', p.summary, ...p.stack, ...p.highlights, p.status ?? '', p.team ?? ''].join(' '),
      href: links.project(p.id),
    });
  }
  return entries;
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
