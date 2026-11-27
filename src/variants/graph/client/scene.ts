/**
 * The chart itself: edges, one outlined plane per layer, and dust, drawn in 3D. The nodes are HTML
 * buttons riding on projected 3D positions (so they are real controls, with real focus and real text),
 * and this scene owns the camera: it flies to whatever is selected and follows the pointer a little.
 */
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  FogExp2,
  LineBasicMaterial,
  LineSegments,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
} from 'three';
import type { Tier } from '@/lib/three/capabilities';
import { createEngine } from '@/lib/three/engine';
import { damp, seededRandom } from '@/lib/three/math';
import { palettes } from '@/styles/palettes';

export interface GraphNode {
  id: string;
  kind: 'layer' | 'project' | 'skill';
  label: string;
  layer: string;
  weight: number;
  x: number;
  y: number;
  z: number;
}
export interface GraphEdge {
  a: string;
  b: string;
  weight: number;
}
export interface Projected {
  id: string;
  x: number;
  y: number;
  /** 0 close to 1 far; used to fade labels. */
  depth: number;
  visible: boolean;
}

export interface GraphScene {
  /** Screen positions in CSS pixels of the canvas, written into `out`. */
  project(out: Projected[]): Projected[];
  select(id: string | null): void;
  filter(layer: string | null): void;
  hover(id: string | null): void;
  /** Pointer position, -1 to 1, for the camera's parallax. */
  pointer(x: number, y: number): void;
  readonly ready: Promise<void>;
  stats(): { fps: number; calls: number; triangles: number };
  dispose(): void;
}

export interface GraphSceneOptions {
  nodes: GraphNode[];
  edges: GraphEdge[];
  tier: Tier;
  reducedMotion: boolean;
  onContextLost(): void;
  onContextRestored(): void;
}

const pause = () => new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));

