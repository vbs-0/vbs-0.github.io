/** Development-only viewer: /lab/?style=pbr|ink&theme=light|dark&explode=0..1&active=soc&yaw=deg&pitch=deg */
import { Color, DirectionalLight, OrthographicCamera, PMREMGenerator, PerspectiveCamera, Scene } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { PhonePartId } from '@/content/types';
import { createEngine } from '@/lib/three/engine';
import { degToRad } from '@/lib/three/math';
import { buildPhone } from '@/lib/three/phone/model';
import { PhoneRig } from '@/lib/three/phone/rig';
import { createScreen } from '@/lib/three/phone/screen';
import { dressInk } from '@/lib/three/phone/styles/ink';
import { dressPbr } from '@/lib/three/phone/styles/pbr';
import { frameOrthographic, framePerspective } from '@/lib/three/slots';
import { palettes } from '@/styles/palettes';

const q = new URLSearchParams(location.search);
const style = q.get('style') === 'ink' ? 'ink' : 'pbr';
const theme = q.get('theme') === 'dark' ? 'dark' : 'light';
const explode = Number(q.get('explode') ?? 0);
const active = (q.get('active') as PhonePartId | null) ?? null;
const fill = Number(q.get('fill') ?? 0.8);
const spin = q.get('spin') === '1';

const canvas = document.getElementById('c') as HTMLCanvasElement;
const pal = palettes[style === 'ink' ? 'manual' : 'phone'][theme];
const bare = q.get('bg') === 'none';
const noFocus = q.get('nofocus') === '1';
if (!bare) document.body.style.background = (style === 'ink' ? pal.paper : pal.bg) as string;
if (bare) (document.getElementById('hud') as HTMLElement).style.display = 'none';

const engine = createEngine(canvas, { maxDpr: 2, toneMapping: style === 'ink' ? 'none' : 'neutral' });
const scene = new Scene();
const model = buildPhone({ bevel: style === 'pbr' });
const rig = new PhoneRig(model);
scene.add(model.root);

const screen = createScreen(1);
screen.paint((ctx, w, h) => {
  ctx.fillStyle = style === 'ink' ? (pal.paper as string) : (pal.bg as string);
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = (style === 'ink' ? pal.ink : pal.text) as string;
  ctx.font = '700 44px system-ui, sans-serif';
  ctx.fillText('About vbs', 28, 150);
  for (let i = 0; i < 7; i++) {
    ctx.globalAlpha = 0.12;
    ctx.fillRect(22, 200 + i * 100, w - 44, 84);
    ctx.globalAlpha = 1;
  }
});

const D = 6;
const persp = new PerspectiveCamera(24, 1, D - 2.6, D + 2.6);
persp.position.set(0, 0, D);
const ortho = new OrthographicCamera(-1, 1, 1, -1, D - 2.6, D + 2.6);
ortho.position.set(0, 0, D);
const camera = style === 'ink' ? ortho : persp;

const ink = style === 'ink' ? dressInk(model, { ink: pal.ink as string, paper: pal.paper as string, shade: pal.shade as string, highlight: pal.highlight as string }, screen.texture) : undefined;
const pbr = style === 'pbr' ? dressPbr(model, screen.texture, { body: pal.phoneBody as string, frame: pal.phoneFrame as string, accent: pal.primary as string }) : undefined;

if (style === 'pbr') {
  const pmrem = new PMREMGenerator(engine.renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  pmrem.dispose();
  const key = new DirectionalLight(0xffffff, 1.2);
  key.position.set(-2, 3, 4);
  scene.add(key);
}
scene.background = null;
void Color;

rig.explode = explode;
rig.active = active;
rig.yaw = degToRad(Number(q.get('yaw') ?? (active ? (model.callouts[active].yaw * 180) / Math.PI : 28)));
rig.pitch = degToRad(Number(q.get('pitch') ?? (active ? (model.callouts[active].pitch * 180) / Math.PI : 10)));
rig.update(0.016, true);
rig.update(0.016, true);

engine.onResize((s) => {
  ink?.setResolution(s.width * s.dpr, s.height * s.dpr, s.dpr);
});
engine.onFrame((dt) => {
  if (spin) rig.yaw += dt * 0.5;
  rig.update(dt);
  if (noFocus) {
    for (const k of Object.keys(rig.focus) as (keyof typeof rig.focus)[]) rig.focus[k] = 0;
    rig.dim = 0;
  }
  ink?.update(rig);
  pbr?.update(rig);
  const s = engine.size;
  const subject = model.height + rig.explodedDepth() * rig.amount * 0.55;
  if (camera === persp) framePerspective(persp, s.width, s.height, s.width / 2, s.height / 2, s.height, subject, D, fill);
  else frameOrthographic(ortho, s.width, s.height, s.width / 2, s.height / 2, s.height, subject, fill);
  engine.renderer.render(scene, camera);
  (document.getElementById('hud') as HTMLElement).textContent = `${style} ${theme} frames ${engine.stats.frames}`;
  document.documentElement.dataset.ready = '1';
});
