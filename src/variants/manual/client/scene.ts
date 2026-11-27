/**
 * The Service manual's 3D drawing: the procedural phone in ink lines, seen through an orthographic
 * camera, following whichever slot is on screen. Loaded with a dynamic import after first paint.
 */
import { OrthographicCamera, Scene, Vector3 } from 'three';
import type { PhonePartId } from '@/content/types';
import type { Tier } from '@/lib/three/capabilities';
import { createEngine } from '@/lib/three/engine';
import { clamp01, damp, easeInOutCubic } from '@/lib/three/math';
import { buildPhone } from '@/lib/three/phone/model';
import { PhoneRig } from '@/lib/three/phone/rig';
import { createScreen } from '@/lib/three/phone/screen';
import { type InkColors, dressInk } from '@/lib/three/phone/styles/ink';
import { frameOrthographic, measureSlot } from '@/lib/three/slots';
import { type Theme, palettes } from '@/styles/palettes';

export interface ManualState {
  /** The slot the drawing should sit in, or null to draw nothing. */
  slot: Element | null;
  /** 0 assembled, 1 fully apart. */
  explode: number;
  active: PhonePartId | null;
}

export interface ManualScene {
  setTheme(theme: Theme): void;
  setState(state: ManualState): void;
  /** Where a callout's anchor is on screen, in CSS pixels of the viewport. */
  anchor(id: PhonePartId): { x: number; y: number };
  /** Runs after every rendered frame, for the leader line. */
  onAfterFrame(cb: () => void): void;
  /** Ask for a redraw (after a scroll, when rendering on demand). */
  invalidate(): void;
  dispose(): void;
}

export interface ManualSceneOptions {
  theme: Theme;
  reducedMotion: boolean;
  tier: Tier;
  onContextLost(): void;
  onContextRestored(): void;
}

const DISTANCE = 6;
/** Rough size of the drawing in world units, assembled and apart, used to fit it into a slot. */
const BOX = { assembled: { w: 1.05, h: 1.86 }, apart: { w: 2.5, h: 2.05 } };

function inkColors(theme: Theme): InkColors {
  const p = palettes.manual[theme];
  return { ink: p.ink as string, paper: p.paper as string, shade: p.shade as string, highlight: p.highlight as string };
}

export function createManualScene(canvas: HTMLCanvasElement, opts: ManualSceneOptions): ManualScene {
  const engine = createEngine(canvas, {
    maxDpr: opts.tier === 'low' ? 1.5 : 2,
    toneMapping: 'none',
    onContextLost: opts.onContextLost,
    onContextRestored: opts.onContextRestored,
  });
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, DISTANCE - 2.8, DISTANCE + 2.8);
  camera.position.set(0, 0, DISTANCE);

  const model = buildPhone({ bevel: false, detail: opts.tier === 'low' ? 'lite' : 'full' });
  const rig = new PhoneRig(model);
  scene.add(model.root);

  let theme = opts.theme;
  const screen = createScreen(1, 2);
  const paintScreen = () => {
    const p = palettes.manual[theme];
    screen.paint((ctx, w, h) => {
      ctx.fillStyle = p.paper as string;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = p.ink as string;
      ctx.fillStyle = p.ink as string;
      ctx.lineWidth = 3;
      // A wireframe of an interface: status marks, a title, and rows.
      ctx.fillRect(34, 40, 52, 10);
      ctx.fillRect(w - 110, 40, 22, 10);
      ctx.fillRect(w - 78, 40, 44, 10);
      ctx.font = '800 54px "Archivo Variable", system-ui, sans-serif';
      ctx.fillText('ABOUT VBS', 34, 168);
      ctx.strokeRect(34, 206, w - 68, 56);
      for (let i = 0; i < 6; i++) {
        const y = 300 + i * 104;
        ctx.strokeRect(34, y, w - 68, 84);
        ctx.fillRect(58, y + 26, 150 + ((i * 53) % 110), 9);
        ctx.globalAlpha = 0.45;
        ctx.fillRect(58, y + 50, 220 - ((i * 37) % 90), 7);
        ctx.globalAlpha = 1;
      }
    });
  };
  paintScreen();

  const ink = dressInk(model, inkColors(theme), screen.texture);

  let state: ManualState = { slot: null, explode: 0, active: null };
  const frame = { cx: 0, cy: 0, h: 1, w: 1, ready: false };
  let boxMix = 0;
  let reveal = opts.reducedMotion ? 1 : 0;
  let revealClock = 0;
  let visible = false;
  const after: (() => void)[] = [];
  const projected = new Vector3();

  engine.setContinuous(!opts.reducedMotion);
  engine.onResize((s) => ink.setResolution(s.width * s.dpr, s.height * s.dpr, s.dpr));

  engine.onFrame((dt, elapsed) => {
    const size = engine.size;
    const instant = opts.reducedMotion;

    // Follow the slot.
    if (state.slot) {
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
    } else {
      visible = false;
    }

    // Pose.
    rig.explode = state.explode;
    rig.active = state.explode > 0.5 ? state.active : null;
    const callout = rig.active ? model.callouts[rig.active] : state.explode > 0.5 ? model.callouts.display : undefined;
    if (callout) {
      rig.yaw = callout.yaw;
      rig.pitch = callout.pitch;
    } else {
      rig.yaw = 0.5 + (instant ? 0 : Math.sin(elapsed * 0.4) * 0.22);
      rig.pitch = 0.17;
    }
    rig.update(dt, instant);
    ink.update(rig);

    // The drawing draws itself once, the first time it is on screen.
    if (reveal < 1 && visible) {
      revealClock += dt;
      reveal = easeInOutCubic(clamp01(revealClock / 2.1));
      ink.setReveal(reveal);
    }

    if (!visible) {
      engine.renderer.clear();
      for (const cb of after) cb();
      return;
    }

    // Fit the drawing into the slot; it needs more room once it is apart.
    boxMix = damp(boxMix, rig.amount, instant ? 1e6 : 5, dt);
    const boxW = BOX.assembled.w + (BOX.apart.w - BOX.assembled.w) * boxMix;
    const boxH = BOX.assembled.h + (BOX.apart.h - BOX.assembled.h) * boxMix;
    const subject = Math.max(boxH, (boxW * frame.h) / Math.max(1, frame.w));
    frameOrthographic(camera, size.width, size.height, frame.cx, frame.cy, frame.h, subject, 0.94);
    engine.renderer.render(scene, camera);
    for (const cb of after) cb();
  });

  return {
    setTheme(next) {
      if (next === theme) return;
      theme = next;
      ink.setColors(inkColors(theme));
      paintScreen();
      engine.invalidate(3);
    },
    setState(next) {
      state = next;
      engine.invalidate(opts.reducedMotion ? 3 : 2);
    },
    anchor(id) {
      rig.anchorWorld(id, projected).project(camera);
      const rect = canvas.getBoundingClientRect();
      return { x: rect.left + ((projected.x + 1) / 2) * rect.width, y: rect.top + ((1 - projected.y) / 2) * rect.height };
    },
    onAfterFrame(cb) {
      after.push(cb);
    },
    invalidate() {
      engine.invalidate(2);
    },
    dispose() {
      ink.dispose();
      screen.dispose();
      engine.dispose();
    },
  };
}
