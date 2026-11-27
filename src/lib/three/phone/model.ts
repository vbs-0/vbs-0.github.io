/**
 * The procedural phone. No downloaded model: every part is built from rounded slabs, boxes and discs.
 *
 * `buildPhone` returns geometry grouped by part plus a material key per piece. It knows nothing about
 * how the phone is drawn: the About phone build dresses it in PBR materials, the Service manual build
 * in ink lines. Both get the same parts, callout anchors and explode distances.
 */
import { type BufferGeometry, Group, Vector3 } from 'three';
import type { PhonePartId } from '@/content/types';
import { degToRad, seededRandom } from '../math';
import { BACK, BATTERY, BOARD, CAMERA, DISPLAY, EXPLODE, FRAME, GLASS, LIFT, PHONE, SUBBOARD, Z_BACK, Z_FRONT } from './dimensions';
import { box, discY, discZ, panel, slab } from './shapes';

export type PartName = 'glass' | 'display' | 'frame' | 'board' | 'shield' | 'soc' | 'camera' | 'battery' | 'subboard' | 'back';

export type MaterialKey =
  | 'glass'
  | 'screen'
  | 'bezel'
  | 'frame'
  | 'antenna'
  | 'button'
  | 'port'
  | 'plate'
  | 'pcb'
  | 'chip'
  | 'soc'
  | 'chipMark'
  | 'shield'
  | 'connector'
  | 'passive'
  | 'battery'
  | 'batteryLabel'
  | 'tab'
  | 'flex'
  | 'cameraBody'
  | 'lensBarrel'
  | 'lensGlass'
  | 'lensRing'
  | 'flash'
  | 'back'
  | 'island'
  | 'speaker'
  | 'motor';

export interface PhoneItem {
  name: string;
  part: PartName;
  material: MaterialKey;
  geometry: BufferGeometry;
}

export interface PhonePart {
  name: PartName;
  /** Child of the model root. Moves along Z when the phone is taken apart. */
  group: Group;
  /** Z travel in millimetres at full explode. */
  explodeZ: number;
  items: PhoneItem[];
}

export interface Callout {
  id: PhonePartId;
  /** The part the leader line points at. */
  part: PartName;
  /** Anchor in the part's own coordinates (millimetres). */
  anchor: Vector3;
  /** Parts that light up when this callout is selected. */
  highlight: PartName[];
  /** Extra Z travel, per part, while this callout is selected: the shield lifts clear of the chip. */
  lift: Partial<Record<PartName, number>>;
  /** Sideways travel (X, millimetres) for parts that would block the view: the back cover is set aside. */
  aside: Partial<Record<PartName, number>>;
  /** Turn (about Y) and tilt (about X) of the whole phone, in radians, that present this part to the viewer. */
  yaw: number;
  pitch: number;
}

export interface PhoneModel {
  /** Scaled so the phone is `PHONE.height * PHONE.scale` world units tall. */
  root: Group;
  parts: Record<PartName, PhonePart>;
  items: PhoneItem[];
  callouts: Record<PhonePartId, Callout>;
  /** Total height in world units, for camera framing. */
  height: number;
}

export interface BuildOptions {
  /** Rounded edges. On for the PBR render, off for the ink drawing, where a bevel would double every line. */
  bevel?: boolean;
  /** `lite` drops the small components for weak devices. */
  detail?: 'full' | 'lite';
}

export const PART_ORDER: PartName[] = ['glass', 'display', 'frame', 'board', 'shield', 'soc', 'camera', 'battery', 'subboard', 'back'];
export const CALLOUT_ORDER: PhonePartId[] = ['display', 'antenna', 'board', 'soc', 'camera', 'battery'];

const { width: W, height: H, corner: R } = PHONE;

