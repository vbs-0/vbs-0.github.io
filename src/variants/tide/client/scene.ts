import { Color, DoubleSide, Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2 } from 'three';
import { colorsFor, mountStage } from '@/lib/three/world-stage';

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uRippleAge;
  uniform vec2 uRipple;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying float vScreenY;

  void main() {
    vUv = uv;
    vec3 p = position;
    float x = p.x;
    float z = p.z;
    float t = uTime;
    float crestDistance = (x - (1.8 + sin(t * .34) * 1.32)) * .36;
    float crest = exp(-crestDistance * crestDistance);
    p.y = .54 * sin(x * .72 - z * .68 - t * 1.08)
        + .27 * cos(x * 1.4 + z * .88 + t * .83)
        + (0.46 + crest * 1.09) * sin(z * .79 + x * .24 - t * .6)
        + .12 * sin(z * 2.54 - x * 1.08 + t * 1.49);
    float d = distance(vec2(x,z), uRipple);
    float crestAge = d - uRippleAge * 3.6;
    float pulse = sin(crestAge * 8.0) * exp(-crestAge * crestAge * .88) * (1.0 - smoothstep(1.5, 2.75, uRippleAge));
    p.y += pulse * .51;
    p.z += .12 * sin(p.y * 2.0 + x * .56);
    vWorld = p;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    vScreenY = gl_Position.y / gl_Position.w;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uDeep, uBlue, uCrest, uFoam, uGlint;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying float vScreenY;

  void main() {
    vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
    if (n.y < 0.0) n = -n;
    float light = clamp(dot(n, normalize(vec3(-.5, .84, .35))), 0.0, 1.0);
    float slope = clamp(.44 + n.z * .43 + vWorld.y * .18, 0.0, 1.0);
    vec3 base = mix(uDeep, uBlue, smoothstep(.09, .5, slope));
    base = mix(base, uCrest, smoothstep(.33, 1.0, slope) * .88);
    base = mix(base, uFoam, pow(light, 5.0) * .62);
    float bands = vUv.y * 45.0;
    float bandWidth = fwidth(bands);
    float antialias = min(bandWidth * .92, .23);
    float ridges = (1.0 - smoothstep(.055, .075 + antialias, abs(fract(bands) - .5))) * (1.0 - smoothstep(.28, .62, bandWidth));
    float threads = vUv.x * 80.0;
    float weave = 1.0 - smoothstep(.022, .038 + min(fwidth(threads), .22), abs(fract(threads)-.5));
    float spec = pow(max(dot(n, normalize(vec3(.22, .88, .37))), 0.0), 13.0);
    vec3 water = mix(base, uGlint, ridges * (.40 + spec * .48) + weave * .13);
    water += uGlint * spec * .095;
    float edge = smoothstep(.0, .1, vUv.y) * (1.0 - smoothstep(.78, 1.0, vUv.y));
    float alpha = edge * (.8 + ridges * .19) * (1.0 - smoothstep(.63, .99, vScreenY));
    gl_FragColor = vec4(water, alpha);
    #include <colorspace_fragment>
  }
`;

export function createTide(canvas: HTMLCanvasElement) {
  const color = colorsFor(canvas);
  return mountStage(canvas, ({ renderer }) => {
    const scene = new Scene();
    const camera = new OrthographicCamera(-8, 8, 2.75, -2.75, .1, 36);
    const geometry = new PlaneGeometry(26, 8.8, 120, 54).rotateX(-Math.PI / 2);
    const uniforms = {
      uTime: { value: 0 },
      uRippleAge: { value: 10 },
      uRipple: { value: new Vector2() },
      uDeep: { value: new Color(color('deep')) }, uBlue: { value: new Color(color('blue')) },
      uCrest: { value: new Color(color('crest')) }, uFoam: { value: new Color(color('foam')) },
      uGlint: { value: new Color(color('glint')) },
    };
    const material = new ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment, transparent: true, side: DoubleSide });
    const surface = new Mesh(geometry, material);
    scene.add(surface);

    let aspect = 1;
    let aim = .5;
    let slide = .5;
    let tilt = .5;
    return {
      resize({ width, height }) {
        aspect = width / height;
        const frame = aspect < 1.45 ? 2.8 : Math.min(2.54, 12.6 / aspect);
        camera.left = -aspect * frame;
        camera.right = aspect * frame;
        camera.top = frame;
        camera.bottom = -frame;
        camera.updateProjectionMatrix();
      },
      draw(dt, t) {
        slide += (aim - slide) * (1 - Math.exp(-dt * 2.2));
        const x = (aspect < 1.45 ? 1.45 : 0) + (slide - .5) * 1.4 + Math.sin(t * .37) * .3;
        camera.position.set(x, 5.35 + (tilt - .5) * .45, 8.7);
        camera.lookAt(x, -.14, 0);
        uniforms.uTime.value = t * .74;
        uniforms.uRippleAge.value += dt;
        renderer.render(scene, camera);
      },
      point(x, y) { aim = x; tilt = y; },
      pulse(x, y) {
        uniforms.uRipple.value.set((x - .5) * Math.min(13, aspect * 5) + (aspect < 1.45 ? 1.45 : 0), (y - .5) * 5);
        uniforms.uRippleAge.value = 0;
      },
    };
  }, { maxDpr: 1.25 });
}
