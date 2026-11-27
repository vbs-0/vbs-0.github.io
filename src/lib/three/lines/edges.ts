/**
 * Finds the edges of a mesh that a technical drawing would show.
 *
 *   crease edges       two faces meet at a sharp angle, or the edge has only one face. Always drawn.
 *   conditional edges  two faces meet smoothly (the side of a cylinder). Drawn only when the edge is on
 *                      the silhouette, which depends on the view, so each one carries the two vertices
 *                      opposite the edge and the shader decides per frame.
 *
 * Works on indexed and non-indexed geometry: vertices are welded by position first.
 */
import type { BufferGeometry } from 'three';

export interface EdgeSet {
  /** Segment endpoints: ax, ay, az, bx, by, bz per edge. */
  creases: Float32Array;
  /** Same layout, for edges that are drawn only on the silhouette. */
  conditional: Float32Array;
  /** The two vertices opposite each conditional edge: c0x, c0y, c0z, c1x, c1y, c1z. */
  controls: Float32Array;
}

interface EdgeRecord {
  a: number;
  b: number;
  faces: number[];
  opposite: number[];
}

/** @param thresholdDeg faces meeting at more than this angle form a crease. */
export function extractEdges(geometry: BufferGeometry, thresholdDeg = 32, precision = 1e4): EdgeSet {
  const position = geometry.getAttribute('position');
  const index = geometry.getIndex();
  const vertexCount = position.count;

  // Weld by position.
  const weld = new Int32Array(vertexCount);
  const unique: number[] = [];
  const seen = new Map<string, number>();
  for (let i = 0; i < vertexCount; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const key = `${Math.round(x * precision)},${Math.round(y * precision)},${Math.round(z * precision)}`;
    let id = seen.get(key);
    if (id === undefined) {
      id = unique.length / 3;
      seen.set(key, id);
      unique.push(x, y, z);
    }
    weld[i] = id;
  }

  const triCount = (index ? index.count : vertexCount) / 3;
  const normals: number[] = [];
  const edges = new Map<number, EdgeRecord>();
  const uniqueCount = unique.length / 3;
  const vx = (id: number, axis: number) => unique[id * 3 + axis] as number;

  let face = 0;
  for (let t = 0; t < triCount; t++) {
    const i0 = weld[index ? index.getX(t * 3) : t * 3] as number;
    const i1 = weld[index ? index.getX(t * 3 + 1) : t * 3 + 1] as number;
    const i2 = weld[index ? index.getX(t * 3 + 2) : t * 3 + 2] as number;
    if (i0 === i1 || i1 === i2 || i2 === i0) continue;

    const ux = vx(i1, 0) - vx(i0, 0);
    const uy = vx(i1, 1) - vx(i0, 1);
    const uz = vx(i1, 2) - vx(i0, 2);
    const wx = vx(i2, 0) - vx(i0, 0);
    const wy = vx(i2, 1) - vx(i0, 1);
    const wz = vx(i2, 2) - vx(i0, 2);
    let nx = uy * wz - uz * wy;
    let ny = uz * wx - ux * wz;
    let nz = ux * wy - uy * wx;
    const len = Math.hypot(nx, ny, nz);
    if (len < 1e-12) continue;
    nx /= len;
    ny /= len;
    nz /= len;
    normals.push(nx, ny, nz);

    const tri = [i0, i1, i2];
    for (let e = 0; e < 3; e++) {
      const a = tri[e] as number;
      const b = tri[(e + 1) % 3] as number;
      const c = tri[(e + 2) % 3] as number;
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      const key = lo * uniqueCount + hi;
      let rec = edges.get(key);
      if (!rec) {
        rec = { a: lo, b: hi, faces: [], opposite: [] };
        edges.set(key, rec);
      }
      rec.faces.push(face);
      rec.opposite.push(c);
    }
    face++;
  }

  const cosThreshold = Math.cos((thresholdDeg * Math.PI) / 180);
  const creases: number[] = [];
  const conditional: number[] = [];
  const controls: number[] = [];
  const push = (out: number[], id: number) => out.push(vx(id, 0), vx(id, 1), vx(id, 2));

  for (const rec of edges.values()) {
    if (rec.faces.length !== 2) {
      push(creases, rec.a);
      push(creases, rec.b);
      continue;
    }
    const f0 = (rec.faces[0] as number) * 3;
    const f1 = (rec.faces[1] as number) * 3;
    const dot = (normals[f0] as number) * (normals[f1] as number) + (normals[f0 + 1] as number) * (normals[f1 + 1] as number) + (normals[f0 + 2] as number) * (normals[f1 + 2] as number);
    if (dot < cosThreshold) {
      push(creases, rec.a);
      push(creases, rec.b);
    } else if (dot < 0.99995) {
      // Smooth but curved: a candidate silhouette. Coplanar neighbours can never be one, so they are dropped.
      push(conditional, rec.a);
      push(conditional, rec.b);
      push(controls, rec.opposite[0] as number);
      push(controls, rec.opposite[1] as number);
    }
  }

  return { creases: new Float32Array(creases), conditional: new Float32Array(conditional), controls: new Float32Array(controls) };
}

/** Joins several edge sets into one, so a whole part is drawn with two draw calls. */
export function mergeEdgeSets(sets: EdgeSet[]): EdgeSet {
  const join = (pick: (s: EdgeSet) => Float32Array) => {
    const out = new Float32Array(sets.reduce((n, s) => n + pick(s).length, 0));
    let offset = 0;
    for (const s of sets) {
      out.set(pick(s), offset);
      offset += pick(s).length;
    }
    return out;
  };
  return { creases: join((s) => s.creases), conditional: join((s) => s.conditional), controls: join((s) => s.controls) };
}
