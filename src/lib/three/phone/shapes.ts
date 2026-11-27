/** Geometry helpers for the phone: rounded rectangles, rings, slabs with correct UVs. */
import { BoxGeometry, BufferAttribute, type BufferGeometry, CylinderGeometry, ExtrudeGeometry, Path, Shape, ShapeGeometry } from 'three';

/** A rounded rectangle centred on (cx, cy), counter-clockwise. */
export function roundedRect<T extends Path>(target: T, w: number, h: number, r: number, cx = 0, cy = 0): T {
  const x = cx - w / 2;
  const y = cy - h / 2;
  const rr = Math.min(r, w / 2, h / 2);
  target.moveTo(x + rr, y);
  target.lineTo(x + w - rr, y);
  target.absarc(x + w - rr, y + rr, rr, -Math.PI / 2, 0, false);
  target.lineTo(x + w, y + h - rr);
  target.absarc(x + w - rr, y + h - rr, rr, 0, Math.PI / 2, false);
  target.lineTo(x + rr, y + h);
  target.absarc(x + rr, y + h - rr, rr, Math.PI / 2, Math.PI, false);
  target.lineTo(x, y + rr);
  target.absarc(x + rr, y + rr, rr, Math.PI, Math.PI * 1.5, false);
  return target;
}

export interface SlabOptions {
  /** Rounded edge size in mm; 0 gives sharp edges (used by the ink drawing). */
  bevel?: number;
  curveSegments?: number;
  /** A rounded-rect hole, centred unless cx and cy are given. A centred hole turns the slab into a ring. */
  hole?: { w: number; h: number; r: number; cx?: number; cy?: number };
}

/**
 * A rounded-rectangle slab, centred on the origin in X and Y, spanning z0 to z0 + depth.
 * With a bevel the outline is inset first, so the outer size stays exactly w by h.
 */
export function slab(w: number, h: number, r: number, depth: number, z0: number, opts: SlabOptions = {}): BufferGeometry {
  const bevel = Math.min(opts.bevel ?? 0, depth / 2 - 0.01, r - 0.01);
  const b = Math.max(0, bevel);
  const shape = roundedRect(new Shape(), w - 2 * b, h - 2 * b, Math.max(0.01, r - b));
  if (opts.hole) {
    const hole = roundedRect(new Path(), opts.hole.w + 2 * b, opts.hole.h + 2 * b, opts.hole.r + b, opts.hole.cx ?? 0, opts.hole.cy ?? 0);
    shape.holes.push(hole);
  }
  const geo = new ExtrudeGeometry(shape, {
    depth: depth - 2 * b,
    bevelEnabled: b > 0,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: b > 0 ? 3 : 0,
    curveSegments: opts.curveSegments ?? 10,
  });
  geo.translate(0, 0, z0 + b);
  return geo;
}

/** A flat rounded rectangle facing +Z at height z, with UVs running 0 to 1 across its bounding box. */
export function panel(w: number, h: number, r: number, z: number, curveSegments = 10): BufferGeometry {
  const geo = new ShapeGeometry(roundedRect(new Shape(), w, h, r), curveSegments);
  const pos = geo.getAttribute('position');
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = pos.getX(i) / w + 0.5;
    uv[i * 2 + 1] = pos.getY(i) / h + 0.5;
  }
  geo.setAttribute('uv', new BufferAttribute(uv, 2));
  geo.translate(0, 0, z);
  return geo;
}

/** An axis-aligned box given by its centre and size. */
export function box(cx: number, cy: number, cz: number, w: number, h: number, d: number): BufferGeometry {
  const geo = new BoxGeometry(w, h, d);
  geo.translate(cx, cy, cz);
  return geo;
}

/** A cylinder whose axis is Z, centred at (cx, cy), spanning z0 to z0 + depth. */
export function discZ(cx: number, cy: number, z0: number, radius: number, depth: number, segments = 28): BufferGeometry {
  const geo = new CylinderGeometry(radius, radius, depth, segments, 1, false);
  geo.rotateX(Math.PI / 2);
  geo.translate(cx, cy, z0 + depth / 2);
  return geo;
}

/** A cylinder whose axis is Y (the headphone jack on the top edge). */
export function discY(cx: number, cy: number, cz: number, radius: number, length: number, segments = 16): BufferGeometry {
  const geo = new CylinderGeometry(radius, radius, length, segments, 1, false);
  geo.translate(cx, cy, cz);
  return geo;
}

/** A cylinder whose axis is X (side buttons, the vibration motor). */
export function discX(cx: number, cy: number, cz: number, radius: number, length: number, segments = 16): BufferGeometry {
  const geo = new CylinderGeometry(radius, radius, length, segments, 1, false);
  geo.rotateZ(Math.PI / 2);
  geo.translate(cx, cy, cz);
  return geo;
}

/** Flips a geometry built facing +Z so that it faces -Z (for parts on the back of the phone). */
export function faceBack(geo: BufferGeometry): BufferGeometry {
  geo.rotateY(Math.PI);
  return geo;
}
