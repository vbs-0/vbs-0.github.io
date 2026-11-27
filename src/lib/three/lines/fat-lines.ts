/**
 * Lines with a constant width in screen pixels, drawn as one instanced quad per segment.
 * Round caps, anti-aliased edges, optional dashes, optional draw-in, and "conditional" segments
 * that only appear when they lie on the silhouette (see edges.ts).
 */
import { Color, type ColorRepresentation, DoubleSide, Float32BufferAttribute, GreaterDepth, InstancedBufferAttribute, InstancedBufferGeometry, LessEqualDepth, Mesh, ShaderMaterial, Vector2 } from 'three';

export interface FatLineOptions {
  color?: ColorRepresentation;
  /** Line width in CSS pixels. */
  width?: number;
  opacity?: number;
  /** Opposite vertices for conditional (silhouette-only) segments. Same count as `segments`. */
  controls?: Float32Array;
  /** Per-segment draw order, 0 to 1. Segments appear as `reveal` passes their value. */
  order?: Float32Array;
  /** Dash period in CSS pixels. 0 draws a solid line. */
  dash?: number;
  /** Draw only where the line is hidden behind a surface (for dashed hidden lines). */
  hidden?: boolean;
  depthTest?: boolean;
}

const vertexShader = /* glsl */ `
uniform vec2 uResolution;
uniform float uWidth;
uniform float uReveal;
uniform float uRevealSoft;
uniform float uBias;
attribute vec3 iStart;
attribute vec3 iEnd;
attribute float iOrder;
#ifdef CONDITIONAL
attribute vec3 iCtrl0;
attribute vec3 iCtrl1;
#endif
varying vec2 vUv;
varying float vLen;
varying vec2 vDir;

void trim(in vec4 kept, inout vec4 moved) {
  float a = projectionMatrix[2][2];
  float b = projectionMatrix[3][2];
  float nearEstimate = -0.5 * b / a;
  float t = (nearEstimate - kept.z) / (moved.z - kept.z);
  moved.xyz = mix(kept.xyz, moved.xyz, t);
}

void main() {
  vec4 mvStart = modelViewMatrix * vec4(iStart, 1.0);
  vec4 mvEnd = modelViewMatrix * vec4(iEnd, 1.0);

  float grown = clamp((uReveal - iOrder) / max(uRevealSoft, 0.0001), 0.0, 1.0);
  mvEnd = mix(mvStart, mvEnd, grown);
  float visible = grown > 0.0 ? 1.0 : 0.0;

  bool perspective = projectionMatrix[2][3] == -1.0;
  if (perspective) {
    if (mvStart.z < 0.0 && mvEnd.z >= 0.0) trim(mvStart, mvEnd);
    else if (mvEnd.z < 0.0 && mvStart.z >= 0.0) trim(mvEnd, mvStart);
    else if (mvStart.z >= 0.0 && mvEnd.z >= 0.0) visible = 0.0;
  }

  vec4 clipStart = projectionMatrix * mvStart;
  vec4 clipEnd = projectionMatrix * mvEnd;
  vec2 half_ = 0.5 * uResolution;
  vec2 pxStart = clipStart.xy / clipStart.w * half_;
  vec2 pxEnd = clipEnd.xy / clipEnd.w * half_;
  vec2 delta = pxEnd - pxStart;
  float len = length(delta);
  vec2 dir = len > 0.00001 ? delta / len : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  float hw = uWidth * 0.5 + 1.0;

#ifdef CONDITIONAL
  vec4 c0 = projectionMatrix * modelViewMatrix * vec4(iCtrl0, 1.0);
  vec4 c1 = projectionMatrix * modelViewMatrix * vec4(iCtrl1, 1.0);
  float s0 = dot(c0.xy / c0.w * half_ - pxStart, nrm);
  float s1 = dot(c1.xy / c1.w * half_ - pxStart, nrm);
  if (s0 * s1 <= 0.0) visible = 0.0;
#endif

  float along = position.y;
  float across = position.x;
  vec2 px = mix(pxStart, pxEnd, along) + nrm * across * hw + dir * (along * 2.0 - 1.0) * hw;
  vec4 clip = mix(clipStart, clipEnd, along);
  gl_Position = vec4(px / half_ * clip.w, clip.z - uBias * clip.w, clip.w);
  if (visible < 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);

  vUv = vec2(across * hw, along * (len + 2.0 * hw) - hw);
  vLen = len;
  vDir = dir;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uWidth;
uniform float uDash;
varying vec2 vUv;
varying float vLen;
varying vec2 vDir;

void main() {
  float hw = uWidth * 0.5;
  float beyond = max(max(-vUv.y, vUv.y - vLen), 0.0);
  float d = length(vec2(vUv.x, beyond));
  float alpha = 1.0 - smoothstep(hw - 0.5, hw + 0.5, d);
  if (uDash > 0.0) {
    float p = mod(dot(gl_FragCoord.xy, vDir), uDash);
    alpha *= 1.0 - step(uDash * 0.55, p);
  }
  if (alpha <= 0.003) discard;
  gl_FragColor = vec4(uColor, alpha * uOpacity);
  #include <colorspace_fragment>
}
`;

