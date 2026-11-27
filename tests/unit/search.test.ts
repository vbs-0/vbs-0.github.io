import { describe, expect, it } from 'vitest';
import { projects } from '@/content';
import { icons, isIcon } from '@/lib/icons';
import { buildSearchIndex, search } from '@/lib/search';

const index = buildSearchIndex({ section: (id) => `#${id}`, layer: (id) => `#layer-${id}`, project: (id) => `#/apps/${id}` });
const titles = (q: string) => search(index, q, 20).map((e) => e.title);

describe('search', () => {
  it('indexes every section, layer and project once', () => {
    expect(index.filter((e) => e.group === 'Project').length).toBe(projects.length);
    expect(index.filter((e) => e.group === 'Layer').length).toBe(6);
    expect(new Set(index.map((e) => e.id)).size).toBe(index.length);
  });
  it('finds work by technology', () => {
    expect(titles('django')).toContain('Experience');
    expect(titles('rust')).toEqual(expect.arrayContaining(['ClipBridge', 'Notepad, four ways']));
    expect(titles('kyber')).toContain('QuantumLink-PQC');
    expect(titles('postgresql')).toEqual(expect.arrayContaining(['StudEase', 'PAM']));
  });
  it('ignores case and needs every word', () => {
    expect(titles('STUDEASE')).toEqual(titles('studease'));
    expect(titles('studease kyber')).toEqual([]);
  });
  it('ranks a title match above a body match', () => {
    expect(titles('pam')[0]).toBe('PAM');
    expect(titles('experience')[0]).toBe('Experience');
  });
  it('returns nothing for an empty query and respects the limit', () => {
    expect(search(index, '   ')).toEqual([]);
    expect(search(index, 'a', 3).length).toBeLessThanOrEqual(3);
  });
  it('finds projects by the name the résumé uses', () => {
    expect(titles('student coding performance')).toContain('DSAAllocator');
  });
});

describe('icons', () => {
  it('has a glyph for every project', () => {
    for (const p of projects) expect(isIcon(p.glyph), `${p.id}: ${p.glyph}`).toBe(true);
  });
  it('contains only markup, no scripts', () => {
    for (const [name, svg] of Object.entries(icons)) {
      expect(svg, name).toMatch(/^<(path|circle|rect)/);
      expect(svg.toLowerCase(), name).not.toContain('script');
    }
  });
});