export async function createGraphScene(canvas: HTMLCanvasElement, opts: GraphSceneOptions): Promise<GraphScene> {
  const pal = palettes.graph.dark;
  const engine = createEngine(canvas, {
    maxDpr: opts.tier === 'low' ? 1.5 : 2,
    toneMapping: 'none',
    onContextLost: opts.onContextLost,
    onContextRestored: opts.onContextRestored,
  });
  const renderer = engine.renderer;
  const scene = new Scene();
  scene.fog = new FogExp2(new Color(pal.bg as string).getHex(), 0.055);
  const camera = new PerspectiveCamera(42, 1, 0.1, 60);
  const home = { x: 0, y: 1.8, z: 10.4 };
  camera.position.set(home.x, home.y, home.z);
  camera.lookAt(0, 0, 0);

  const byId = new Map(opts.nodes.map((n) => [n.id, n]));
  const layerColor = (id: string) => new Color((pal[`layer${id[0]?.toUpperCase()}${id.slice(1)}`] as string) ?? (pal.signal as string));
  await pause();

  // Edges: one buffer, a colour per end so a line reads as belonging to its layer.
  const positions: number[] = [];
  const colors: number[] = [];
  for (const e of opts.edges) {
    const a = byId.get(e.a);
    const b = byId.get(e.b);
    if (!a || !b) continue;
    const c = layerColor(a.layer);
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    for (let k = 0; k < 2; k++) colors.push(c.r, c.g, c.b);
  }
  const edgeGeometry = new BufferGeometry();
  edgeGeometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  edgeGeometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
  const edgeMaterial = new LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.15, depthWrite: false });
  const edges = new LineSegments(edgeGeometry, edgeMaterial);
  scene.add(edges);

  // A thin ring at each layer node: the layer is a place in the chart, not a box drawn round the work.
  const planes: LineSegments<BufferGeometry, LineBasicMaterial>[] = [];
  const ringPoints = 48;
  for (const n of opts.nodes.filter((x) => x.kind === 'layer')) {
    const arr: number[] = [];
    for (let i = 0; i <= ringPoints; i++) {
      const a = (i / ringPoints) * Math.PI * 2;
      arr.push(n.x + Math.cos(a) * 0.34, n.y + Math.sin(a) * 0.34, n.z);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(arr), 3));
    const m = new LineBasicMaterial({ color: layerColor(n.layer), transparent: true, opacity: 0.5, depthWrite: false });
    const ring = new LineSegments(g, m);
    planes.push(ring);
    scene.add(ring);
  }
  await pause();

  // Dust: a few hundred points, so the field has depth without any cost worth measuring.
  const dustCount = opts.tier === 'low' ? 220 : 520;
  const dustPos = new Float32Array(dustCount * 3);
  const rand = seededRandom(77);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (rand() - 0.5) * 22;
    dustPos[i * 3 + 1] = (rand() - 0.5) * 14;
    dustPos[i * 3 + 2] = (rand() - 0.5) * 20 - 4;
  }
  const dustGeometry = new BufferGeometry();
  dustGeometry.setAttribute('position', new BufferAttribute(dustPos, 3));
  const dust = new Points(dustGeometry, new PointsMaterial({ color: 0x9fb6d6, size: 0.035, sizeAttenuation: true, transparent: true, opacity: 0.5, depthWrite: false, blending: AdditiveBlending }));
  scene.add(dust);

  const target = { x: 0, y: 0, z: 0 };
  const goal = { x: 0, y: 0, z: 0 };
  const camGoal = { x: home.x, y: home.y, z: home.z };
  let selected: GraphNode | null = null;
  let hovered: string | null = null;
  let filter: string | null = null;
  let px = 0;
  let py = 0;
  let fps = 60;
  let first = true;

  engine.onFrame((dt, elapsed) => {
    const instant = opts.reducedMotion || first;
    const k = instant ? 1e6 : 3.4;
    if (selected) {
      goal.x = selected.x;
      goal.y = selected.y;
      goal.z = selected.z;
      const dist = (selected.kind === 'skill' ? 3.6 : 3.2) * (engine.size.width / Math.max(1, engine.size.height) < 1.05 ? 1.25 : 1);
      camGoal.x = selected.x + px * 0.35;
      camGoal.y = selected.y + 0.55 + py * 0.2;
      camGoal.z = selected.z + dist;
    } else {
      goal.x = 0;
      goal.y = 0;
      goal.z = 0;
      // A tall, narrow window gets a wider view, so the whole chart still fits beside the panel.
      const aspect = engine.size.width / Math.max(1, engine.size.height);
      const wide = aspect < 1.05 ? 1.32 : 1;
      camGoal.x = home.x + px * 0.7;
      camGoal.y = home.y + py * 0.35 + (instant ? 0 : Math.sin(elapsed * 0.25) * 0.06);
      camGoal.z = home.z * wide;
    }
    target.x = damp(target.x, goal.x, k, dt);
    target.y = damp(target.y, goal.y, k, dt);
    target.z = damp(target.z, goal.z, k, dt);
    camera.position.set(damp(camera.position.x, camGoal.x, k, dt), damp(camera.position.y, camGoal.y, k, dt), damp(camera.position.z, camGoal.z, k, dt));
    camera.lookAt(target.x, target.y, target.z);

    // A hovered or selected node brightens its own edges; a filter dims everything off its layer.
    edgeMaterial.opacity = filter ? 0.07 : 0.15;
    for (const p of planes) p.material.opacity = filter ? 0.2 : 0.5;
    dust.position.y = instant ? 0 : Math.sin(elapsed * 0.12) * 0.1;

    renderer.render(scene, camera);
    first = false;
    if (dt > 0) fps = fps * 0.92 + (1 / dt) * 0.08;
  });

  const out: Projected[] = [];
  let resolveReady: () => void = () => {};
  const ready = new Promise<void>((resolve) => (resolveReady = resolve));
  requestAnimationFrame(() => requestAnimationFrame(() => resolveReady()));

  return {
    ready,
    pointer(x, y) {
      px = x;
      py = y;
      engine.invalidate(2);
    },
    project(list) {
      list.length = 0;
      // matrixWorldInverse is only refreshed by the renderer, so project with a fresh one.
      camera.updateMatrixWorld();
      camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
      const w = engine.size.width;
      const h = engine.size.height;
      for (const n of opts.nodes) {
        const v = { x: n.x, y: n.y, z: n.z };
        const p = projectPoint(camera, v, w, h);
        list.push({ id: n.id, x: p.x, y: p.y, depth: p.depth, visible: p.visible });
      }
      return out;
    },
    select(id) {
      selected = id ? (byId.get(id) ?? null) : null;
      engine.invalidate(3);
    },
    hover(id) {
      hovered = id;
      edgeMaterial.opacity = hovered ? 0.3 : 0.22;
      engine.invalidate(2);
    },
    filter(layer) {
      filter = layer;
      engine.invalidate(2);
    },
    stats: () => ({ fps: Math.round(fps), calls: renderer.info.render.calls, triangles: renderer.info.render.triangles }),
    dispose() {
      edgeGeometry.dispose();
      edgeMaterial.dispose();
      dustGeometry.dispose();
      (dust.material as PointsMaterial).dispose();
      for (const p of planes) {
        p.geometry.dispose();
        (p.material as LineBasicMaterial).dispose();
      }
      engine.dispose();
    },
  };
}

/** World point to CSS pixels on the canvas. */
function projectPoint(camera: PerspectiveCamera, v: { x: number; y: number; z: number }, w: number, h: number): { x: number; y: number; depth: number; visible: boolean } {
  const p = { x: v.x, y: v.y, z: v.z };
  const vec = { x: p.x, y: p.y, z: p.z };
  // Inline projection: avoids importing Vector3 in the hot loop.
  const e = camera.projectionMatrix.elements;
  const mv = camera.matrixWorldInverse.elements;
  const cx = mv[0]! * vec.x + mv[4]! * vec.y + mv[8]! * vec.z + mv[12]!;
  const cy = mv[1]! * vec.x + mv[5]! * vec.y + mv[9]! * vec.z + mv[13]!;
  const cz = mv[2]! * vec.x + mv[6]! * vec.y + mv[10]! * vec.z + mv[14]!;
  const cw = mv[3]! * vec.x + mv[7]! * vec.y + mv[11]! * vec.z + mv[15]!;
  const tx = e[0]! * cx + e[4]! * cy + e[8]! * cz + e[12]! * cw;
  const ty = e[1]! * cx + e[5]! * cy + e[9]! * cz + e[13]! * cw;
  const tw = e[3]! * cx + e[7]! * cy + e[11]! * cz + e[15]! * cw;
  const visible = tw > 0.0001;
  const ndcX = visible ? tx / tw : 0;
  const ndcY = visible ? ty / tw : 0;
  return { x: ((ndcX + 1) / 2) * w, y: ((1 - ndcY) / 2) * h, depth: Math.min(1, Math.max(0, (cw - 3) / 12)), visible };
}
