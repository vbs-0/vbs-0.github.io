import {
  AmbientLight, CatmullRomCurve3, Color, DirectionalLight, ExtrudeGeometry, Group, Mesh,
  MeshPhongMaterial, PerspectiveCamera, Scene, Shape, SphereGeometry, TorusKnotGeometry, TubeGeometry, Vector3,
} from 'three';
import { colorsFor, mountStage } from '@/lib/three/world-stage';

export function createPop(canvas: HTMLCanvasElement) {
  const color = colorsFor(canvas);
  return mountStage(canvas, ({ renderer }) => {
    const scene = new Scene();
    const camera = new PerspectiveCamera(33, 1, 0.1, 30);
    const rig = new Group();
    const knotMaterial = new MeshPhongMaterial({
      color: color('pink'), specular: new Color(color('glint')), shininess: 75,
    });
    const knot = new Mesh(new TorusKnotGeometry(1.16, .355, 160, 24, 2, 3), knotMaterial);
    rig.add(knot);
    scene.add(rig);

    const brass = new MeshPhongMaterial({ color: color('green'), specular: new Color(color('mint')), shininess: 34 });
    const glint = new Shape();
    glint.moveTo(0, .49);
    glint.quadraticCurveTo(.07, .08, .46, 0);
    glint.quadraticCurveTo(.07, -.08, 0, -.49);
    glint.quadraticCurveTo(-.07, -.08, -.46, 0);
    glint.quadraticCurveTo(-.07, .08, 0, .49);
    const spark = new Mesh(new ExtrudeGeometry(glint, {
      depth: .105, curveSegments: 9, bevelEnabled: true, bevelSegments: 2, bevelThickness: .06, bevelSize: .045,
    }), brass);
    spark.position.set(1.64, 1.04, .36);
    spark.rotation.z = -.25;

    const bracket = new Group();
    const enamel = new MeshPhongMaterial({ color: color('blue'), specular: new Color(color('sky')), shininess: 58 });
    for (const sign of [-1, 1]) {
      const path = new CatmullRomCurve3([
        new Vector3(sign * .21, .24, 0), new Vector3(sign * .48, .03, 0), new Vector3(sign * .21, -.22, 0),
      ]);
      bracket.add(new Mesh(new TubeGeometry(path, 20, .081, 8, false), enamel));
      for (const y of [.24, -.22]) {
        const cap = new Mesh(new SphereGeometry(.081, 12, 8), enamel);
        cap.position.set(sign * .21, y, 0);
        bracket.add(cap);
      }
    }
    bracket.position.set(-1.84, 1.29, .92);
    bracket.scale.setScalar(.83);
    bracket.rotation.set(-.15, .28, -.24);

    const bubble = new Mesh(new SphereGeometry(.245, 26, 18), new MeshPhongMaterial({
      color: color('sky'), specular: new Color(color('glint')), shininess: 85,
    }));
    bubble.position.set(1.48, -1.23, .67);
    scene.add(spark, bracket, bubble);

    const key = new DirectionalLight(color('glint'), 2.3);
    key.position.set(-3.5, 4.5, 5.5);
    const rim = new DirectionalLight(color('blush'), 1.45);
    rim.position.set(2, 1, -3);
    scene.add(new AmbientLight(color('glint'), .79), key, rim);

    let aimX = 0;
    let aimY = 0;
    let yaw = 0;
    let pitch = 0;
    let targetSpin = 0;
    let spin = 0;
    return {
      resize({ width, height }) {
        camera.aspect = width / height;
        camera.position.z = Math.max(7.4, 8.8 / camera.aspect);
        camera.updateProjectionMatrix();
      },
      draw(dt, t) {
        const ease = 1 - Math.exp(-dt * 5.6);
        yaw += (aimX - yaw) * ease;
        pitch += (aimY - pitch) * ease;
        spin += (targetSpin - spin) * (1 - Math.exp(-dt * 4.2));
        rig.rotation.set(.23 + pitch * .27 + Math.sin(t * .57) * .1, -.43 + yaw * .58 + t * .18 + spin, -.20 + Math.sin(t * .62) * .15);
        rig.position.y = Math.sin(t * 1.55) * .12;
        spark.rotation.y = Math.sin(t * 1.09 + yaw) * .6;
        spark.position.y = 1.10 + Math.sin(t * 1.9) * .2;
        bracket.rotation.z = -.24 + .14 * Math.sin(t * 1.23 + .6);
        bracket.position.y = 1.29 + .13 * Math.cos(t * 1.7);
        bubble.position.y = -1.25 + Math.sin(t * 1.7 + 1.4) * .14;
        renderer.render(scene, camera);
      },
      point(x, y) { aimX = x - .5; aimY = y - .5; },
      pulse() { targetSpin += Math.PI * 2; },
    };
  }, { maxDpr: 1.45, antialias: true });
}
