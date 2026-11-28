import {
  BufferAttribute, BufferGeometry, Color, DoubleSide, Mesh, OrthographicCamera, PlaneGeometry, Points, Scene,
  ShaderMaterial, Vector2,
} from 'three';
import { motionPalettes } from '../../src/styles/palettes';
import { createEngine, type Engine } from '../../src/lib/three/engine';
import type { World } from '../worlds';

const lighting = /* glsl */ `
  vec3 face(vec3 p) {
    return normalize(cross(dFdx(p), dFdy(p)));
  }
`;

const ribbonVertex = /* glsl */ `
  uniform float uTime, uBand;
  uniform vec2 uAim;
  varying vec3 vP;
  varying vec2 vUv;
  varying float vTwist;
  void main() {
    vUv = uv;
    float s = (uv.x - .5) * 15.0;
    float t = uTime * 1.35;
    float phase = s * .91 - t + uBand * .53;
    float roll = s * .83 + t * .82 + uBand * 1.17;
    float width = (.96 + .31 * sin(s * .81 + t * .7)) * (1.0 - uBand * .23);
    float strip = (uv.y - .5) * width * 2.0;
    float belly = (1.0 - pow(abs(uv.y - .5) * 2.0, 1.65));
    vec2 radial = vec2(cos(roll), sin(roll));
    vP = vec3(
      s + .33 * strip * sin(phase),
      1.36 * sin(phase) + .65 * cos(s * .43 + t * .65) + (uBand - 1.0) * .9
        + strip * radial.x - belly * radial.y * .24,
      1.3 * cos(phase * .96 + .4) + (1.0 - uBand) * .63 + strip * radial.y + belly * radial.x * .24
    );
    vP.y += uAim.y * .5 * sin(phase + uAim.x * .5);
    vTwist = phase + roll;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(vP, 1.0);
  }
`;

const ribbonFragment = /* glsl */ `
  ${lighting}
  uniform vec3 uBase, uTint, uLight, uShade;
  varying vec3 vP;
  varying vec2 vUv;
  varying float vTwist;
  void main() {
    vec3 n = face(vP);
    vec3 key = normalize(vec3(-.43, .68, .59));
    float fall = smoothstep(-.72, .96, dot(n, key));
    float satin = pow(max(dot(n, normalize(vec3(.20, -.34, .92))), 0.0), 12.0);
    float angle = .50 + .50 * sin(vTwist * 1.2 + vUv.y * 3.0);
    vec3 base = mix(uBase, uTint, angle * .48);
    vec3 ribbon = mix(uShade, base, .17 + .83 * fall);
    float edge = .25 * smoothstep(.92, .997, abs(vUv.y - .5) * 2.0);
    vec3 tone = mix(ribbon, uLight, satin * .47 + edge);
    gl_FragColor = vec4(tone, 1.0);
    #include <colorspace_fragment>
  }
`;

const waveVertex = /* glsl */ `
  uniform float uTime;
  uniform vec2 uAim;
  varying vec3 vP;
  varying vec2 vUv;
  varying float vCrest;
  void main() {
    vUv = uv;
    vP = position;
    float x = position.x, z = position.z;
    float t = uTime * 1.18;
    float p = z * .84 + x * .30 - t * 1.48;
    float rise = x * .29 - sin(t * .5) * .9 - .54;
    float swell = .69 + .96 * exp(-rise * rise);
    float curl = (sin(p) + .23 * sin(p * 2.0 + .43)) * swell;
    vP.y = curl + sin(x * .78 - z * .53 + t * .92) * .57
       + cos(z * 2.79 + x * 2.1 - t * 2.76) * .059
       + sin(x * 3.8 + z * .9 + t * 2.3) * .055;
    vP.y += .16 * uAim.y * cos(x * 1.47 + z * 1.4 - t * 1.5);
    vP.z += .34 * cos(p);
    vCrest = curl;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(vP, 1.0);
  }
`;

const waveFragment = /* glsl */ `
  ${lighting}
  uniform float uTime;
  uniform vec3 uDeep, uShade, uBeam, uAccent, uPeak;
  varying vec3 vP;
  varying vec2 vUv;
  varying float vCrest;
  void main() {
    vec3 normal = face(vP);
    vec3 n = normal.y > 0.0 ? normal : -normal;
    float facing = dot(n, normalize(vec3(-.27, .81, .50)));
    float plane = smoothstep(-.22, .96, facing);
    float glint = pow(max(dot(n, normalize(vec3(-.35, .61, .68))), 0.0), 23.0);
    float fiber = sin(vP.x * 21.7 + vP.z * 10.8 + uTime) * sin(vP.x * 17.0 - vP.z * 34.0 - uTime * 3.8);
    float spindrift = smoothstep(.72, 1.57, vCrest + n.z * .48 + fiber * .17);
    vec3 water = mix(uDeep, uShade, .15 + plane * .73);
    water = mix(water, uBeam, smoothstep(.42, 1.1, plane) * .58);
    water = mix(water, uAccent, spindrift * .65 + glint * .24);
    float line = vUv.y * 51.0;
    float seam = 1.0 - smoothstep(.054, .072 + min(fwidth(line), .2), abs(fract(line) - .5));
    seam *= 1.0 - smoothstep(.27, .52, fwidth(line));
    water = mix(water, uPeak, min(1.0, seam * (.23 + glint * .31) + spindrift * spindrift * .40));
    float fade = smoothstep(0.0, .09, vUv.y) * (1.0 - smoothstep(.78, 1.0, vUv.y));
    gl_FragColor = vec4(water, fade);
    #include <colorspace_fragment>
  }
`;

const screenVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fireFragment = /* glsl */ `
  uniform float uTime, uAspect, uDetail;
  uniform vec2 uAim;
  uniform vec3 uDeep, uShade, uAccent, uBeam, uPeak;
  varying vec2 vUv;
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float field(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1,0)), f.x), mix(hash(i + vec2(0,1)), hash(i + 1.0), f.x), f.y);
  }
  float filament(vec2 p, float lane, float height, float phase) {
    float reach = p.y / height;
    float offset = .10 * sin(p.y * (10.2 + phase) - uTime * (2.31 + phase * .6));
    float width = max(.049, .19 - reach * .122);
    return .98 - reach - abs(p.x - lane * (1.05 - p.y) - offset * (.35 + p.y)) / width;
  }
  void main() {
    vec2 p = vec2((vUv.x - .5) * uAspect, vUv.y - .135);
    float glow = exp(-dot(p * vec2(2.0, 2.3), p * vec2(2.0, 2.3)) * 1.43);
    vec2 q = vec2(p.x * 7.8, p.y * 7.0 - uTime * 2.17);
    float current = .64 * field(q) + .28 * field(q * 2.17 + .6);
    if (uDetail > .5) current += .080 * field(q * 4.15 - 1.4);
    vec2 flow = p + vec2((current - .48) * (.21 + p.y * .36) - uAim.x * max(0.0, p.y) * .112, 0);
    float a = filament(flow, -.23, .47 + .09 * sin(uTime * 3.49), .7);
    float b = filament(flow, -.07, .69 + .10 * cos(uTime * 2.57), 1.4);
    float c = filament(flow, .105, .75 + .13 * sin(uTime * 2.53 + 1.7), 2.3);
    float d = filament(flow, .27, .43 + .13 * sin(uTime * 3.05 + 2.1), 2.7);
    float peak = max(max(a,b), max(c,d)) + (current - .49) * .61;
    float alpha = smoothstep(-.09, .13, peak) * smoothstep(-.028, .057, p.y);
    float heat = max(0.0, peak) * (1.0 - p.y * .75) + .085 * (current - .42);
    vec3 fire = mix(uShade, uAccent, smoothstep(-.06, .11, heat));
    fire = mix(fire, uBeam, smoothstep(.09, .33, heat));
    fire = mix(fire, uPeak, smoothstep(.23, .65, heat));
    float ember = exp(-pow(abs(p.y + .018) * 30.0, 2.0) - pow(abs(p.x) * 3.1, 6.0));
    float bed = ember * smoothstep(.40, .82, field(p * vec2(91.0, 155.0)) + cos(uTime * 3.2) * .10);
    vec3 air = mix(uDeep, uShade * .37 + uAccent * .055, glow);
    gl_FragColor = vec4(mix(air + uShade * ember * .58 + uBeam * bed * .68, fire, alpha), 1.0);
    #include <colorspace_fragment>
  }
`;

const sparkVertex = /* glsl */ `
  uniform float uTime, uAspect, uDpr;
  uniform vec2 uAim;
  varying float vPower;
  void main() {
    vec3 seed = position;
    float lift = fract(seed.y + uTime * (seed.z * .23 + .21));
    float x = (seed.x - .5) * (.58 + lift * .63) + sin(lift * 6.0 + seed.y * 19.0) * .105 + lift * uAim.x * .135;
    float y = .14 + lift * (.41 + seed.z * .52);
    vPower = smoothstep(.0, .21, lift) * (1.0 - smoothstep(.35, 1.0, lift)) * (.4 + seed.z * .6);
    gl_Position = vec4((x * 2.0) / uAspect, y * 2.0 - 1.0, .0, 1.0);
    gl_PointSize = (1.2 + seed.x * 2.9) * uDpr;
  }
`;

const sparkFragment = /* glsl */ `
  uniform vec3 uAccent, uPeak;
  varying float vPower;
  void main() {
    float radius = length(gl_PointCoord - .5);
    gl_FragColor = vec4(mix(uPeak, uAccent, smoothstep(.12, .48, radius)), vPower * (1.0 - smoothstep(.12, .50, radius)));
    #include <colorspace_fragment>
  }
`;

