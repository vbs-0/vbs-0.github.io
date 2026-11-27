import { BoxGeometry, CylinderGeometry, PlaneGeometry, SphereGeometry } from 'three';
import { describe, expect, it } from 'vitest';
import { extractEdges, mergeEdgeSets } from '@/lib/three/lines/edges';
import { slab } from '@/lib/three/phone/shapes';

const count = (a: Float32Array) => a.length / 6;

describe('extractEdges', () => {
  it('finds the 12 edges of a box and nothing else', () => {
    const e = extractEdges(new BoxGeometry(2, 3, 4));
    expect(count(e.creases)).toBe(12);
    expect(count(e.conditional)).toBe(0);
  });
  it('ignores the diagonal inside a flat quad but keeps its four borders', () => {
    const e = extractEdges(new PlaneGeometry(1, 1));
    expect(count(e.creases)).toBe(4);
    expect(count(e.conditional)).toBe(0);
  });
  it('gives a cylinder two rims and one silhouette candidate per side segment', () => {
    const segments = 24;
    const e = extractEdges(new CylinderGeometry(1, 1, 2, segments));
    expect(count(e.creases)).toBe(segments * 2);
    expect(count(e.conditional)).toBe(segments);
    expect(e.controls.length).toBe(e.conditional.length);
  });
  it('treats a sphere as all silhouette candidates', () => {
    const e = extractEdges(new SphereGeometry(1, 16, 12));
    expect(count(e.creases)).toBe(0);
    expect(count(e.conditional)).toBeGreaterThan(100);
  });
  it('draws a rounded slab as two outlines, with corner silhouettes only as candidates', () => {
    const e = extractEdges(slab(40, 80, 6, 2, 0, { curveSegments: 8 }));
    // three.js samples an arc at twice curveSegments, so each corner has 16 segments;
    // each outline is 4 straight sides + 4 * 16 arc segments, and there are two outlines (front and back).
    expect(count(e.creases)).toBe(2 * (4 + 4 * 16));
    // Every vertical edge around a corner can become a silhouette: 17 per corner, counting both ends of the arc.
    expect(count(e.conditional)).toBe(4 * 17);
  });
  it('respects the angle threshold', () => {
    const g = new CylinderGeometry(1, 1, 2, 6);
    expect(count(extractEdges(g, 32).creases)).toBe(12 + 6);
    expect(count(extractEdges(g, 75).creases)).toBe(12);
  });
  it('merges sets', () => {
    const a = extractEdges(new BoxGeometry(1, 1, 1));
    const b = extractEdges(new CylinderGeometry(1, 1, 1, 8));
    const m = mergeEdgeSets([a, b]);
    expect(count(m.creases)).toBe(count(a.creases) + count(b.creases));
    expect(m.controls.length).toBe(m.conditional.length);
  });
});
