/**
 * The hero's dust field: one full-screen shader (domain-warped noise) in ink, umber, vermilion and gold,
 * stirred by the pointer. One draw call, no geometry, no textures. It renders only while the hero is on
 * screen and, with reduced motion, draws a single still frame.
 */
import { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2 } from 'three';
import type { Tier } from '@/lib/three/capabilities';
import { createEngine } from '@/lib/three/engine';
import { clamp, damp } from '@/lib/three/math';

export interface Field {
  /** Resolves once the first frame is on screen. */
  readonly ready: Promise<void>;
  /** Pointer position over the hero, 0 to 1, origin at the bottom left. */
  point(x: number, y: number): void;
  visible(on: boolean): void;
  dispose(): void;
}

export interface FieldOptions {
  tier: Tier;
  reducedMotion: boolean;
  onContextLost(): void;
  onContextRestored(): void;
}

const vertex = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const fragment = `
precision highp float;
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uPtr;
uniform vec2 uVel;
varying vec2 vUv;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float a = 0.5; float s = 0.0;
  for (int i = 0; i < OCT; i++) { s += a * noise(p); p = p * 2.02 + vec2(17.1, 9.2); a *= 0.5; }
  return s;
}
void main() {
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);
  vec2 p = (vUv - 0.5) * asp * 2.2;
  vec2 d = p - (uPtr - 0.5) * asp * 2.2;
  float g = exp(-dot(d, d) * 2.4);
  p += vec2(-d.y, d.x) * g * 0.8 + uVel * g * 1.6;
  float t = uTime * 0.07;
  vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + t * 1.4), fbm(p + 3.0 * q + vec2(8.3, 2.8) - t));
  float f = fbm(p + 3.0 * r);
  float mass = smoothstep(0.1, 1.0, f * 1.3 + vUv.x * 0.55 + (1.0 - vUv.y) * 0.45 - 0.52 + g * 0.18);
  vec3 ink = vec3(0.045, 0.04, 0.036);
  vec3 umber = vec3(0.24, 0.085, 0.05);
  vec3 red = vec3(0.84, 0.2, 0.09);
  vec3 gold = vec3(0.97, 0.72, 0.3);
  vec3 c = mix(ink, umber, smoothstep(0.0, 0.34, mass));
  c = mix(c, red, smoothstep(0.34, 0.7, mass));
  c = mix(c, gold, smoothstep(0.72, 1.0, mass) * 0.92);
  float grit = hash(floor(vUv * uRes * 0.5) + floor(uTime * 12.0));
  c += (grit - 0.5) * 0.035;
  gl_FragColor = vec4(c, 1.0);
}`;

export async function createField(canvas: HTMLCanvasElement, opts: FieldOptions): Promise<Field> {
  const low = opts.tier === 'low';
  const engine = createEngine(canvas, {
    maxDpr: low ? 1 : 1.25,
    antialias: false,
    toneMapping: 'none',
    onContextLost: opts.onContextLost,
    onContextRestored: opts.onContextRestored,
    // A device that cannot hold the frame rate freezes the field rather than dropping the page's frames.
    onDegrade: () => engine.invalidate(2),
  });
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const material = new ShaderMaterial({
    defines: { OCT: low ? 3 : 5 },
    uniforms: { uTime: { value: 11 }, uRes: { value: new Vector2(1, 1) }, uPtr: { value: new Vector2(0.78, 0.3) }, uVel: { value: new Vector2() } },
    vertexShader: vertex,
    fragmentShader: fragment,
    depthTest: false,
    depthWrite: false,
  });
  const quad = new Mesh(new PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  scene.add(quad);

  const u = material.uniforms as { uTime: { value: number }; uRes: { value: Vector2 }; uPtr: { value: Vector2 }; uVel: { value: Vector2 } };
  const target = new Vector2(0.78, 0.3);
  const last = new Vector2(0.78, 0.3);
  let shown = false;
  let on = true;
  let resolveReady!: () => void;
  const ready = new Promise<void>((resolve) => { resolveReady = resolve; });

  engine.onResize((size) => u.uRes.value.set(size.width * size.dpr, size.height * size.dpr));
  engine.onFrame((dt, elapsed) => {
    if (!on && shown) return;
    u.uTime.value = opts.reducedMotion ? 11 : 11 + elapsed;
    u.uPtr.value.set(damp(u.uPtr.value.x, target.x, 5, dt), damp(u.uPtr.value.y, target.y, 5, dt));
    u.uVel.value.set(damp(u.uVel.value.x, clamp((target.x - last.x) * 3, -0.6, 0.6), 6, dt), damp(u.uVel.value.y, clamp((target.y - last.y) * 3, -0.6, 0.6), 6, dt));
    last.copy(target);
    engine.renderer.render(scene, camera);
    if (!shown) {
      shown = true;
      resolveReady();
    }
  });
  engine.setContinuous(!opts.reducedMotion);
  engine.invalidate(3);

  return {
    ready,
    point(x, y) {
      target.set(clamp(x, 0, 1), clamp(y, 0, 1));
      if (opts.reducedMotion) engine.invalidate(2);
    },
    visible(next) {
      on = next;
      engine.setContinuous(next && !opts.reducedMotion);
      if (next) engine.invalidate(2);
    },
    dispose() {
      quad.geometry.dispose();
      material.dispose();
      engine.dispose();
    },
  };
}
