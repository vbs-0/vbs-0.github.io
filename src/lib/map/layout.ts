/**
 * The system map: where every node sits in the chart. Pure and deterministic, so the server-rendered SVG
 * and the live 3D scene agree, and so the same map is drawn on every build of every load.
 *
 * The map is the stack itself: one plane per layer, from the interface at the front to ops at the back.
 * Projects orbit the layer they live in, skills sit on an outer shell, and a short relaxation pass keeps
 * them from overlapping. Positions are in world units, roughly a 6 x 6 x 4 box around the origin.
 */
import { seededRandom } from '@/lib/three/math';

export type NodeKind = 'layer' | 'project' | 'skill';

export interface MapNode {
  id: string;
  kind: NodeKind;
  label: string;
  /** The layer a node belongs to, for colour and filtering. A layer node carries its own id. */
  layer: string;
  /** 0 to 1: how much this node carries. Sizes the disc and orders the list. */
  weight: number;
  x: number;
  y: number;
  z: number;
}

export interface MapEdge {
  a: string;
  b: string;
  /** 0 to 1, from how much the two share. */
  weight: number;
}

export interface MapInput {
  layers: { id: string; label: string }[];
  projects: { id: string; label: string; layers: string[]; stack: string[]; weight: number }[];
  /** Skills to place, already chosen and ordered; the first ones are the most used. */
  skills: string[];
}

const LAYER_RADIUS = 2.3;
const PROJECT_RADIUS = 1.55;
const SKILL_RADIUS = 3.1;

/** A stable 0 to 1 from a string, so every node's jitter is its own and never changes. */
export function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

/** Depth of a layer plane: the interface at the front (+z), ops at the back (-z). */
export function layerZ(index: number, count: number): number {
  if (count <= 1) return 0;
  return 1.6 - (index / (count - 1)) * 3.2;
}

export function buildMap(input: MapInput): { nodes: MapNode[]; edges: MapEdge[] } {
  const nodes: MapNode[] = [];
  const edges: MapEdge[] = [];
  const layerIds = input.layers.map((l) => l.id);
  const layerIndex = new Map(layerIds.map((id, i) => [id, i]));
  const zOf = (id: string) => layerZ(layerIndex.get(id) ?? 0, layerIds.length);

  // The layers themselves: one per plane, on a ring, evenly spaced by their own order.
  input.layers.forEach((l, i) => {
    const angle = (i / input.layers.length) * Math.PI * 2 - Math.PI / 2;
    nodes.push({
      id: `layer:${l.id}`,
      kind: 'layer',
      label: l.label,
      layer: l.id,
      weight: 1,
      x: Math.cos(angle) * LAYER_RADIUS,
      y: Math.sin(angle) * LAYER_RADIUS,
      z: zOf(l.id),
    });
  });

  // Projects: on their primary layer's plane, spread around it by their own hash, pulled towards their layer.
  for (const p of input.projects) {
    const primary = p.layers[0] ?? layerIds[0] ?? 'interface';
    const base = layerIndex.get(primary) ?? 0;
    const angle = hash01(p.id) * Math.PI * 2 + base * 0.9;
    const radius = PROJECT_RADIUS * (0.72 + hash01(`${p.id}:r`) * 0.5);
    const spread = (hash01(`${p.id}:z`) - 0.5) * 0.5;
    nodes.push({
      id: `project:${p.id}`,
      kind: 'project',
      label: p.label,
      layer: primary,
      weight: p.weight,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      z: zOf(primary) + spread,
    });
    for (const l of p.layers) edges.push({ a: `project:${p.id}`, b: `layer:${l}`, weight: l === primary ? 1 : 0.55 });
  }

  // Skills: an outer shell, each near the layers it is used in.
  input.skills.forEach((skill, i) => {
    const angle = (i / Math.max(1, input.skills.length)) * Math.PI * 2 + 0.7;
    const users = input.projects.filter((p) => p.stack.includes(skill));
    const layer = users[0]?.layers[0] ?? layerIds[0] ?? 'interface';
    const z = users.length > 0 ? users.reduce((sum, p) => sum + zOf(p.layers[0] ?? layer), 0) / users.length : 0;
    nodes.push({
      id: `skill:${skill}`,
      kind: 'skill',
      label: skill,
      layer,
      weight: Math.min(1, users.length / 5),
      x: Math.cos(angle) * SKILL_RADIUS,
      y: Math.sin(angle) * SKILL_RADIUS,
      z: z + (hash01(`s:${skill}`) - 0.5) * 0.4,
    });
    for (const p of users) edges.push({ a: `project:${p.id}`, b: `skill:${skill}`, weight: 0.4 });
  });

  relax(nodes, 24);
  return { nodes, edges };
}

/**
 * A short repulsion pass, done in the projected plane rather than in 3D: two nodes a metre apart in depth
 * still land on the same pixel, so the spacing that matters is the spacing on screen.
 */
function relax(nodes: MapNode[], passes: number): void {
  const minDistance = 0.86;
  for (let pass = 0; pass < passes; pass++) {
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i] as MapNode;
      const pa = projectIso(a);
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j] as MapNode;
        const pb = projectIso(b);
        let dx = pb.x - pa.x;
        let dy = pb.y - pa.y;
        let d2 = dx * dx + dy * dy;
        if (d2 > minDistance * minDistance) continue;
        if (d2 < 1e-6) {
          const rand = seededRandom(i * 7919 + j);
          dx = rand() - 0.5;
          dy = rand() - 0.5;
          d2 = dx * dx + dy * dy;
        }
        const d = Math.sqrt(d2);
        const push = ((minDistance - d) / d) * 0.5;
        // Push in the plane the eye sees; depth stays where the layer put it.
        a.x -= dx * push;
        a.y -= dy * push;
        b.x += dx * push;
        b.y += dy * push;
        pa.x -= dx * push;
        pa.y -= dy * push;
        pb.x += dx * push;
        pb.y += dy * push;
      }
    }
  }
}

/** An isometric projection for the server-rendered SVG: the same points, seen from the same angle. */
export function projectIso(p: { x: number; y: number; z: number }): { x: number; y: number; depth: number } {
  const tilt = 0.62;
  return { x: p.x + p.z * 0.62, y: p.y * tilt - p.z * 0.42, depth: p.z };
}
