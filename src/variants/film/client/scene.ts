/**
 * Film's 3D: the procedural phone as a lit product shot, and one camera that dives into a different part
 * for each scene. The page passes a continuous shot index (0 is the main title, 1 to 6 the six layers);
 * the camera, the rig and the grade blend between neighbouring shots, so scrolling is the camera move.
 * Loaded with a dynamic import: during the countdown leader when there is one, otherwise once the page is idle.
 */
import {
  AdditiveBlending,
  AmbientLight,
  Color,
  DirectionalLight,
  Mesh,
  PMREMGenerator,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { PhonePartId } from '@/content/types';
import type { Tier } from '@/lib/three/capabilities';
import { createEngine } from '@/lib/three/engine';
import { damp, easeInOutCubic, lerp } from '@/lib/three/math';
import { buildPhone } from '@/lib/three/phone/model';
import { PhoneRig } from '@/lib/three/phone/rig';
import { createScreen } from '@/lib/three/phone/screen';
import { dressPbr } from '@/lib/three/phone/styles/pbr';
import { palettes } from '@/styles/palettes';
import { blend } from './timeline';

export interface FilmState {
  /** Continuous shot index: 0 is the main title, 1 to 6 the six layers, 2.5 halfway between two. */
  shot: number;
  /** How much of the set is on screen, 0 to 1. At 0 nothing is rendered. */
  presence: number;
  /** The grade of the scene on screen, as a hex colour. */
  grade: string;
  /** Pointer position, -1 to 1 on both axes, for a little parallax. */
  px: number;
  py: number;
}

export interface FilmStats {
  fps: number;
  ms: number;
  calls: number;
  triangles: number;
  dpr: number;
  level: string;
}

export interface FilmScene {
  set(next: Partial<FilmState>): void;
  /** Brings the lights up (true) or keeps the set dark (false), as under the leader. */
  lights(on: boolean): void;
  /** Resolves once the shaders are compiled and the first frame is on screen. */
  readonly ready: Promise<void>;
  stats(): FilmStats;
  dispose(): void;
}

export interface FilmSceneOptions {
  tier: Tier;
  reducedMotion: boolean;
  onContextLost(): void;
  onContextRestored(): void;
}

interface Shot {
  part: PhonePartId | null;
  explode: number;
  yaw: number;
  pitch: number;
  roll: number;
  dist: number;
  /** Where the subject sits on a wide screen, as a fraction of the width. */
  x: number;
}

/** The scenes in page order: the main title, then the part each layer of the stack lives in. */
const PARTS: (PhonePartId | null)[] = [null, 'display', 'antenna', 'board', 'camera', 'soc', 'battery'];
const DIST: Record<PhonePartId, number> = { display: 3.1, antenna: 2.15, board: 2.55, camera: 1.75, soc: 1.85, battery: 2.45 };

const glowVertex = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
// A soft pool of the scene's grade behind the subject, written premultiplied so the page shows through.
const glowFragment = `
uniform vec3 uGrade;
uniform vec2 uCenter;
uniform float uAspect;
uniform float uPower;
varying vec2 vUv;
void main() {
  vec2 p = vUv - uCenter;
  p.x *= uAspect;
  float g = exp(-dot(p, p) * 4.2) * uPower;
  gl_FragColor = vec4(uGrade * g, g);
}`;

/** sRGB components of a hex colour, for a shader that writes straight to the screen. */
function srgb(hex: string, out = new Vector3()): Vector3 {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  return out.set(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/** Gives the browser a frame between heavy steps, so nothing it is animating stalls. */
const pause = () => new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));

export async function createFilmScene(canvas: HTMLCanvasElement, opts: FilmSceneOptions): Promise<FilmScene> {
  let cheap = opts.tier === 'low';
  let level = 'full';
  const engine = createEngine(canvas, {
    maxDpr: opts.tier === 'low' ? 1.5 : 2,
    toneMapping: 'aces',
    onContextLost: opts.onContextLost,
    onContextRestored: opts.onContextRestored,
    // A device that cannot hold the frame rate loses the idle motion first, then renders on demand only.
    onDegrade: (next) => {
      cheap = true;
      level = next;
      engine.invalidate(3);
    },
  });
  const renderer = engine.renderer;
  renderer.toneMappingExposure = 1.05;
  const scene = new Scene();
  const camera = new PerspectiveCamera(26, 1, 0.05, 40);
  scene.add(camera);
  await pause();

  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.environmentIntensity = 0;

  // Three lights that travel with the camera: a key from above left, a graded rim from behind, a little fill.
  const key = new DirectionalLight(0xffffff, 0);
  const rim = new DirectionalLight(0xffffff, 0);
  const fill = new AmbientLight(0xffffff, 0);
  scene.add(key, key.target, rim, rim.target, fill);

  const pal = palettes.film.dark;
  await pause();
  const model = buildPhone({ bevel: true, detail: opts.tier === 'low' ? 'lite' : 'full' });
  const rig = new PhoneRig(model);
  rig.speed = { explode: 3.2, lift: 4.5, turn: 2.8, focus: 5 };
  scene.add(model.root);
  await pause();
  const screen = createScreen(1, opts.tier === 'low' ? 2 : 8);
  const pbr = dressPbr(model, screen.texture, { body: pal.phoneBody as string, frame: pal.phoneFrame as string, accent: pal.gTitle as string }, opts.tier);

  const paintScreen = () =>
    screen.paint((ctx, w, h) => {
      ctx.fillStyle = '#060607';
      ctx.fillRect(0, 0, w, h);
      const glow = ctx.createRadialGradient(w / 2, h * 0.44, 0, w / 2, h * 0.44, h * 0.55);
      glow.addColorStop(0, 'rgba(255, 236, 205, 0.12)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = pal.text as string;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.font = `400 ${Math.round(w * 0.38)}px 'League Gothic Variable', 'Arial Narrow', sans-serif`;
      ctx.fillText('VBS', w / 2, h * 0.5);
      ctx.font = `500 ${Math.round(w * 0.04)}px 'Jost Variable', sans-serif`;
      ctx.letterSpacing = `${Math.round(w * 0.012)}px`;
      ctx.fillStyle = pal.textMuted as string;
      ctx.fillText('SOFTWARE ENGINEER · AI/ML', w / 2, h * 0.565);
      ctx.fillStyle = pal.gTitle as string;
      ctx.fillRect(w * 0.42, h * 0.6, w * 0.16, 2);
    });
  paintScreen();

  const callouts = model.callouts;
  const shots: Shot[] = PARTS.map((part) =>
    part
      ? { part, explode: 1, yaw: callouts[part].yaw, pitch: callouts[part].pitch, roll: 0, dist: DIST[part], x: 0.67 }
      : { part: null, explode: 0, yaw: 0.52, pitch: 0.07, roll: -0.035, dist: 5.6, x: 0.71 },
  );

  const glowMaterial = new ShaderMaterial({
    uniforms: { uGrade: { value: new Vector3() }, uCenter: { value: new Vector2(0.7, 0.5) }, uAspect: { value: 1 }, uPower: { value: 0 } },
    vertexShader: glowVertex,
    fragmentShader: glowFragment,
    blending: AdditiveBlending,
    premultipliedAlpha: true,
    depthTest: false,
    depthWrite: false,
  });
  const glow = new Mesh(new PlaneGeometry(2, 2), glowMaterial);
  glow.frustumCulled = false;
  glow.renderOrder = -1;
  scene.add(glow);

  const state: FilmState = { shot: 0, presence: 1, grade: pal.gTitle as string, px: 0, py: 0 };
  const grade = new Color(state.grade);
  const gradeTarget = new Color(state.grade);
  const gradeSrgb = new Vector3();
  const target = new Vector3();
  const desired = new Vector3();
  const va = new Vector3();
  const vb = new Vector3();
  const right = new Vector3();
  const up = new Vector3();
  const forward = new Vector3();
  let dist = shots[0]?.dist ?? 5.6;
  let subjectX = 0.71;
  let lit = 0;
  let litTarget = 0;
  let first = true;
  let fpsAvg = 60;
  let drawn = false;
  let compiled = false;
  let resolveReady!: () => void;
  const ready = new Promise<void>((resolve) => { resolveReady = resolve; });

  engine.onFrame((dt, elapsed) => {
    if (!compiled) return;
    const instant = opts.reducedMotion || !drawn;
    const size = engine.size;
    const w = size.width;
    const h = size.height;
    // Matches the stylesheet: tall or narrow windows put the subject above the words; a short wide
    // window keeps it beside them, a little smaller and further right.
    const portrait = w / h <= 1 || w < 600;
    const short = !portrait && h < 640;

    if (state.presence < 0.004 && !first) {
      if (drawn) {
        renderer.clear();
        drawn = false;
      }
      engine.setContinuous(false);
      return;
    }
    engine.setContinuous(!opts.reducedMotion && level !== 'minimal');

    // Blend the two neighbouring shots. The part in focus changes halfway, so lifts never cross.
    const { a, b, t } = blend(state.shot, shots.length);
    const A = shots[a] as Shot;
    const B = shots[b] as Shot;
    const e = easeInOutCubic(t);
    const idle = opts.reducedMotion || cheap ? 0 : 1;
    rig.explode = lerp(A.explode, B.explode, e);
    rig.active = t < 0.5 ? A.part : B.part;
    rig.yaw = lerp(A.yaw, B.yaw, e) + idle * (Math.sin(elapsed * 0.33) * 0.07 + state.px * 0.12);
    rig.pitch = lerp(A.pitch, B.pitch, e) + idle * state.py * 0.07;
    rig.roll = lerp(A.roll, B.roll, e);
    rig.update(dt, instant);
    pbr.update(rig);

    // Aim at the part (the anchors move with the rig), from a little above and to the right of it.
    const ta = A.part ? rig.anchorWorld(A.part, va) : va.set(0, 0, 0);
    const tb = B.part ? rig.anchorWorld(B.part, vb) : vb.set(0, 0, 0);
    desired.lerpVectors(ta, tb, e);
    const k = instant ? 1e6 : 4.2;
    target.set(damp(target.x, desired.x, k, dt), damp(target.y, desired.y, k, dt), damp(target.z, desired.z, k, dt));
    const breathe = idle * Math.sin(elapsed * 0.27) * 0.04;
    const stand = portrait ? lerp(A.part ? 1.5 : 1.8, B.part ? 1.5 : 1.8, e) : short ? 1.22 : 1;
    dist = damp(dist, lerp(A.dist, B.dist, e) * stand + breathe, k, dt);
    subjectX = damp(subjectX, portrait ? 0.5 : lerp(A.x, B.x, e) + (short ? 0.05 : 0), k, dt);
    camera.fov = portrait ? 31 : 26;
    camera.position.set(target.x + dist * 0.06, target.y + dist * 0.035, target.z + dist);
    camera.lookAt(target);
    camera.updateMatrixWorld();

    // A lens shift puts the subject beside the titles instead of behind them.
    const cx = subjectX * w;
    const cy = (portrait ? lerp(A.part ? 0.29 : 0.235, B.part ? 0.29 : 0.235, e) : 0.5) * h;
    camera.aspect = w / h;
    camera.setViewOffset(w, h, w / 2 - cx, h / 2 - cy, w, h);
    camera.updateProjectionMatrix();

    // The lights travel with the camera; the rim takes the grade.
    lit = damp(lit, litTarget, instant ? 1e6 : 1.9, dt);
    gradeTarget.set(state.grade);
    grade.lerp(gradeTarget, instant ? 1 : 1 - Math.exp(-3 * dt));
    right.setFromMatrixColumn(camera.matrixWorld, 0);
    up.setFromMatrixColumn(camera.matrixWorld, 1);
    forward.subVectors(target, camera.position).normalize();
    key.position.copy(camera.position).addScaledVector(right, -1.7 * dist * 0.5).addScaledVector(up, 1.9 * dist * 0.5);
    key.target.position.copy(target);
    rim.position.copy(target).addScaledVector(forward, 2.4).addScaledVector(right, 1.9).addScaledVector(up, 0.7);
    rim.target.position.copy(target);
    key.intensity = 2.1 * lit;
    rim.intensity = 5.2 * lit;
    rim.color.copy(grade);
    fill.intensity = 0.14 * lit;
    scene.environmentIntensity = 0.42 * lit;

    const u = glowMaterial.uniforms;
    srgb(`#${grade.getHexString()}`, gradeSrgb);
    (u.uGrade as { value: Vector3 }).value.copy(gradeSrgb);
    (u.uCenter as { value: Vector2 }).value.set(cx / w, 1 - cy / h);
    (u.uAspect as { value: number }).value = w / h;
    (u.uPower as { value: number }).value = 0.3 * lit * state.presence;

    renderer.render(scene, camera);
    drawn = true;
    if (first) {
      first = false;
      resolveReady();
    }
    if (dt > 0) fpsAvg = lerp(fpsAvg, 1 / dt, 0.08);
  });

  // Compilation alone doesn't upload geometry and textures. Warm one real frame off-camera
  // before parking the set; otherwise the first interior cut pays the driver's first-draw cost.
  void Promise.resolve()
    .then(() => (document.fonts?.ready ?? Promise.resolve()).then(() => paintScreen()))
    .then(() => renderer.compileAsync?.(scene, camera))
    .catch(() => undefined)
    .then(() => {
      compiled = true;
      engine.invalidate(3);
    });

  return {
    ready,
    set(next) {
      Object.assign(state, next);
      engine.invalidate(2);
    },
    lights(on) {
      litTarget = on ? 1 : 0;
      engine.invalidate(4);
      if (opts.reducedMotion) engine.invalidate(2);
    },
    stats() {
      const info = renderer.info.render;
      return { fps: Math.round(fpsAvg), ms: Math.round(engine.stats.lastFrameMs * 10) / 10, calls: info.calls, triangles: info.triangles, dpr: renderer.getPixelRatio(), level };
    },
    dispose() {
      pbr.dispose();
      screen.dispose();
      glow.geometry.dispose();
      glowMaterial.dispose();
      engine.dispose();
    },
  };
}
