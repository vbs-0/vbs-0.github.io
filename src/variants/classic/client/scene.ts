/**
 * Classic's 3D: a stack of six iridescent glass slabs, one per layer, and a skyline built from the
 * contribution calendar. One renderer, two subjects; whichever slot is on screen gets drawn.
 */
import {
  BoxGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  DoubleSide,
  EdgesGeometry,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PMREMGenerator,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  SRGBColorSpace,
  Scene,
  Vector2,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { LayerId } from '@/content/types';
import type { Tier } from '@/lib/three/capabilities';
import { createEngine } from '@/lib/three/engine';
import { damp } from '@/lib/three/math';
import { framePerspective, measureSlot } from '@/lib/three/slots';

export interface StackLayer {
  id: LayerId;
  name: string;
  color: string;
}

export interface ClassicState {
  /** Which subject to draw, and where. */
  subject: 'stack' | 'skyline' | null;
  slot: Element | null;
  /** 0 closed stack, 1 opened so each slab can be read. */
  open: number;
  selected: LayerId | null;
}

export interface ClassicScene {
  setState(state: ClassicState): void;
  /** The layer under a viewport point, for hover and click. */
  pick(clientX: number, clientY: number): LayerId | null;
  invalidate(): void;
  dispose(): void;
}

export interface ClassicSceneOptions {
  layers: StackLayer[];
  /** Contribution levels (0 to 4) and counts, week by week, Sunday first; null pads the edges. */
  weeks: ({ level: number; count: number } | null)[][];
  accent: string;
  reducedMotion: boolean;
  tier: Tier;
  onContextLost(): void;
  onContextRestored(): void;
}

const DISTANCE = 7;
const SLAB = { size: 1.5, thick: 0.085, closed: 0.07, opened: 0.3 };

function labelTexture(text: string, color: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.clearRect(0, 0, 1024, 1024);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.font = '800 92px "Mona Sans Variable", system-ui, sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text.toUpperCase(), 84, 930);
  // Registration marks in the corners, like an etched wafer.
  for (const [x, y] of [[84, 84], [940, 84], [940, 800]] as const) {
    ctx.beginPath();
    ctx.moveTo(x - 30, y);
    ctx.lineTo(x + 30, y);
    ctx.moveTo(x, y - 30);
    ctx.lineTo(x, y + 30);
    ctx.stroke();
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function createClassicScene(canvas: HTMLCanvasElement, opts: ClassicSceneOptions): ClassicScene {
  const engine = createEngine(canvas, { maxDpr: opts.tier === 'low' ? 1.5 : 2, toneMapping: 'aces', onContextLost: opts.onContextLost, onContextRestored: opts.onContextRestored });
  const renderer = engine.renderer;
  const scene = new Scene();
  const camera = new PerspectiveCamera(26, 1, DISTANCE - 4, DISTANCE + 4);
  camera.position.set(0, 0, DISTANCE);

  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.02).texture;
  pmrem.dispose();
  const key = new DirectionalLight(new Color(opts.accent), 2.2);
  key.position.set(3, 4, 5);
  const rim = new DirectionalLight(0x7fb0ff, 1.6);
  rim.position.set(-4, 1, -3);
  scene.add(key, rim);

  // ── The stack ────────────────────────────────────────────────────────────
  const stack = new Group();
  stack.rotation.set(0.42, -0.62, 0);
  scene.add(stack);
  const high = opts.tier === 'high';
  const slabGeo = new RoundedBoxGeometry(SLAB.size, SLAB.thick, SLAB.size, high ? 4 : 2, 0.03);
  const edgeGeo = new EdgesGeometry(new BoxGeometry(SLAB.size, SLAB.thick, SLAB.size));
  const labelGeo = new PlaneGeometry(SLAB.size, SLAB.size);
  labelGeo.rotateX(-Math.PI / 2);
  const slabs = opts.layers.map((layer, i) => {
    const color = new Color(layer.color);
    const glass = new MeshPhysicalMaterial({
      color,
      roughness: 0.08,
      metalness: 0,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      side: DoubleSide,
      envMapIntensity: 1.5,
      clearcoat: high ? 1 : 0,
      clearcoatRoughness: 0.06,
      iridescence: high ? 1 : 0,
      iridescenceIOR: 1.35,
      iridescenceThicknessMinimum: 140,
      iridescenceThicknessMaximum: 380 + i * 70,
    });
    const mesh = new Mesh(slabGeo, glass);
    mesh.userData.layer = layer.id;
    const edges = new LineSegments(edgeGeo, new LineBasicMaterial({ color, transparent: true, opacity: 0.9 }));
    const label = new Mesh(labelGeo, new MeshBasicMaterial({ map: labelTexture(layer.name, layer.color), transparent: true, depthWrite: false, toneMapped: false, opacity: 0.95 }));
    label.position.y = SLAB.thick / 2 + 0.002;
    const group = new Group();
    group.add(mesh, edges, label);
    stack.add(group);
    return { layer, group, mesh, glass, edges, label, focus: 0, y: 0 };
  });
  // Labels are painted before the web font is ready; repaint once it is.
  void document.fonts?.ready.then(() => {
    for (const s of slabs) {
      const m = s.label.material as MeshBasicMaterial;
      m.map?.dispose();
      m.map = labelTexture(s.layer.name, s.layer.color);
      m.needsUpdate = true;
    }
    engine.invalidate(2);
  });

  // ── The skyline ──────────────────────────────────────────────────────────
  const skyline = new Group();
  skyline.rotation.set(0.62, -0.5, 0);
  scene.add(skyline);
  const cols = opts.weeks.length;
  const cell = 0.062;
  const gap = 0.012;
  const cells = opts.weeks.flatMap((week, x) => week.map((d, y) => (d ? { x, y, ...d } : null))).filter((c) => c !== null);
  const maxCount = Math.max(1, ...cells.map((c) => c.count));
  const bars = new InstancedMesh(new BoxGeometry(cell, 1, cell), new MeshStandardMaterial({ roughness: 0.3, metalness: 0.55 }), cells.length);
  const dummy = new Object3D();
  const cold = new Color(0x27304a);
  const hot = new Color(opts.accent);
  const tint = new Color();
  const span = cols * (cell + gap);
  const heights = cells.map((c) => (c.count === 0 ? 0.012 : 0.03 + Math.sqrt(c.count / maxCount) * 0.52));
  cells.forEach((c, i) => {
    bars.setColorAt(i, tint.copy(cold).lerp(hot, c.level / 4));
  });
  skyline.add(bars);
  const plate = new Mesh(new BoxGeometry(span + 0.12, 0.03, 7 * (cell + gap) + 0.12), new MeshStandardMaterial({ color: 0x141a2b, roughness: 0.5, metalness: 0.4 }));
  plate.position.y = -0.015;
  skyline.add(plate);
  let rise = 0;
  const layoutBars = () => {
    cells.forEach((c, i) => {
      const h = Math.max(0.012, (heights[i] as number) * rise);
      dummy.position.set((c.x + 0.5) * (cell + gap) - span / 2, h / 2, (c.y - 3) * (cell + gap));
      dummy.scale.set(1, h, 1);
      dummy.updateMatrix();
      bars.setMatrixAt(i, dummy.matrix);
    });
    bars.instanceMatrix.needsUpdate = true;
  };
  layoutBars();

  let state: ClassicState = { subject: null, slot: null, open: 0, selected: null };
  const frame = { cx: 0, cy: 0, w: 1, h: 1, ready: false };
  let open = 0;
  let visible = false;
  const raycaster = new Raycaster();
  const pointer = new Vector2();

  engine.setContinuous(!opts.reducedMotion);
  engine.onFrame((dt, elapsed) => {
    const size = engine.size;
    const instant = opts.reducedMotion;
    if (state.slot && state.subject) {
      const m = measureSlot(state.slot, canvas);
      visible = m.visible > 0.01 && m.width > 4;
      if (visible) {
        const k = frame.ready && !instant ? 7 : 1e6;
        frame.cx = damp(frame.cx, m.cx, k, dt);
        frame.cy = damp(frame.cy, m.cy, k, dt);
        frame.w = damp(frame.w, m.width, k, dt);
        frame.h = damp(frame.h, m.height, k, dt);
        frame.ready = true;
      }
    } else visible = false;

    stack.visible = state.subject === 'stack';
    skyline.visible = state.subject === 'skyline';
    if (!visible) {
      renderer.clear();
      return;
    }

    let subject = 2.2;
    if (state.subject === 'stack') {
      open = damp(open, state.open, instant ? 1e6 : 4, dt);
      const pitch = SLAB.thick + SLAB.closed + (SLAB.opened - SLAB.closed) * open;
      const top = ((slabs.length - 1) * pitch) / 2;
      slabs.forEach((s, i) => {
        const target = state.selected === s.layer.id ? 1 : 0;
        s.focus = damp(s.focus, target, instant ? 1e6 : 8, dt);
        const dimmed = state.selected && target === 0 ? 1 : 0;
        s.group.position.y = top - i * pitch;
        s.group.position.x = s.focus * 0.16;
        s.glass.opacity = 0.4 + s.focus * 0.32 - dimmed * 0.24;
        s.glass.emissive.copy(s.glass.color);
        s.glass.emissiveIntensity = s.focus * 0.5;
        (s.edges.material as LineBasicMaterial).opacity = 0.9 - dimmed * 0.6;
        (s.label.material as MeshBasicMaterial).opacity = 0.95 - dimmed * 0.7;
      });
      if (!instant) stack.rotation.y = -0.62 + Math.sin(elapsed * 0.3) * 0.2;
      const height = slabs.length * pitch + 0.9;
      subject = Math.max(height, (2.5 * frame.h) / Math.max(1, frame.w));
    } else {
      if (rise < 1) {
        rise = Math.min(1, rise + (instant ? 1 : dt * 0.9));
        layoutBars();
      }
      if (!instant) skyline.rotation.y = -0.5 + Math.sin(elapsed * 0.25) * 0.16;
      subject = Math.max(1.5, ((span + 0.6) * frame.h) / Math.max(1, frame.w));
    }
    framePerspective(camera, size.width, size.height, frame.cx, frame.cy, frame.h, subject, DISTANCE, 0.92);
    renderer.render(scene, camera);
  });

  return {
    setState(next) {
      state = next;
      engine.invalidate(opts.reducedMotion ? 3 : 2);
    },
    pick(clientX, clientY) {
      if (state.subject !== 'stack' || !visible) return null;
      const rect = canvas.getBoundingClientRect();
      pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      stack.updateMatrixWorld(true);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(slabs.map((s) => s.mesh), false)[0];
      return hit ? (hit.object.userData.layer as LayerId) : null;
    },
    invalidate() {
      engine.invalidate(2);
    },
    dispose() {
      engine.dispose();
    },
  };
}
