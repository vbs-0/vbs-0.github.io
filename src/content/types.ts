/** Shapes of everything the three builds present. Facts live here once. */

export type LayerId = 'interface' | 'protocol' | 'services' | 'models' | 'system' | 'ops';
export type PhonePartId = 'display' | 'antenna' | 'board' | 'camera' | 'soc' | 'battery';

export interface ContactLink {
  kind: 'email' | 'phone' | 'github' | 'telegram' | 'resume';
  label: string;
  value: string;
  href: string;
}

export interface Profile {
  name: string;
  handle: string;
  role: string;
  focus: string;
  location: string;
  thesis: string;
  thesisBody: string;
  about: string[];
  email: string;
  phone: { display: string; e164: string };
  contacts: ContactLink[];
  resumePath: string;
  github: string;
}

export interface Role {
  title: string;
  kind: string;
  start: string;
  end: string | null;
}

export interface Experience {
  employer: string;
  product: string;
  roles: Role[];
  leadNote: string;
  bullets: string[];
}

export interface Education {
  degree: string;
  field: string;
  school: string;
  start: string;
  end: string;
}

export interface Certification {
  issuer: string;
  name: string;
  date: string;
  note: string;
}

export interface Hackathon {
  name: string;
  result: string;
  rank: 1 | 2 | 3 | null;
  detail: string;
  /** Only when the event name or the résumé states it. */
  year?: string;
}

/** A measured value taken from a README or the résumé. `source` points at the evidence. */
export interface Metric {
  value: string;
  label: string;
  source?: string;
}

export interface ProjectLink {
  kind: 'repo' | 'live' | 'apk' | 'docs' | 'evidence';
  label: string;
  url: string;
}

/** `file` is a path under src/assets/projects/. */
export interface Shot {
  file: string;
  alt: string;
  kind: 'web' | 'phone' | 'chart';
  caption?: string;
}

/** A small data figure for projects that have numbers but no screenshot. Each build draws it its own way. */
export type Figure =
  | { kind: 'bars'; title: string; unit: 'bytes'; items: { label: string; value: number; note?: string }[] }
  | { kind: 'table'; title: string; head: string[]; rows: string[][] };

export interface Project {
  id: string;
  name: string;
  /** The name the résumé uses, when it differs. */
  resumeTitle?: string;
  year: string;
  tier: 'featured' | 'ml' | 'more';
  oneLiner: string;
  summary: string;
  highlights: string[];
  /** First entry is the primary layer. */
  layers: LayerId[];
  stack: string[];
  /** The first metric is the headline number. */
  metrics: Metric[];
  links: ProjectLink[];
  shots: Shot[];
  figure?: Figure;
  /** A logo file under src/assets/projects/, when the project has a real one. */
  logo?: string;
  /** Glyph name from src/lib/icons.ts, used when there is no logo. */
  glyph: string;
  /** e.g. "Research prototype". Shown wherever the project appears. */
  status?: string;
  /** Limits the project's own README states. */
  limits?: string[];
  /** GitHub repositories as owner/name, joined with the snapshot for dates and languages. */
  repos: string[];
  team?: string;
}

export interface Layer {
  id: LayerId;
  part: PhonePartId;
  partName: string;
  name: string;
  /** "What crosses the air." */
  line: string;
  body: string;
  skills: string[];
  projectIds: string[];
  /** Work that has no public repository, described in words only. */
  workNote?: string;
}
