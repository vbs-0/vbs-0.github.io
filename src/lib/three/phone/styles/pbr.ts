/**
 * Dresses the procedural phone as a product render: physically based materials, a studio environment,
 * and a few procedural textures (board traces, battery label, chip marking).
 * Used by the About phone build.
 */
import {
  CanvasTexture,
  Color,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { seededRandom } from '../../math';
import { type MaterialKey, PART_ORDER, type PartName, type PhoneModel } from '../model';
import type { PhoneRig } from '../rig';

export interface PbrColors {
  /** Back cover. */
  body: string;
  /** Mid-frame. */
  frame: string;
  /** Tint of the part in focus. */
  accent: string;
}

export interface PbrPhone {
  setColors(colors: PbrColors): void;
  /** Applies the rig's focus and dim state to the materials. Call once per frame. */
  update(rig: PhoneRig): void;
  /** Debug views for the Developer options. */
  setWireframe(on: boolean): void;
  readonly meshes: Mesh[];
  dispose(): void;
}

type Lit = MeshStandardMaterial | MeshPhysicalMaterial;
interface Entry {
  part: PartName;
  key: MaterialKey;
  material: Material;
  base: Color;
  /** Decals keep their own colour when the part dims; everything else fades towards grey. */
  lit: boolean;
}

function canvasTexture(size: number, paint: (ctx: CanvasRenderingContext2D, s: number) => void, heightRatio = 1): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = Math.round(size * heightRatio);
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  paint(ctx, size);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Solder mask with traces, vias and pads. Tiles every 40 mm. */
function pcbTexture(): CanvasTexture {
  const tex = canvasTexture(512, (ctx, s) => {
    const rand = seededRandom(13);
    ctx.fillStyle = '#0c3a33';
    ctx.fillRect(0, 0, s, s);
    ctx.lineCap = 'round';
    for (let i = 0; i < 90; i++) {
      let x = rand() * s;
      let y = rand() * s;
      ctx.strokeStyle = `rgba(52, 150, 122, ${0.35 + rand() * 0.4})`;
      ctx.lineWidth = 1.5 + rand() * 2.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let k = 0; k < 4; k++) {
        const len = 20 + rand() * 90;
        const dir = Math.floor(rand() * 8) * (Math.PI / 4);
        x += Math.cos(dir) * len;
        y += Math.sin(dir) * len;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(214, 176, 82, 0.9)';
      ctx.beginPath();
      ctx.arc(x, y, 2.5 + rand() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 46; i++) {
      ctx.fillStyle = `rgba(214, 176, 82, ${0.55 + rand() * 0.4})`;
      ctx.fillRect(rand() * s, rand() * s, 4 + rand() * 9, 3 + rand() * 4);
    }
  });
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(1 / 40, 1 / 40);
  return tex;
}

function batteryLabelTexture(): CanvasTexture {
  return canvasTexture(
    512,
    (ctx, s) => {
      const h = s * 1.08;
      ctx.fillStyle = '#d9dcd8';
      ctx.fillRect(0, 0, s, h);
      ctx.fillStyle = '#1b1f1e';
      ctx.font = '600 34px system-ui, sans-serif';
      ctx.fillText('Li-ion Polymer Battery', 34, 70);
      ctx.font = '500 24px system-ui, sans-serif';
      ctx.fillText('Rated capacity 4900 mAh', 34, 118);
      ctx.fillText('Typical capacity 5000 mAh', 34, 152);
      ctx.fillText('Nominal voltage 3.87 V', 34, 186);
      ctx.fillText('Limited charge voltage 4.45 V', 34, 220);
      ctx.strokeStyle = '#1b1f1e';
      ctx.lineWidth = 3;
      ctx.strokeRect(34, 262, s - 68, 118);
      ctx.font = '500 20px system-ui, sans-serif';
      ctx.fillText('Do not disassemble, crush, puncture', 50, 300);
      ctx.fillText('or dispose of in fire. Replace only', 50, 328);
      ctx.fillText('with the same type of battery.', 50, 356);
      const rand = seededRandom(5);
      let x = 34;
      while (x < s - 60) {
        const w = 2 + Math.floor(rand() * 5);
        ctx.fillRect(x, 420, w, 70);
        x += w + 2 + Math.floor(rand() * 4);
      }
      ctx.font = '500 18px ui-monospace, monospace';
      ctx.fillText('1ICP5/62/80', 34, 520);
    },
    1.08,
  );
}

function chipMarkTexture(): CanvasTexture {
  return canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = '#15171a';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = 'rgba(160,168,176,0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, s - 20, s - 20);
    ctx.fillStyle = 'rgba(190,196,202,0.85)';
    ctx.beginPath();
    ctx.arc(32, 32, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '600 40px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MT6835', s / 2, s / 2 + 4);
    ctx.font = '500 20px ui-monospace, monospace';
    ctx.fillText('ARM64  6 nm', s / 2, s / 2 + 44);
  });
}