export class FatLines extends Mesh<InstancedBufferGeometry, ShaderMaterial> {
  private cssWidth: number;
  private cssDash: number;
  private dpr = 1;

  constructor(segments: Float32Array, opts: FatLineOptions = {}) {
    const count = segments.length / 6;
    const geometry = new InstancedBufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute([-1, 0, 0, 1, 0, 0, -1, 1, 0, 1, 1, 0], 3));
    geometry.setIndex([0, 1, 2, 2, 1, 3]);

    const starts = new Float32Array(count * 3);
    const ends = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      starts.set(segments.subarray(i * 6, i * 6 + 3), i * 3);
      ends.set(segments.subarray(i * 6 + 3, i * 6 + 6), i * 3);
    }
    geometry.setAttribute('iStart', new InstancedBufferAttribute(starts, 3));
    geometry.setAttribute('iEnd', new InstancedBufferAttribute(ends, 3));
    geometry.setAttribute('iOrder', new InstancedBufferAttribute(opts.order ?? new Float32Array(count), 1));

    const conditional = opts.controls !== undefined;
    if (opts.controls) {
      const c0 = new Float32Array(count * 3);
      const c1 = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        c0.set(opts.controls.subarray(i * 6, i * 6 + 3), i * 3);
        c1.set(opts.controls.subarray(i * 6 + 3, i * 6 + 6), i * 3);
      }
      geometry.setAttribute('iCtrl0', new InstancedBufferAttribute(c0, 3));
      geometry.setAttribute('iCtrl1', new InstancedBufferAttribute(c1, 3));
    }
    geometry.instanceCount = count;

    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      defines: conditional ? { CONDITIONAL: '' } : {},
      uniforms: {
        uResolution: { value: new Vector2(1, 1) },
        uWidth: { value: 1 },
        uColor: { value: new Color(opts.color ?? 0x000000) },
        uOpacity: { value: opts.opacity ?? 1 },
        uReveal: { value: 1 },
        uRevealSoft: { value: 0.04 },
        uDash: { value: 0 },
        uBias: { value: opts.hidden ? 0 : 0.00012 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: opts.depthTest ?? true,
      depthFunc: opts.hidden ? GreaterDepth : LessEqualDepth,
      side: DoubleSide,
      toneMapped: false,
    });

    super(geometry, material);
    this.frustumCulled = false;
    this.cssWidth = opts.width ?? 1.25;
    this.cssDash = opts.dash ?? 0;
    this.renderOrder = opts.hidden ? 1 : 2;
    this.applyScale();
  }

  private applyScale(): void {
    this.material.uniforms.uWidth!.value = this.cssWidth * this.dpr;
    this.material.uniforms.uDash!.value = this.cssDash * this.dpr;
  }

  /** Drawing-buffer size in device pixels, and the pixel ratio used to convert CSS widths. */
  setResolution(width: number, height: number, dpr: number): void {
    (this.material.uniforms.uResolution!.value as Vector2).set(width, height);
    this.dpr = dpr;
    this.applyScale();
  }

  set lineWidth(cssPx: number) {
    this.cssWidth = cssPx;
    this.applyScale();
  }
  get lineWidth(): number {
    return this.cssWidth;
  }

  get color(): Color {
    return this.material.uniforms.uColor!.value as Color;
  }

  set opacity(v: number) {
    this.material.uniforms.uOpacity!.value = v;
  }
  get opacity(): number {
    return this.material.uniforms.uOpacity!.value as number;
  }

  /** 0 hides everything, 1 shows everything; in between, segments appear in `order`. */
  set reveal(v: number) {
    this.material.uniforms.uReveal!.value = v;
  }
  get reveal(): number {
    return this.material.uniforms.uReveal!.value as number;
  }

  /** Frees the GPU resources this line set owns. */
  free(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