export function buildPhone(options: BuildOptions = {}): PhoneModel {
  const bevel = options.bevel ?? true;
  const full = (options.detail ?? 'full') === 'full';
  const seg = full ? 10 : 6;
  const round = full ? 28 : 16;
  const b = (size: number) => (bevel ? size : 0);

  const items: PhoneItem[] = [];
  const add = (part: PartName, material: MaterialKey, name: string, geometry: BufferGeometry) => {
    items.push({ part, material, name, geometry });
  };

  // ── Cover glass ────────────────────────────────────────────────────────────
  const glassZ0 = Z_FRONT - GLASS.thickness;
  add('glass', 'glass', 'cover glass', slab(W - 2 * GLASS.inset, H - 2 * GLASS.inset, R - GLASS.inset, GLASS.thickness, glassZ0, { bevel: b(0.25), curveSegments: seg }));

  // ── Display ────────────────────────────────────────────────────────────────
  const dispW = W - 2 * DISPLAY.inset;
  const dispH = H - 2 * DISPLAY.inset;
  const dispZ0 = glassZ0 - DISPLAY.thickness;
  add('display', 'bezel', 'display panel', slab(dispW, dispH, R - DISPLAY.inset, DISPLAY.thickness, dispZ0, { curveSegments: seg }));
  const screenW = dispW - 2 * DISPLAY.bezel;
  const screenH = dispH - DISPLAY.bezel - DISPLAY.chin;
  const screen = panel(screenW, screenH, R - DISPLAY.inset - DISPLAY.bezel, glassZ0 + 0.02, seg);
  screen.translate(0, (DISPLAY.chin - DISPLAY.bezel) / 2, 0);
  add('display', 'screen', 'screen', screen);
  add('display', 'flex', 'display flex', box(0, -dispH / 2 + 7, dispZ0 - 0.14, 18, 9, 0.24));

  // ── Mid-frame ──────────────────────────────────────────────────────────────
  const innerW = W - 2 * FRAME.wall;
  const innerH = H - 2 * FRAME.wall;
  const innerR = R - FRAME.wall;
  add('frame', 'frame', 'frame', slab(W, H, R, FRAME.depth, -FRAME.depth / 2, { bevel: b(0.5), curveSegments: seg, hole: { w: innerW, h: innerH, r: innerR } }));
  const plateZ0 = dispZ0 - 0.3 - FRAME.plate;
  add('frame', 'plate', 'mid-plate', slab(innerW, innerH, innerR, FRAME.plate, plateZ0, { curveSegments: seg }));
  // Antenna bands: plastic breaks in the top and bottom walls.
  for (const sy of [1, -1]) for (const sx of [1, -1]) {
    add('frame', 'antenna', 'antenna band', box(sx * 20, sy * (H / 2 - FRAME.wall / 2), 0, 1.5, FRAME.wall + 0.06, FRAME.depth + 0.06));
  }
  add('frame', 'button', 'power button', box(W / 2 + 0.22, 22, 0.3, 0.9, 12, 2));
  add('frame', 'button', 'volume button', box(W / 2 + 0.22, 46, 0.3, 0.9, 22, 2));
  add('frame', 'port', 'USB-C port', box(0, -H / 2 + 0.13, -0.2, 8.6, 0.32, 2.7));
  add('frame', 'port', 'headphone jack', discY(-18, H / 2 - 0.13, -0.2, 1.8, 0.32, 16));
  add('frame', 'port', 'SIM tray', box(-W / 2 + 0.13, 30, 0, 0.32, 16, 1.5));
  if (full) {
    for (let i = 0; i < 6; i++) add('frame', 'port', 'speaker hole', box(15 + i * 2.6, -H / 2 + 0.13, -0.2, 1.3, 0.32, 1.3));
    add('frame', 'port', 'microphone', box(-13, -H / 2 + 0.13, -0.2, 0.9, 0.32, 0.9));
  }

  // The cavity behind the mid-plate holds the board, battery and lower board.
  const cavityFront = plateZ0; // components mount on this face and extend towards -Z
  const cavityBack = Z_BACK + BACK.thickness;

  // ── Logic board ────────────────────────────────────────────────────────────
  const pcbZ0 = cavityFront - BOARD.thickness;
  const comp = pcbZ0; // back face of the board; components grow from here towards -Z
  const onBoard = (part: PartName, material: MaterialKey, name: string, cx: number, cy: number, w: number, h: number, tall: number) =>
    add(part, material, name, box(cx, BOARD.y + cy, comp - tall / 2, w, h, tall));

  const pcb = slab(BOARD.width, BOARD.height, 2, BOARD.thickness, pcbZ0, { curveSegments: 4, hole: { w: 15, h: 34, r: 2, cx: CAMERA.x, cy: 0 } });
  pcb.translate(0, BOARD.y, 0);
  add('board', 'pcb', 'logic board', pcb);

  // Shield can over the SoC and memory. It is its own part so it can lift clear.
  onBoard('shield', 'shield', 'shield can', -16, 5, 28, 18, 1.3);
  onBoard('soc', 'soc', 'system-on-chip', -22, 5, 12, 12, 0.8);
  onBoard('soc', 'chipMark', 'SoC marking', -22, 5, 8.6, 8.6, 0.84);
  onBoard('board', 'chip', 'memory', -9.5, 5, 9, 12, 0.8);
  onBoard('board', 'shield', 'RF shield', -19, -14, 22, 12, 1.2);
  onBoard('board', 'shield', 'SIM socket', -22, 19, 18, 6, 1.3);
  onBoard('board', 'chip', 'power IC', 3, -12, 7, 7, 0.7);
  onBoard('board', 'chip', 'audio codec', 5, 4, 5, 5, 0.6);
  onBoard('board', 'chip', 'charger IC', 4, 12, 6, 4, 0.6);
  onBoard('board', 'chip', 'sensor hub', 31, 20, 3.4, 3.4, 0.6);
  onBoard('board', 'connector', 'battery connector', 3, -20.3, 10, 2.6, 0.9);
  onBoard('board', 'connector', 'display connector', -4, 20.6, 9, 2.4, 0.9);
  onBoard('board', 'connector', 'camera connector', 9.5, -4, 2.4, 7, 0.9);
  onBoard('board', 'connector', 'side-key connector', 31.5, -17, 2.4, 6, 0.9);

  if (full) {
    // Passives: small parts scattered over the free areas of the board. Seeded, so identical on every load.
    const rand = seededRandom(6835);
    const keepOut: [number, number, number, number][] = [
      [-16, 5, 28, 18], [-19, -14, 22, 12], [-22, 19, 18, 6], [3, -12, 7, 7], [5, 4, 5, 5], [4, 12, 6, 4], [31, 20, 3.4, 3.4],
      [3, -20.3, 10, 2.6], [-4, 20.6, 9, 2.4], [9.5, -4, 2.4, 7], [31.5, -17, 2.4, 6], [CAMERA.x, 0, 17, 36], [CAMERA.x, -19.5, 4.6, 4.6],
    ];
    let placed = 0;
    for (let tries = 0; tries < 900 && placed < 70; tries++) {
      const vertical = rand() > 0.5;
      const w = vertical ? 0.6 : 1.1 + rand() * 0.5;
      const h = vertical ? 1.1 + rand() * 0.5 : 0.6;
      const cx = (rand() - 0.5) * (BOARD.width - 3);
      const cy = (rand() - 0.5) * (BOARD.height - 3);
      const clash = keepOut.some(([kx, ky, kw, kh]) => Math.abs(cx - kx) < (kw + w) / 2 + 0.5 && Math.abs(cy - ky) < (kh + h) / 2 + 0.5);
      if (clash) continue;
      keepOut.push([cx, cy, w, h]);
      onBoard('board', 'passive', 'passive', cx, cy, w, h, 0.35 + rand() * 0.2);
      placed++;
    }
  }

  // ── Cameras (they face the back of the phone, -Z) ──────────────────────────
  const camBodyZ = (cavityFront + cavityBack) / 2;
  const camDepth = cavityFront - cavityBack;
  const lensEnd = Z_BACK - 0.55; // the barrels reach into the island on the back cover
  add('camera', 'cameraBody', 'main camera', box(CAMERA.x, CAMERA.yMain, camBodyZ, CAMERA.main, CAMERA.main, camDepth));
  add('camera', 'lensBarrel', 'main lens barrel', discZ(CAMERA.x, CAMERA.yMain, lensEnd, 4.6, cavityBack - lensEnd + 0.01, round));
  add('camera', 'lensGlass', 'main lens', discZ(CAMERA.x, CAMERA.yMain, lensEnd - 0.05, 3, 0.06, round));
  add('camera', 'cameraBody', 'second camera', box(CAMERA.x, CAMERA.ySecond, camBodyZ, CAMERA.second, CAMERA.second, camDepth));
  add('camera', 'lensBarrel', 'second lens barrel', discZ(CAMERA.x, CAMERA.ySecond, lensEnd + 0.2, 3.3, cavityBack - lensEnd - 0.19, round));
  add('camera', 'lensGlass', 'second lens', discZ(CAMERA.x, CAMERA.ySecond, lensEnd + 0.15, 2.1, 0.06, round));
  add('camera', 'flash', 'flash LED', box(CAMERA.x, BOARD.y - 19.5, comp - 0.45, 3, 3, 0.9));
  add('camera', 'flex', 'camera flex', box(14, BOARD.y - 4, comp - 0.06, 7, 3, 0.12));

  // ── Battery ────────────────────────────────────────────────────────────────
  const battery = slab(BATTERY.width, BATTERY.height, 2.5, BATTERY.thickness, cavityBack + 0.05, { bevel: b(0.6), curveSegments: 5 });
  battery.translate(0, BATTERY.y, 0);
  add('battery', 'battery', 'battery cell', battery);
  const label = panel(50, 54, 1.5, 0, 4);
  label.rotateY(Math.PI);
  label.translate(0, BATTERY.y + 4, cavityBack + 0.04);
  add('battery', 'batteryLabel', 'battery label', label);
  add('battery', 'tab', 'pull tab', box(0, BATTERY.y - BATTERY.height / 2 + 3.5, cavityBack + 0.02, 20, 5, 0.08));
  add('battery', 'flex', 'battery flex', box(3, BATTERY.y + BATTERY.height / 2 + 1.2, comp - 0.3, 8, 4.6, 0.14));

  // ── Lower board ────────────────────────────────────────────────────────────
  const sub = slab(SUBBOARD.width, SUBBOARD.height, 1.5, SUBBOARD.thickness, cavityFront - SUBBOARD.thickness, { curveSegments: 4 });
  sub.translate(0, SUBBOARD.y, 0);
  add('subboard', 'pcb', 'lower board', sub);
  const subComp = cavityFront - SUBBOARD.thickness;
  add('subboard', 'shield', 'USB-C connector', box(0, SUBBOARD.y - 8.4, subComp - 1.3, 9, 7.4, 2.6));
  add('subboard', 'speaker', 'speaker', box(20, SUBBOARD.y - 0.5, subComp - 1.7, 22, 11, 3.4));
  add('subboard', 'motor', 'vibration motor', discZ(-22, SUBBOARD.y, subComp - 2.6, 4, 2.6, round));
  add('subboard', 'connector', 'lower-board connector', box(-6, SUBBOARD.y + 4, subComp - 0.45, 8, 2.4, 0.9));
  add('subboard', 'flex', 'main flex', box(-34, BATTERY.y - 5, cavityFront - 0.5, 3, 104, 0.14));

  // ── Back cover ─────────────────────────────────────────────────────────────
  add('back', 'back', 'back cover', slab(W - 2 * BACK.inset, H - 2 * BACK.inset, R - BACK.inset, BACK.thickness, Z_BACK, { bevel: b(0.35), curveSegments: seg }));
  const island = slab(18, 46, 9, 0.9, Z_BACK - 0.9, { bevel: b(0.3), curveSegments: seg });
  island.translate(CAMERA.x, 55, 0);
  add('back', 'island', 'camera island', island);
  const islandZ = Z_BACK - 0.9;
  add('back', 'lensRing', 'main lens ring', discZ(CAMERA.x, CAMERA.yMain, islandZ - 0.14, 6.3, 0.14, round));
  add('back', 'lensGlass', 'main lens window', discZ(CAMERA.x, CAMERA.yMain, islandZ - 0.19, 4.9, 0.05, round));
  add('back', 'lensRing', 'second lens ring', discZ(CAMERA.x, CAMERA.ySecond, islandZ - 0.14, 5, 0.14, round));
  add('back', 'lensGlass', 'second lens window', discZ(CAMERA.x, CAMERA.ySecond, islandZ - 0.19, 3.6, 0.05, round));
  add('back', 'flash', 'flash window', discZ(CAMERA.x, BOARD.y - 19.5, islandZ - 0.1, 1.7, 0.1, round));

  // ── Assemble ───────────────────────────────────────────────────────────────
  const root = new Group();
  root.name = 'phone';
  root.scale.setScalar(PHONE.scale);
  const parts = {} as Record<PartName, PhonePart>;
  for (const name of PART_ORDER) {
    const group = new Group();
    group.name = name;
    root.add(group);
    parts[name] = { name, group, explodeZ: EXPLODE[name], items: items.filter((i) => i.part === name) };
  }

  // Front parts are shown from the front, internals from the back with the cover set aside.
  const rear = (deg: number) => Math.PI - degToRad(deg);
  const coverAside = { back: 96 };
  const callouts: Record<PhonePartId, Callout> = {
    display: { id: 'display', part: 'display', anchor: new Vector3(dispW / 2 - 8, 26, glassZ0), highlight: ['display', 'glass'], lift: { glass: 12 }, aside: {}, yaw: degToRad(40), pitch: degToRad(8) },
    antenna: { id: 'antenna', part: 'frame', anchor: new Vector3(20, H / 2, 0), highlight: ['frame'], lift: {}, aside: {}, yaw: degToRad(32), pitch: degToRad(26) },
    board: { id: 'board', part: 'board', anchor: new Vector3(-30, BOARD.y - 14, comp - 1.2), highlight: ['board', 'subboard'], lift: {}, aside: coverAside, yaw: rear(42), pitch: degToRad(10) },
    soc: { id: 'soc', part: 'soc', anchor: new Vector3(-22, BOARD.y + 5, comp - 0.84), highlight: ['soc'], lift: { shield: LIFT.shield, soc: LIFT.soc }, aside: { ...coverAside, shield: -34 }, yaw: rear(38), pitch: degToRad(14) },
    camera: { id: 'camera', part: 'camera', anchor: new Vector3(CAMERA.x, CAMERA.yMain, lensEnd), highlight: ['camera'], lift: { camera: LIFT.camera }, aside: coverAside, yaw: rear(46), pitch: degToRad(12) },
    battery: { id: 'battery', part: 'battery', anchor: new Vector3(8, BATTERY.y - 16, cavityBack), highlight: ['battery'], lift: { battery: -10 }, aside: coverAside, yaw: rear(34), pitch: degToRad(6) },
  };

  return { root, parts, items, callouts, height: H * PHONE.scale };
}
