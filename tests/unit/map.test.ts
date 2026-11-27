import { describe, expect, it } from 'vitest';
import { buildMap, hash01, layerZ, projectIso } from '@/lib/map/layout';

const input = {
  layers: [
    { id: 'interface', label: 'Interface' },
    { id: 'services', label: 'Services' },
    { id: 'ops', label: 'Ops' },
  ],
  projects: [
    { id: 'a', label: 'A', layers: ['interface', 'services'], stack: ['React', 'Python'], weight: 1 },
    { id: 'b', label: 'B', layers: ['services'], stack: ['Python'], weight: 0.5 },
    { id: 'c', label: 'C', layers: ['ops'], stack: [], weight: 0.2 },
  ],
  skills: ['React', 'Python'],
};

describe('system map layout', () => {
  it('is deterministic and finite', () => {
    const one = buildMap(input);
    const two = buildMap(input);
    expect(one.nodes.map((n) => [n.id, n.x, n.y, n.z])).toEqual(two.nodes.map((n) => [n.id, n.x, n.y, n.z]));
    for (const n of one.nodes) {
      for (const v of [n.x, n.y, n.z]) expect(Number.isFinite(v)).toBe(true);
    }
  });

  it('makes one node per layer, project and skill, and the edges that join them', () => {
    const { nodes, edges } = buildMap(input);
    expect(nodes.filter((n) => n.kind === 'layer')).toHaveLength(3);
    expect(nodes.filter((n) => n.kind === 'project')).toHaveLength(3);
    expect(nodes.filter((n) => n.kind === 'skill')).toHaveLength(2);
    // a joins two layers and two skills, b one layer and one skill, c one layer.
    expect(edges).toHaveLength(4 + 2 + 1);
    expect(edges.filter((e) => e.b === 'layer:services')).toHaveLength(2);
  });

  it('puts the layers in separate planes and keeps them there', () => {
    const { nodes } = buildMap(input);
    const zs = nodes.filter((n) => n.kind === 'layer').map((n) => n.z);
    expect(new Set(zs.map((z) => z.toFixed(3))).size).toBe(3);
    expect(layerZ(0, 3)).toBeGreaterThan(layerZ(2, 3));
  });

  it('keeps nodes apart', () => {
    const { nodes } = buildMap(input);
    let closest = Infinity;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]!;
        const b = nodes[j]!;
        closest = Math.min(closest, Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z));
      }
    }
    expect(closest).toBeGreaterThan(0.2);
  });

  it('hashes to a stable number in range', () => {
    expect(hash01('pam')).toBe(hash01('pam'));
    expect(hash01('pam')).not.toBe(hash01('studease'));
    for (const s of ['', 'a', 'quantumlink']) expect(hash01(s)).toBeGreaterThanOrEqual(0), expect(hash01(s)).toBeLessThan(1);
  });

  it('projects the same point to the same place', () => {
    const p = { x: 1, y: 2, z: -3 };
    expect(projectIso(p)).toEqual(projectIso(p));
    expect(projectIso({ x: 0, y: 0, z: 0 })).toEqual({ x: 0, y: 0, depth: 0 });
  });
});
