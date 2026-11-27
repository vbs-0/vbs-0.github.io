import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { certifications, education, experience, featured, hackathons, layers, mlProjects, moreProjects, profile, projectById, projects, projectsForLayer } from '@/content';

const asset = (file: string) => fileURLToPath(new URL(`../../src/assets/projects/${file}`, import.meta.url));
const publicFile = (p: string) => fileURLToPath(new URL(`../../public${p}`, import.meta.url));
const provenance = JSON.parse(readFileSync(asset('provenance.json'), 'utf8')) as { file: string }[];

describe('profile', () => {
  it('matches the résumé contact details', () => {
    expect(profile.name).toBe('Veerabhadra Swami Challagali');
    expect(profile.email).toBe('chvbswami@gmail.com');
    expect(profile.phone.e164).toBe('+916304114599');
    expect(profile.github).toBe('https://github.com/vbs-0');
  });
  it('links the résumé PDF that ships with the site', () => {
    expect(existsSync(publicFile(profile.resumePath))).toBe(true);
  });
  it('has one contact of each kind with a usable href', () => {
    const kinds = profile.contacts.map((c) => c.kind).sort();
    expect(kinds).toEqual(['email', 'github', 'phone', 'resume', 'telegram']);
    for (const c of profile.contacts) expect(c.href).toMatch(/^(mailto:|tel:\+|https:\/\/|\/resume\/)/);
  });
});

describe('experience and education', () => {
  it('keeps the résumé dates', () => {
    expect(experience.roles.map((r) => [r.start, r.end])).toEqual([['2026-07', null], ['2026-04', '2026-06']]);
    expect(education.map((e) => `${e.degree} ${e.start}-${e.end}`)).toEqual(['B.Tech 2023-2026', 'Diploma 2017-2022']);
  });
  it('lists the résumé recognitions', () => {
    expect(hackathons.map((h) => h.name)).toEqual(['Algo Phoenix 2025', 'Hack Wave 1.0', 'Hack Overflow 2K24']);
    expect(certifications[0]?.issuer).toBe('NVIDIA');
  });
});

describe('projects', () => {
  it('have unique ids', () => {
    expect(new Set(projects.map((p) => p.id)).size).toBe(projects.length);
  });
  it('split into three tiers', () => {
    expect(featured.length).toBe(8);
    expect(mlProjects.length).toBe(4);
    expect(featured.length + mlProjects.length + moreProjects.length).toBe(projects.length);
  });
  it('cover every project the résumé names', () => {
    const titles = projects.map((p) => p.resumeTitle ?? p.name);
    for (const t of ['Quantum Resistant Secure Chat Platform', 'Student Coding Performance Tracker', 'Predoctor', 'RL Based Game']) expect(titles).toContain(t);
  });
  for (const p of projects) {
    describe(p.id, () => {
      it('has at least one https link, one layer, one repository and a glyph', () => {
        expect(p.links.length).toBeGreaterThan(0);
        for (const l of p.links) expect(l.url).toMatch(/^https:\/\//);
        expect(p.layers.length).toBeGreaterThan(0);
        expect(p.repos.length).toBeGreaterThan(0);
        for (const r of p.repos) expect(r).toMatch(/^[\w.-]+\/[\w.-]+$/);
        expect(p.glyph).toMatch(/^[a-z]+$/);
      });
      it('writes sentences, not fragments', () => {
        expect(p.oneLiner.length).toBeGreaterThan(20);
        expect(p.oneLiner.length).toBeLessThanOrEqual(150);
        expect(p.summary.endsWith('.') || p.summary.endsWith('?')).toBe(true);
        expect(p.highlights.length).toBeGreaterThan(0);
      });
      it('evidences its numbers', () => {
        if (p.tier === 'featured') expect(p.metrics.length).toBeGreaterThan(0);
        for (const m of p.metrics) if (m.source) expect(m.source).toMatch(/^https:\/\/github\.com\//);
      });
      it('ships every image it names, with provenance', () => {
        for (const file of [...p.shots.map((s) => s.file), ...(p.logo ? [p.logo] : [])]) {
          expect(existsSync(asset(file)), file).toBe(true);
          expect(provenance.some((r) => r.file === file), `provenance for ${file}`).toBe(true);
        }
        for (const s of p.shots) expect(s.alt.length).toBeGreaterThan(15);
      });
      it('has something to show: a screenshot, a figure or a headline number', () => {
        if (p.tier !== 'more') expect(p.shots.length > 0 || p.figure !== undefined || p.metrics.length > 0).toBe(true);
      });
    });
  }
  it('never includes the repositories left out on purpose', () => {
    const all = projects.flatMap((p) => [...p.repos, ...p.links.map((l) => l.url)]).join(' ').toLowerCase();
    expect(all).not.toContain('bomber');
    expect(all).not.toContain('commit-hygiene');
  });
  it('carries the prototype status its README states', () => {
    expect(projectById('quantumlink').status).toBe('Research prototype');
    expect(projectById('air').status).toBe('Work in progress');
  });
});

describe('layers', () => {
  it('are the six layers on six distinct phone parts', () => {
    expect(layers.map((l) => l.id)).toEqual(['interface', 'protocol', 'services', 'models', 'system', 'ops']);
    expect(new Set(layers.map((l) => l.part)).size).toBe(6);
  });
  it('reference only real projects that list the layer themselves', () => {
    for (const l of layers) {
      expect(l.projectIds.length).toBeGreaterThan(0);
      for (const id of l.projectIds) expect(projectById(id).layers, `${id} in ${l.id}`).toContain(l.id);
    }
  });
  it('give every project a home', () => {
    for (const p of projects) expect(layers.some((l) => l.projectIds.includes(p.id)), p.id).toBe(true);
    expect(projectsForLayer('protocol').map((p) => p.id)).toEqual(expect.arrayContaining(['quantumlink', 'clipbridge', 'termadb']));
  });
});
