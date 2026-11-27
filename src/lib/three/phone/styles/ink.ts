/**
 * Dresses the procedural phone as a technical drawing: flat paper-coloured faces with hidden-line
 * removal, crease lines, and silhouette lines that appear only where a curved surface turns away.
 * Used by the Service manual build.
 */
import { Color, Mesh, MeshBasicMaterial, ShaderMaterial, type Texture, Vector3 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { type EdgeSet, extractEdges, mergeEdgeSets } from '../../lines/edges';
import { FatLines } from '../../lines/fat-lines';
import { PHONE } from '../dimensions';
import { type MaterialKey, PART_ORDER, type PartName, type PhoneItem, type PhoneModel } from '../model';
import type { PhoneRig } from '../rig';

export interface InkColors {
  ink: string;
  paper: string;
  /** Tone of faces turned away from the light. */
  shade: string;
  /** Fill of the part in focus. */
  highlight: string;
}

export interface InkPhone {
  setColors(colors: InkColors): void;
  setResolution(width: number, height: number, dpr: number): void;
  /** Applies the rig's focus state. Call once per frame. */
  update(rig: PhoneRig): void;
  /** 0 hides every line, 1 shows the finished drawing; in between the lines draw themselves top to bottom. */
  setReveal(v: number): void;
  readonly lines: FatLines[];
  dispose(): void;
}

/** Small components are drawn with a finer pen so they do not fight the outlines. */
const FINE: MaterialKey[] = ['passive', 'connector', 'chip', 'chipMark', 'port', 'antenna', 'flex', 'tab', 'flash', 'lensGlass', 'lensRing', 'batteryLabel', 'screen'];
/** Drawn as lines only, so what lies behind stays visible. */
const NO_FILL: MaterialKey[] = ['glass'];

const fillVertex = /* glsl */ `
varying vec3 vNormal;
void main() {
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const fillFragment = /* glsl */ `
uniform vec3 uFill;
uniform vec3 uShade;
uniform vec3 uHighlight;
uniform float uFocus;
uniform vec3 uLight;
varying vec3 vNormal;
void main() {
  vec3 n = normalize(vNormal);
  if (!gl_FrontFacing) n = -n;
  float lit = smoothstep(-0.2, 0.3, dot(n, uLight));
  vec3 c = mix(uShade, uFill, lit);
  c = mix(c, uHighlight * mix(0.88, 1.0, lit), uFocus);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

/** Draw order: a sweep from the top of the phone to the bottom, part by part from the front. */
function orderFor(segments: Float32Array, partIndex: number): Float32Array {
  const out = new Float32Array(segments.length / 6);
  for (let i = 0; i < out.length; i++) {
    const midY = ((segments[i * 6 + 1] as number) + (segments[i * 6 + 4] as number)) / 2;
    const sweep = 0.5 - midY / PHONE.height;
    out[i] = Math.min(0.94, Math.max(0, sweep * 0.78 + partIndex * 0.016));
  }
  return out;
}

export function dressInk(model: PhoneModel, colors: InkColors, screenTexture?: Texture, widths = { heavy: 1.5, fine: 0.95 }): InkPhone {
  const fills: { part: PartName; material: ShaderMaterial }[] = [];
  const lines: FatLines[] = [];
  const meshes: Mesh[] = [];
  const light = new Vector3(-0.45, 0.65, 0.62).normalize();
  let screenMaterial: MeshBasicMaterial | undefined;
  const white = new Color(0xffffff);
  const mark = new Color(colors.highlight);

  PART_ORDER.forEach((part, partIndex) => {
    const group = model.parts[part].group;
    const items = model.parts[part].items;

    const solid = items.filter((i) => !NO_FILL.includes(i.material) && i.material !== 'screen');
    if (solid.length > 0) {
      const merged = mergeGeometries(solid.map((i) => (i.geometry.index ? i.geometry.toNonIndexed() : i.geometry)), false);
      if (merged) {
        const material = new ShaderMaterial({
          vertexShader: fillVertex,
          fragmentShader: fillFragment,
          uniforms: {
            uFill: { value: new Color(colors.paper) },
            uShade: { value: new Color(colors.shade) },
            uHighlight: { value: new Color(colors.highlight) },
            uFocus: { value: 0 },
            uLight: { value: light },
          },
          polygonOffset: true,
          polygonOffsetFactor: 1.5,
          polygonOffsetUnits: 1.5,
          toneMapped: false,
        });
        const mesh = new Mesh(merged, material);
        mesh.name = `${part}:fill`;
        mesh.userData.part = part;
        group.add(mesh);
        meshes.push(mesh);
        fills.push({ part, material });
      }
    }

    const screen = items.find((i) => i.material === 'screen');
    if (screen) {
      screenMaterial = new MeshBasicMaterial({ color: 0xffffff, map: screenTexture ?? null, toneMapped: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
      const mesh = new Mesh(screen.geometry, screenMaterial);
      mesh.name = `${part}:screen`;
      mesh.userData.part = part;
      group.add(mesh);
      meshes.push(mesh);
    }

    const addLines = (list: PhoneItem[], width: number) => {
      if (list.length === 0) return;
      const set: EdgeSet = mergeEdgeSets(list.map((i) => extractEdges(i.geometry, 32)));
      if (set.creases.length > 0) {
        const l = new FatLines(set.creases, { color: colors.ink, width, order: orderFor(set.creases, partIndex) });
        group.add(l);
        lines.push(l);
      }
      if (set.conditional.length > 0) {
        const l = new FatLines(set.conditional, { color: colors.ink, width, controls: set.controls, order: orderFor(set.conditional, partIndex) });
        group.add(l);
        lines.push(l);
      }
    };
    addLines(items.filter((i) => !FINE.includes(i.material)), widths.heavy);
    addLines(items.filter((i) => FINE.includes(i.material)), widths.fine);
  });

  return {
    lines,
    setColors(next) {
      for (const f of fills) {
        (f.material.uniforms.uFill!.value as Color).set(next.paper);
        (f.material.uniforms.uShade!.value as Color).set(next.shade);
        (f.material.uniforms.uHighlight!.value as Color).set(next.highlight);
      }
      for (const l of lines) l.color.set(next.ink);
      mark.set(next.highlight);
    },
    setResolution(width, height, dpr) {
      for (const l of lines) l.setResolution(width, height, dpr);
    },
    update(rig) {
      for (const f of fills) f.material.uniforms.uFocus!.value = rig.focus[f.part];
      // The screen carries a texture, so it is tinted rather than filled.
      if (screenMaterial) screenMaterial.color.copy(white).lerp(mark, rig.focus.display);
    },
    setReveal(v) {
      for (const l of lines) l.reveal = v;
    },
    dispose() {
      for (const l of lines) {
        l.removeFromParent();
        l.free();
      }
      for (const m of meshes) {
        m.removeFromParent();
        m.geometry.dispose();
        (m.material as ShaderMaterial).dispose();
      }
    },
  };
}