export interface MaterialScene {
  setActive(active: boolean): void;
  point(x: number, y: number): void;
}

export function mountMaterial(canvas: HTMLCanvasElement, world: World, rendered: (live: boolean) => void): MaterialScene {
  const palette = motionPalettes[world];
  const uTime = { value: 0 };
  const uAim = { value: new Vector2() };
  const uDetail = { value: 1 };
  const uDpr = { value: 1 };
  const uAspect = { value: 1 };
  const colors = { uDeep: { value: new Color(palette.deep) }, uShade: { value: new Color(palette.shade) },
    uBeam: { value: new Color(palette.beam) }, uAccent: { value: new Color(palette.accent) }, uPeak: { value: new Color(palette.peak) } };
  const scene = new Scene();
  const camera = new OrthographicCamera(-5, 5, 4, -4, .1, 50);
  const pointer = new Vector2();
  let fresh = true;
  let supported = true;
  let active = false;
  let resizeFrame = false;
  const engine: Engine = createEngine(canvas, {
    maxDpr: 1.2, alpha: world !== 'kiln', antialias: false, toneMapping: 'none',
    onContextLost: () => rendered(false),
    onContextRestored: () => { fresh = true; },
    onDegrade(level) {
      uDetail.value = 0;
      if (level === 'minimal') {
        // The fallback still moves; don't leave a slow device staring at a stopped frame.
        supported = false;
        engine.setContinuous(false);
        rendered(false);
      }
    },
  });

  if (world === 'flow') {
    const fabric = new PlaneGeometry(1, 1, 170, 15);
    for (let band = 0; band < 3; band++) {
      const strip = new Mesh(fabric, new ShaderMaterial({
        vertexShader: ribbonVertex, fragmentShader: ribbonFragment, side: DoubleSide,
        uniforms: { uTime, uAim, uBand: { value: band }, uTint: colors.uBeam, uLight: colors.uPeak,
          uBase: band === 1 ? colors.uBeam : colors.uAccent, uShade: colors.uShade },
      }));
      strip.frustumCulled = false;
      scene.add(strip);
    }
  } else if (world === 'tide') {
    const mesh = new Mesh(new PlaneGeometry(25, 11, 145, 83).rotateX(-Math.PI / 2), new ShaderMaterial({
      vertexShader: waveVertex, fragmentShader: waveFragment, uniforms: { uTime, uAim, ...colors }, side: DoubleSide, transparent: true,
    }));
    mesh.frustumCulled = false;
    scene.add(mesh);
  } else {
    const fire = new Mesh(new PlaneGeometry(2, 2), new ShaderMaterial({
      vertexShader: screenVertex, fragmentShader: fireFragment, uniforms: { uTime, uAim, uAspect, uDetail, ...colors },
    }));
    fire.frustumCulled = false;
    scene.add(fire);
    const seeds = Array.from({ length: 237 }, (_, i) => {
      const value = Math.sin((i + 1) * 147.21) * 37012.9;
      return value - Math.floor(value);
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(seeds), 3));
    const sparks = new Points(geometry, new ShaderMaterial({
      vertexShader: sparkVertex, fragmentShader: sparkFragment, uniforms: { uTime, uAim, uAspect, uDpr, ...colors },
      transparent: true, depthTest: false, depthWrite: false,
    }));
    sparks.frustumCulled = false;
    scene.add(sparks);
  }

  engine.onResize(({ width, height, dpr }) => {
    const aspect = width / height;
    const radius = world === 'tide' ? Math.min(3.67, 10.8 / aspect) : 3.4;
    uAspect.value = aspect;
    uDpr.value = dpr;
    camera.left = -radius * aspect;
    camera.right = radius * aspect;
    camera.top = radius;
    camera.bottom = -radius;
    camera.updateProjectionMatrix();
    resizeFrame = !fresh;
  });
  engine.onFrame((dt) => {
    if (!(supported && (active || resizeFrame))) return;
    resizeFrame = false;
    if (active) {
      uTime.value += dt;
      uAim.value.lerp(pointer, 1 - Math.exp(-dt * 4));
    }
    const t = uTime.value;
    if (world === 'tide') {
      camera.position.set(.27 * Math.sin(t * .45) + uAim.value.x * .42, 6.3, 10);
      camera.lookAt(0, .21, .4);
    } else {
      camera.position.set(uAim.value.x * .75, uAim.value.y * .57 + 1.55, 11);
      camera.lookAt(0, 0, 0);
    }
    engine.renderer.render(scene, camera);
    if (fresh) { fresh = false; rendered(true); }
  });

  return {
    setActive(value) {
      active = value;
      engine.setContinuous(value && supported);
    },
    point(x, y) { pointer.set(x * 2 - 1, 1 - y * 2); },
  };
}
