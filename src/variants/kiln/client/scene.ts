import {
  AmbientLight, BufferAttribute, BufferGeometry, Color, DirectionalLight, DodecahedronGeometry, InstancedMesh,
  LatheGeometry, Mesh, MeshPhongMaterial, Object3D, PerspectiveCamera, PlaneGeometry, PointLight, Points, Scene,
  ShaderMaterial, TorusGeometry, Vector2,
} from 'three';
import { colorsFor, mountStage } from '@/lib/three/world-stage';

const fireVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fireFragment = /* glsl */ `
  uniform float uTime, uHeat, uWind;
  uniform vec3 uOxide, uFlame, uHoney, uCore;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float flow(vec2 p) {
    return .55 * noise(p) + .28 * noise(p * 2.12 + 2.4) + .12 * noise(p * 4.36 - 1.7);
  }
  float tongue(vec2 p, float x, float height, float phase) {
    float lifted = p.y / height;
    vec2 sheet = vec2(p.x * 5.8 + phase, p.y * 5.1 - uTime * (2.4 + uHeat * .42) + phase);
    float sway = (flow(sheet * .7) - .39) * (.32 + p.y * .14) + (.039 * sin(uTime * 2.6 + p.y * 8.0 + phase));
    float lane = p.x - x - sway - uWind * p.y * .14;
    float taper = max(.079, .31 - lifted * .14);
    return .96 - lifted * .92 - abs(lane) / taper + (flow(sheet + 1.3) - .34) * .9;
  }
  void main() {
    vec2 p = vec2(vUv.x, vUv.y / uHeat);
    float plume = max(tongue(p, .48, .80, 1.0), max(tongue(p, .33, .53, 7.0), tongue(p, .66, .62, 12.0)));
    float density = plume * smoothstep(.0, .08, vUv.y);
    float foot = mix(.237, .50, smoothstep(.02, .29, vUv.y));
    float alpha = smoothstep(-.025, .17, density) * smoothstep(0.0, .035, vUv.y)
                * (1.0 - smoothstep(.88, .99, vUv.y)) * (1.0 - smoothstep(foot * .8, foot, abs(vUv.x - .5)));
    float temperature = density * (1.0 - p.y * .57);
    vec3 heat = mix(uOxide, uFlame, smoothstep(.03, .21, temperature));
    heat = mix(heat, uHoney, smoothstep(.15, .48, temperature));
    heat = mix(heat, uCore, smoothstep(.36, .86, temperature));
    gl_FragColor = vec4(heat, alpha);
    #include <colorspace_fragment>
  }
`;

const sparkVertex = /* glsl */ `
  uniform float uTime, uHeat, uWind, uSize;
  varying float vLife;
  void main() {
    vec3 seed = position;
    float life = fract(seed.y + uTime * (.16 + seed.z * .29));
    vec3 p = vec3((seed.x - .5) * 1.78, .08, (seed.z - .5) * 1.6 + .3);
    p.y += life * (1.7 + seed.y * 1.74) * uHeat;
    p.x += life * (.53 * sin(seed.y * 61.2 + life * 3.4) + uWind * .72);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * (1.0 + seed.z * 2.7) * (1.0 - life * .48) * uHeat;
    vLife = smoothstep(.0, .085, life) * (1.0 - smoothstep(.23, 1.0, life));
  }
`;

const sparkFragment = /* glsl */ `
  varying float vLife;
  uniform vec3 uCore, uFlame;
  void main() {
    float d = length(gl_PointCoord - .5) * 2.0;
    vec3 spark = mix(uCore, uFlame, smoothstep(.14, .85, d));
    gl_FragColor = vec4(spark, (1.0 - smoothstep(.18, 1.0, d)) * vLife);
    #include <colorspace_fragment>
  }
`;

