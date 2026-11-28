/**
 * The work list's picture: one textured plane that follows the pointer, drawn on its own transparent canvas.
 * It wipes in, bends and splits its colour channels in proportion to how fast the pointer moves, and
 * stops rendering the moment it is gone. Created on the first hover, never on touch screens.
 */
import { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, SRGBColorSpace, type Texture, TextureLoader, Vector2 } from 'three';
import { createEngine } from '@/lib/three/engine';
import { clamp, damp } from '@/lib/three/math';

export interface Plane {
  /** Shows a picture beside the pointer. `ratio` is height over width. */
  show(src: string, ratio: number): void;
  hide(): void;
  move(x: number, y: number): void;
  dispose(): void;
}

const vertex = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const fragment = `
uniform sampler2D uMap;
uniform float uReveal;
uniform float uTime;
uniform vec2 uVel;
varying vec2 vUv;
void main() {
  float v = length(uVel);
  vec2 uv = vUv;
  uv.x += sin(uv.y * 9.0 + uTime * 5.0) * 0.07 * v;
  uv.y += sin(uv.x * 7.0 - uTime * 4.0) * 0.05 * v;
  vec2 split = normalize(uVel + vec2(1e-4)) * 0.014 * clamp(v * 5.0, 0.0, 1.0);
  vec4 c = vec4(texture2D(uMap, uv + split).r, texture2D(uMap, uv).g, texture2D(uMap, uv - split).b, 1.0);
  float edge = 0.012;
  float inside = step(edge, vUv.x) * step(vUv.x, 1.0 - edge) * step(edge, vUv.y) * step(vUv.y, 1.0 - edge);
  c.rgb = mix(vec3(0.045, 0.04, 0.036), c.rgb, inside);
  c.a = 1.0 - smoothstep(uReveal * 1.25 - 0.25, uReveal * 1.25, vUv.x);
  gl_FragColor = c;
  #include <colorspace_fragment>
}`;

export async function createPlane(canvas: HTMLCanvasElement, onLost: () => void): Promise<Plane> {
  const engine = createEngine(canvas, { maxDpr: 1.5, toneMapping: 'none', onContextLost: onLost });
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, -10, 10);
  const material = new ShaderMaterial({
    uniforms: { uMap: { value: null as Texture | null }, uReveal: { value: 0 }, uTime: { value: 0 }, uVel: { value: new Vector2() } },
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new Mesh(new PlaneGeometry(1, 1), material);
  mesh.visible = false;
  scene.add(mesh);
  const u = material.uniforms as { uMap: { value: Texture | null }; uReveal: { value: number }; uTime: { value: number }; uVel: { value: Vector2 } };

  const loader = new TextureLoader();
  const cache = new Map<string, Texture>();
  let want = '';
  let ratio = 0.625;
  const pointer = new Vector2(-999, -999);
  const pos = new Vector2(-999, -999);
  let reveal = 0;
  let open = false;

  engine.onResize((size) => {
    camera.left = -size.width / 2;
    camera.right = size.width / 2;
    camera.top = size.height / 2;
    camera.bottom = -size.height / 2;
    camera.updateProjectionMatrix();
  });
  engine.onFrame((dt, elapsed) => {
    const { width: w, height: h } = engine.size;
    const pw = clamp(w * 0.27, 250, 440);
    const ph = pw * ratio;
    let tx = pointer.x + pw * 0.5 + 30;
    if (tx + pw * 0.5 > w - 12) tx = pointer.x - pw * 0.5 - 30;
    const ty = clamp(pointer.y, ph * 0.5 + 12, h - ph * 0.5 - 12);
    if (pos.x < -900) pos.set(tx, ty);
    const vx = (tx - pos.x) / 90;
    const vy = (ty - pos.y) / 90;
    pos.set(damp(pos.x, tx, 11, dt), damp(pos.y, ty, 11, dt));
    reveal = damp(reveal, open ? 1 : 0, open ? 8 : 12, dt);
    const speed = Math.hypot(vx, vy);
    u.uVel.value.set(clamp(vx, -1, 1), clamp(-vy, -1, 1));
    u.uReveal.value = reveal;
    u.uTime.value = elapsed;
    const grow = 0.9 + 0.1 * reveal;
    mesh.scale.set(pw * grow, ph * grow, 1);
    mesh.position.set(pos.x - w / 2, h / 2 - pos.y, 0);
    mesh.rotation.z = clamp(-vx * 0.35, -0.12, 0.12);
    mesh.visible = reveal > 0.003 && u.uMap.value !== null;
    engine.renderer.render(scene, camera);
    if (!open && reveal < 0.003 && speed < 0.002) {
      engine.renderer.clear();
      engine.setContinuous(false);
    }
  });
  engine.setContinuous(false);

  const apply = (src: string) => {
    const tex = cache.get(src);
    if (!tex || src !== want) return;
    u.uMap.value = tex;
    if (open) reveal = Math.min(reveal, 0.3);
    engine.setContinuous(true);
  };

  return {
    show(src, nextRatio) {
      want = src;
      ratio = nextRatio;
      open = true;
      pos.set(-999, -999);
      if (cache.has(src)) apply(src);
      else {
        loader.load(src, (tex) => {
          tex.colorSpace = SRGBColorSpace;
          cache.set(src, tex);
          apply(src);
        });
      }
      engine.setContinuous(true);
    },
    hide() {
      open = false;
      engine.setContinuous(true);
    },
    move(x, y) {
      pointer.set(x, y);
    },
    dispose() {
      for (const t of cache.values()) t.dispose();
      mesh.geometry.dispose();
      material.dispose();
      engine.dispose();
    },
  };
}
