/** Builds the search index from the portfolio's own content. Runs at build time only. */
import { certifications, education, experience, hackathons, layers, profile, projects } from '@/content';

import type { SearchEntry } from './search-core';

export { type SearchEntry, search } from './search-core';

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