export function createKiln(canvas: HTMLCanvasElement) {
  const color = colorsFor(canvas);
  return mountStage(canvas, ({ renderer }) => {
    const scene = new Scene();
    const camera = new PerspectiveCamera(34, 1, .1, 30);
    const uTime = { value: 0 };
    const uHeat = { value: 1 };
    const uWind = { value: 0 };
    const uSize = { value: 1.3 };
    const uCore = { value: new Color(color('core')) };
    const uFlame = { value: new Color(color('flame')) };
    const fire = new Mesh(new PlaneGeometry(4.3, 4.25), new ShaderMaterial({
      vertexShader: fireVertex, fragmentShader: fireFragment,
      uniforms: { uTime, uHeat, uWind, uCore, uFlame, uHoney: { value: new Color(color('honey')) }, uOxide: { value: new Color(color('oxide')) } },
      transparent: true, depthWrite: false,
    }));
    fire.position.set(0, 1.97, -.25);
    scene.add(fire);

    const seeds = Array.from({ length: 216 }, (_, i) => {
      const number = Math.sin(i * 18.35 + 45.1) * 43758.545;
      return number - Math.floor(number);
    });
    const sparkGeometry = new BufferGeometry();
    sparkGeometry.setAttribute('position', new BufferAttribute(new Float32Array(seeds), 3));
    const sparks = new Points(sparkGeometry, new ShaderMaterial({
      vertexShader: sparkVertex, fragmentShader: sparkFragment, uniforms: { uTime, uHeat, uWind, uSize, uCore, uFlame },
      transparent: true, depthWrite: false,
    }));
    sparks.frustumCulled = false;
    sparks.renderOrder = 2;
    scene.add(sparks);

    const bowl = new Mesh(new LatheGeometry([
      new Vector2(.0, -.41), new Vector2(.73, -.41), new Vector2(.99, -.31), new Vector2(1.17, -.03),
      new Vector2(1.18, .07), new Vector2(1.09, .06), new Vector2(.94, -.17), new Vector2(0, -.23),
    ], 56), new MeshPhongMaterial({ color: color('wall'), specular: new Color(color('clay')), shininess: 38 }));
    const hotRim = new MeshPhongMaterial({
      color: color('clay'), emissive: color('flame'), emissiveIntensity: .3, shininess: 55,
    });
    const rim = new Mesh(new TorusGeometry(1.13, .039, 10, 70), hotRim);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = .049;

    const coals = new InstancedMesh(new DodecahedronGeometry(.175, 0), new MeshPhongMaterial({
      color: color('coal'), emissive: color('oxide'), emissiveIntensity: .23, flatShading: true,
    }), 19);
    const chunk = new Object3D();
    for (let i = 0; i < coals.count; i++) {
      const angle = i * 2.4;
      const radius = Math.sqrt((i + .4) / coals.count) * .91;
      chunk.position.set(Math.cos(angle) * radius, -.085 + Math.sin(i) * .047, Math.sin(angle) * radius);
      chunk.rotation.set(i * .34, i * 1.71, i * .92);
      chunk.scale.set(1 + Math.sin(i) * .18, .57, .9);
      chunk.updateMatrix();
      coals.setMatrixAt(i, chunk.matrix);
    }
    const key = new DirectionalLight(color('core'), 1.2);
    key.position.set(-1, 4, 3);
    const emberLight = new PointLight(color('flame'), 12, 7);
    emberLight.position.set(0, .9, 0);
    scene.add(key, emberLight, new AmbientLight(color('clay'), .67), bowl, rim, coals);

    let impulse = 0;
    let aim = 0;
    let distance = 8;
    return {
      resize({ width, height, dpr }) {
        camera.aspect = width / height;
        distance = Math.max(7.6, 6.9 / camera.aspect);
        camera.updateProjectionMatrix();
        uSize.value = Math.min(dpr, 1.35) * (width < 450 ? 1.15 : 1.65);
      },
      draw(dt, t) {
        impulse *= Math.exp(-dt * 1.35);
        uTime.value = t;
        uWind.value += (aim - uWind.value) * (1 - Math.exp(-dt * 3.7));
        uHeat.value = 1 + impulse * .43 + .025 * Math.sin(t * 4);
        camera.position.set(uWind.value * .29, 2.15, distance);
        camera.lookAt(0, 1.44, 0);
        fire.rotation.y = uWind.value * .06;
        hotRim.emissiveIntensity = .28 + uHeat.value * .15 + .073 * Math.sin(t * 5.8);
        emberLight.intensity = 11 + impulse * 11 + Math.sin(t * 6.2) * 2.3;
        renderer.render(scene, camera);
      },
      point(x) { aim = (x - .5) * 1.25; },
      pulse() { impulse = 1; },
    };
  }, { maxDpr: 1.25 });
}