export function dressPbr(model: PhoneModel, screenTexture: Texture, colors: PbrColors, tier: 'high' | 'low' = 'high'): PbrPhone {
  const textures: Texture[] = [];
  const keep = <T extends Texture>(t: T): T => {
    textures.push(t);
    return t;
  };
  const high = tier === 'high';
  const pcbMap = keep(pcbTexture());
  const labelMap = keep(batteryLabelTexture());
  const chipMap = keep(chipMarkTexture());

  const std = (color: number | string, roughness: number, metalness: number, extra: Partial<MeshStandardMaterial> = {}) =>
    Object.assign(new MeshStandardMaterial({ color, roughness, metalness }), extra);
  const decal = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };

  /** One material per material key. Each part gets its own clone, so parts can dim independently. */
  const make: Record<MaterialKey, () => Material> = {
    glass: () =>
      new MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.1, envMapIntensity: 1.5, clearcoat: high ? 1 : 0, clearcoatRoughness: 0.04, depthWrite: false }),
    screen: () => new MeshBasicMaterial({ map: screenTexture, toneMapped: false, ...decal }),
    bezel: () => std(0x0b0c0e, 0.45, 0.1),
    frame: () => std(colors.frame, 0.32, 0.9),
    antenna: () => std(0xd9ded9, 0.55, 0),
    button: () => std(colors.frame, 0.3, 0.9),
    port: () => std(0x050607, 0.7, 0.2),
    plate: () => std(0x9aa3a6, 0.42, 0.85),
    pcb: () => std(0xffffff, 0.62, 0.15, { map: pcbMap }),
    chip: () => std(0x15171a, 0.5, 0.1),
    soc: () => std(0x15171a, 0.42, 0.15),
    chipMark: () => std(0xffffff, 0.42, 0.15, { map: chipMap, ...decal }),
    shield: () => std(0xc6cbcf, 0.3, 1),
    connector: () => std(0xd2a941, 0.36, 1),
    passive: () => std(0x8a7a5c, 0.5, 0.4),
    battery: () => std(0x1a1d1f, 0.48, 0.2),
    batteryLabel: () => std(0xffffff, 0.7, 0, { map: labelMap, ...decal }),
    tab: () => std(0x2fbf71, 0.55, 0),
    flex: () => std(0xd1832b, 0.42, 0.1),
    cameraBody: () => std(0x1f2226, 0.45, 0.6),
    lensBarrel: () => std(0x0c0d10, 0.3, 0.85),
    lensGlass: () =>
      new MeshPhysicalMaterial({ color: 0x070a12, roughness: 0.03, metalness: 0.3, clearcoat: high ? 1 : 0, iridescence: high ? 1 : 0, iridescenceIOR: 1.7, iridescenceThicknessRange: [180, 520], ...decal }),
    lensRing: () => std(0xb9bec4, 0.25, 1),
    flash: () => std(0xfff3c4, 0.3, 0, { emissive: new Color(0xfff1b8), emissiveIntensity: 0.25 }),
    back: () =>
      new MeshPhysicalMaterial({ color: colors.body, roughness: 0.34, metalness: 0.05, clearcoat: high ? 0.7 : 0, clearcoatRoughness: 0.22, sheen: high ? 0.4 : 0, sheenRoughness: 0.5, sheenColor: new Color(0xffffff) }),
    island: () => new MeshPhysicalMaterial({ color: colors.body, roughness: 0.26, metalness: 0.1, clearcoat: high ? 0.8 : 0, clearcoatRoughness: 0.18 }),
    speaker: () => std(0x101214, 0.6, 0.1),
    motor: () => std(0xbfc4c8, 0.3, 1),
  };
  const DECALS: MaterialKey[] = ['screen', 'chipMark', 'batteryLabel'];
  const BODY_KEYS: MaterialKey[] = ['back', 'island'];
  const FRAME_KEYS: MaterialKey[] = ['frame', 'button'];

  const entries: Entry[] = [];
  const meshes: Mesh[] = [];
  for (const part of PART_ORDER) {
    const byKey = new Map<MaterialKey, typeof model.items>();
    for (const item of model.parts[part].items) byKey.set(item.material, [...(byKey.get(item.material) ?? []), item]);
    for (const [key, items] of byKey) {
      const merged = mergeGeometries(items.map((i) => (i.geometry.index ? i.geometry.toNonIndexed() : i.geometry)), false);
      if (!merged) continue;
      const material = make[key]();
      const mesh = new Mesh(merged, material);
      mesh.name = `${part}:${key}`;
      mesh.userData.part = part;
      if (key === 'glass') mesh.renderOrder = 5;
      model.parts[part].group.add(mesh);
      meshes.push(mesh);
      const base = 'color' in material ? (material.color as Color).clone() : new Color(0xffffff);
      entries.push({ part, key, material, base, lit: !DECALS.includes(key) });
    }
  }

  const accent = new Color(colors.accent);
  const grey = new Color(0x6f7773);
  const scratch = new Color();

  return {
    meshes,
    setColors(next) {
      accent.set(next.accent);
      for (const e of entries) {
        if (BODY_KEYS.includes(e.key)) e.base.set(next.body);
        else if (FRAME_KEYS.includes(e.key)) e.base.set(next.frame);
      }
    },
    update(rig) {
      for (const e of entries) {
        const focus = rig.focus[e.part];
        const fade = rig.dim * (1 - focus);
        const m = e.material as Lit & MeshBasicMaterial;
        if (e.key === 'glass') {
          m.opacity = 0.1 * (1 - 0.6 * fade);
          continue;
        }
        scratch.copy(e.base).lerp(grey, e.lit ? fade * 0.62 : fade * 0.5);
        if (e.lit) scratch.multiplyScalar(1 - fade * 0.35);
        m.color.copy(scratch);
        if ('emissive' in m && e.key !== 'flash') {
          m.emissive.copy(accent);
          m.emissiveIntensity = 0.16 * focus * rig.dim;
        }
        if ('envMapIntensity' in m) m.envMapIntensity = 1 - fade * 0.55;
      }
    },
    setWireframe(on) {
      for (const e of entries) if ('wireframe' in e.material) (e.material as MeshStandardMaterial).wireframe = on;
    },
    dispose() {
      for (const mesh of meshes) {
        mesh.geometry.dispose();
        mesh.removeFromParent();
      }
      for (const e of entries) e.material.dispose();
      for (const t of textures) t.dispose();
    },
  };
}
