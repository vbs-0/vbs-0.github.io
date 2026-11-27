/**
 * About phone's 3D device: the procedural phone as a product render, following whichever slot is on
 * screen. Its display shows a miniature of the page, or the selected app. Loaded after first paint.
 */
import {
  AdditiveBlending,
  Box3,
  Box3Helper,
  Color,
  DirectionalLight,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PMREMGenerator,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  WebGLRenderTarget,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { PhonePartId } from '@/content/types';
import type { Tier } from '@/lib/three/capabilities';
import { createEngine } from '@/lib/three/engine';
import { damp } from '@/lib/three/math';
import { PART_ORDER, buildPhone } from '@/lib/three/phone/model';
import { PhoneRig } from '@/lib/three/phone/rig';
import { createScreen } from '@/lib/three/phone/screen';
import { dressPbr } from '@/lib/three/phone/styles/pbr';
import { framePerspective, measureSlot } from '@/lib/three/slots';
import { type Palette, type Theme, palettes } from '@/styles/palettes';

export interface AppOnScreen {
  name: string;
  metric: string;
  /** URL of a phone screenshot, or '' when the app has none. */
  screen: string;
}

export interface PhoneState {
  slot: Element | null;
  /** The selected hardware part; the phone comes apart while one is selected. */
  active: PhonePartId | null;
  /** The app whose info page is open. */
  app: AppOnScreen | null;
  /** Page scroll position, 0 to 1, mirrored on the phone's display. */
  scroll: number;
}

export interface PhoneScene {
  setTheme(theme: Theme): void;
  setState(state: PhoneState): void;
  /** Labels of the rows on the page, for the miniature on the display. */
  setRows(rows: string[]): void;
  /** Animator duration scale: 1 is normal, 0 switches motion off. */
  setMotionScale(scale: number): void;
  setBounds(on: boolean): void;
  setOverdraw(on: boolean): void;
  /** Horizontal drag, in pixels, turns the phone. */
  nudge(dx: number): void;
  frameMs(): number;
  onAfterFrame(cb: () => void): void;
  dispose(): void;
}

export interface PhoneSceneOptions {
  theme: Theme;
  reducedMotion: boolean;
  tier: Tier;
  onContextLost(): void;
  onContextRestored(): void;
}

const DISTANCE = 6;
const BOX = { assembled: { w: 0.98, h: 1.84 }, apart: { w: 2.5, h: 2.05 } };

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

/** The miniature Settings screen. It scrolls with the page. */
function paintHome(ctx: CanvasRenderingContext2D, w: number, h: number, p: Palette, rows: string[], scroll: number): void {
  ctx.fillStyle = p.bg as string;
  ctx.fillRect(0, 0, w, h);
  const rowH = 86;
  const contentH = 250 + rows.length * (rowH + 4) + Math.ceil(rows.length / 4) * 34;
  const offset = scroll * Math.max(0, contentH - h + 40);
  ctx.save();
  ctx.translate(0, -offset);
  ctx.fillStyle = p.text as string;
  ctx.font = '650 60px "Roboto Flex Variable", system-ui, sans-serif';
  ctx.fillText('About vbs', 30, 196);
  let y = 250;
  rows.forEach((label, i) => {
    if (i > 0 && i % 4 === 0) y += 34;
    ctx.fillStyle = p.surface as string;
    rounded(ctx, 20, y, w - 40, rowH, i % 4 === 0 ? 26 : 8);
    ctx.fillStyle = p.text as string;
    ctx.font = '500 25px "Roboto Flex Variable", system-ui, sans-serif';
    ctx.fillText(label.length > 26 ? `${label.slice(0, 25)}…` : label, 44, y + 38);
    ctx.fillStyle = p.textMuted as string;
    ctx.globalAlpha = 0.5;
    rounded(ctx, 44, y + 54, 120 + ((i * 47) % 150), 9, 5);
    ctx.globalAlpha = 1;
    y += rowH + 4;
  });
  ctx.restore();
  // Status bar, drawn last so the content scrolls under it.
  ctx.fillStyle = p.bg as string;
  ctx.fillRect(0, 0, w, 62);
  ctx.fillStyle = p.text as string;
  ctx.font = '600 22px "Roboto Flex Variable", system-ui, sans-serif';
  const now = new Date();
  ctx.fillText(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`, 32, 42);
  rounded(ctx, w - 78, 26, 44, 20, 6);
  ctx.beginPath();
  ctx.arc(w / 2, 34, 9, 0, Math.PI * 2);
  ctx.fill();
}

function paintApp(ctx: CanvasRenderingContext2D, w: number, h: number, p: Palette, app: AppOnScreen, image: HTMLImageElement | undefined): void {
  ctx.fillStyle = p.bg as string;
  ctx.fillRect(0, 0, w, h);
  if (image && image.complete && image.naturalWidth > 0) {
    const scale = w / image.naturalWidth;
    ctx.drawImage(image, 0, 0, w, image.naturalHeight * scale);
    return;
  }
  ctx.fillStyle = p.primaryContainer as string;
  rounded(ctx, w / 2 - 80, 250, 160, 160, 46);
  ctx.fillStyle = p.onPrimaryContainer as string;
  ctx.textAlign = 'center';
  ctx.font = '650 92px "Roboto Flex Variable", system-ui, sans-serif';
  ctx.fillText(app.name.slice(0, 1).toUpperCase(), w / 2, 362);
  ctx.fillStyle = p.text as string;
  ctx.font = '620 40px "Roboto Flex Variable", system-ui, sans-serif';
  const words = app.name.split(' ');
  const lines: string[] = [];
  for (const word of words) {
    const last = lines[lines.length - 1];
    if (last !== undefined && ctx.measureText(`${last} ${word}`).width < w - 70) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  lines.forEach((l, i) => ctx.fillText(l, w / 2, 492 + i * 50));
  if (app.metric) {
    ctx.fillStyle = p.primary as string;
    ctx.font = '600 58px "Roboto Mono Variable", ui-monospace, monospace';
    ctx.fillText(app.metric, w / 2, 540 + lines.length * 50 + 60);
  }
  ctx.textAlign = 'start';
}

const overdrawFragment = /* glsl */ `
uniform sampler2D tCount;
varying vec2 vUv;
void main() {
  float n = floor(texture2D(tCount, vUv).r * 8.0 + 0.5);
  if (n < 0.5) discard;
  vec3 c = n < 1.5 ? vec3(0.33, 0.50, 0.96) : n < 2.5 ? vec3(0.30, 0.78, 0.42) : n < 3.5 ? vec3(0.97, 0.55, 0.74) : vec3(0.93, 0.27, 0.25);
  gl_FragColor = vec4(c, 0.94);
  #include <colorspace_fragment>
}`;

export function createPhoneScene(canvas: HTMLCanvasElement, opts: PhoneSceneOptions): PhoneScene {
  const engine = createEngine(canvas, { maxDpr: opts.tier === 'low' ? 1.5 : 2, toneMapping: 'neutral', onContextLost: opts.onContextLost, onContextRestored: opts.onContextRestored });
  const renderer = engine.renderer;
  const scene = new Scene();
  const camera = new PerspectiveCamera(24, 1, DISTANCE - 2.8, DISTANCE + 2.8);
  camera.position.set(0, 0, DISTANCE);

  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  pmrem.dispose();
  const key = new DirectionalLight(0xffffff, 1.4);
  key.position.set(-2.5, 3, 4);
  scene.add(key);

  let theme = opts.theme;
  const pal = () => palettes.phone[theme];
  const colors = () => ({ body: pal().phoneBody as string, frame: pal().phoneFrame as string, accent: pal().primary as string });

  const model = buildPhone({ bevel: true, detail: opts.tier === 'low' ? 'lite' : 'full' });
  const rig = new PhoneRig(model);
  scene.add(model.root);
  const screen = createScreen(1, opts.tier === 'low' ? 2 : 8);
  const pbr = dressPbr(model, screen.texture, colors(), opts.tier);

  let state: PhoneState = { slot: null, active: null, app: null, scroll: 0 };
  let rows: string[] = [];
  let motion = opts.reducedMotion ? 0 : 1;
  let appImage: HTMLImageElement | undefined;
  let painted = '';
  const frame = { cx: 0, cy: 0, w: 1, h: 1, ready: false };
  let boxMix = 0;
  let visible = false;
  let drag = 0;
  const after: (() => void)[] = [];

  const paint = () => {
    const signature = `${theme}|${state.app?.name ?? ''}|${appImage?.complete ? 1 : 0}|${state.scroll.toFixed(3)}|${rows.length}|${new Date().getMinutes()}`;
    if (signature === painted) return;
    painted = signature;
    const app = state.app;
    screen.paint((ctx, w, h) => (app ? paintApp(ctx, w, h, pal(), app, appImage) : paintHome(ctx, w, h, pal(), rows, state.scroll)));
  };
  void document.fonts?.ready.then(() => {
    painted = '';
    engine.invalidate(2);
  });

  // Debug views for Developer options.
  let bounds = false;
  const helpers: Box3Helper[] = [];
  let overdraw = false;
  const countTarget = new WebGLRenderTarget(1, 1);
  const countMaterial = new MeshBasicMaterial({ color: new Color(0.125, 0, 0), blending: AdditiveBlending, depthTest: false, depthWrite: false, transparent: true });
  const quadScene = new Scene();
  const quadCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new Mesh(
    new PlaneGeometry(2, 2),
    new ShaderMaterial({
      uniforms: { tCount: { value: countTarget.texture } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: overdrawFragment,
      transparent: true,
      depthTest: false,
    }),
  );
  quadScene.add(quad);

  const applyMotion = () => {
    engine.setContinuous(motion > 0);
    const k = motion > 0 ? 1 / motion : 1;
    rig.speed = { explode: 4.5 * k, lift: 6 * k, turn: 3.6 * k, focus: 7 * k };
  };
  applyMotion();
  engine.onResize((s) => countTarget.setSize(Math.round(s.width * s.dpr), Math.round(s.height * s.dpr)));

  engine.onFrame((dt, elapsed) => {
    const size = engine.size;
    const instant = motion === 0;

    if (state.slot) {
      const m = measureSlot(state.slot, canvas);
      visible = m.visible > 0.01 && m.width > 4;
      if (visible) {
        const k = frame.ready && !instant ? 8 : 1e6;
        frame.cx = damp(frame.cx, m.cx, k, dt);
        frame.cy = damp(frame.cy, m.cy, k, dt);
        frame.w = damp(frame.w, m.width, k, dt);
        frame.h = damp(frame.h, m.height, k, dt);
        frame.ready = true;
      }
    } else visible = false;

    const callout = state.active && !state.app ? model.callouts[state.active] : undefined;
    rig.explode = callout ? 1 : 0;
    rig.active = callout ? state.active : null;
    drag = damp(drag, 0, instant ? 1e6 : 1.6, dt);
    const sway = instant ? 0 : Math.sin(elapsed * 0.5 * motion) * 0.14;
    if (callout) {
      rig.yaw = callout.yaw + drag;
      rig.pitch = callout.pitch;
    } else if (state.app) {
      rig.yaw = 0.16 + sway * 0.5 + drag;
      rig.pitch = 0.04;
    } else {
      rig.yaw = 0.42 + sway + drag;
      rig.pitch = 0.1;
    }
    model.root.position.y = instant ? 0 : Math.sin(elapsed * 0.8 * motion) * 0.012;
    rig.update(dt, instant);
    pbr.update(rig);
    paint();

    if (!visible) {
      renderer.clear();
      for (const cb of after) cb();
      return;
    }
    boxMix = damp(boxMix, rig.amount, instant ? 1e6 : 5, dt);
    const boxW = BOX.assembled.w + (BOX.apart.w - BOX.assembled.w) * boxMix;
    const boxH = BOX.assembled.h + (BOX.apart.h - BOX.assembled.h) * boxMix;
    const subject = Math.max(boxH, (boxW * frame.h) / Math.max(1, frame.w));
    framePerspective(camera, size.width, size.height, frame.cx, frame.cy, frame.h, subject, DISTANCE, 0.9);

    if (bounds) for (const [i, name] of PART_ORDER.entries()) helpers[i]?.box.setFromObject(model.parts[name].group);
    if (overdraw) {
      scene.overrideMaterial = countMaterial;
      renderer.setRenderTarget(countTarget);
      renderer.setClearColor(0x000000, 1);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.setClearColor(0x000000, 0);
      scene.overrideMaterial = null;
      renderer.clear();
      renderer.render(quadScene, quadCamera);
    } else {
      renderer.render(scene, camera);
    }
    for (const cb of after) cb();
  });

  return {
    setTheme(next) {
      if (next === theme) return;
      theme = next;
      pbr.setColors(colors());
      painted = '';
      engine.invalidate(3);
    },
    setState(next) {
      if (next.app?.screen !== state.app?.screen) {
        appImage = undefined;
        if (next.app?.screen) {
          const img = new Image();
          img.decoding = 'async';
          img.onload = () => {
            painted = '';
            engine.invalidate(2);
          };
          img.src = next.app.screen;
          appImage = img;
        }
      }
      state = next;
      engine.invalidate(2);
    },
    setRows(next) {
      rows = next;
      painted = '';
      engine.invalidate(2);
    },
    setMotionScale(scale) {
      motion = scale;
      applyMotion();
      engine.invalidate(3);
    },
    setBounds(on) {
      bounds = on;
      pbr.setWireframe(on);
      if (on && helpers.length === 0) {
        for (const _ of PART_ORDER) {
          const helper = new Box3Helper(new Box3(), new Color(0x2a6eff));
          helpers.push(helper);
          scene.add(helper);
        }
      }
      for (const h of helpers) h.visible = on;
      engine.invalidate(3);
    },
    setOverdraw(on) {
      overdraw = on;
      engine.invalidate(3);
    },
    nudge(dx) {
      drag = Math.max(-1.4, Math.min(1.4, drag + dx * 0.012));
      engine.invalidate(2);
    },
    frameMs: () => engine.stats.lastFrameMs,
    onAfterFrame(cb) {
      after.push(cb);
    },
    dispose() {
      pbr.dispose();
      screen.dispose();
      countTarget.dispose();
      engine.dispose();
    },
  };
}
