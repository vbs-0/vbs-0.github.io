/**
 * Moves the phone: taking it apart, lifting the selected part clear, and turning it to face the viewer.
 * Style-independent. A build sets the targets; `update` eases everything towards them.
 */
import { Vector3 } from 'three';
import type { PhonePartId } from '@/content/types';
import { damp, dampAngle } from '../math';
import { PART_ORDER, type PartName, type PhoneModel } from './model';

export class PhoneRig {
  /** Target explode amount, 0 (assembled) to 1 (fully apart). */
  explode = 0;
  /** The selected callout, or null. */
  active: PhonePartId | null = null;
  /** Target rotation of the whole phone, radians. */
  yaw = 0;
  pitch = 0;
  roll = 0;
  /** Easing speeds (higher is snappier). */
  speed = { explode: 4.5, lift: 6, turn: 3.6, focus: 7 };

  /** Current highlight of each part, 0 to 1. Styles read this to tint the selected part. */
  readonly focus: Record<PartName, number>;
  /** 1 while any callout is selected: styles dim the parts that are not in focus. */
  dim = 0;
  /** Current explode amount. */
  amount = 0;

  private readonly lift: Record<PartName, number>;
  private readonly aside: Record<PartName, number>;
  private readonly tmp = new Vector3();

  constructor(readonly model: PhoneModel) {
    this.focus = Object.fromEntries(PART_ORDER.map((p) => [p, 0])) as Record<PartName, number>;
    this.lift = Object.fromEntries(PART_ORDER.map((p) => [p, 0])) as Record<PartName, number>;
    this.aside = Object.fromEntries(PART_ORDER.map((p) => [p, 0])) as Record<PartName, number>;
  }

  /**
   * Advances the animation. With `instant` everything jumps to its target (reduced motion, first frame).
   * Returns true while something is still moving, so on-demand rendering knows to keep going.
   */
  update(dt: number, instant = false): boolean {
    const k = (speed: number) => (instant ? 1e6 : speed);
    const callout = this.active ? this.model.callouts[this.active] : undefined;
    let moving = false;
    const settle = (prev: number, next: number, eps = 1e-4) => {
      if (Math.abs(next - prev) > eps) moving = true;
      return next;
    };

    this.amount = settle(this.amount, damp(this.amount, this.explode, k(this.speed.explode), dt));
    this.dim = settle(this.dim, damp(this.dim, callout ? 1 : 0, k(this.speed.focus), dt));

    for (const name of PART_ORDER) {
      const part = this.model.parts[name];
      // A lift only applies once the phone is apart, otherwise parts would poke through the case.
      const liftTarget = (callout?.lift[name] ?? 0) * this.amount;
      this.lift[name] = settle(this.lift[name], damp(this.lift[name], liftTarget, k(this.speed.lift), dt), 1e-3);
      part.group.position.z = part.explodeZ * this.amount + this.lift[name];
      const asideTarget = (callout?.aside[name] ?? 0) * this.amount;
      this.aside[name] = settle(this.aside[name], damp(this.aside[name], asideTarget, k(this.speed.lift), dt), 1e-3);
      part.group.position.x = this.aside[name];
      const focusTarget = callout?.highlight.includes(name) ? 1 : 0;
      this.focus[name] = settle(this.focus[name], damp(this.focus[name], focusTarget, k(this.speed.focus), dt));
    }

    const r = this.model.root.rotation;
    r.y = settle(r.y, dampAngle(r.y, this.yaw, k(this.speed.turn), dt));
    r.x = settle(r.x, damp(r.x, this.pitch, k(this.speed.turn), dt));
    r.z = settle(r.z, damp(r.z, this.roll, k(this.speed.turn), dt));
    return moving;
  }

  /** World position of a callout's anchor, for leader lines and labels. */
  anchorWorld(id: PhonePartId, out = new Vector3()): Vector3 {
    const c = this.model.callouts[id];
    this.model.root.updateWorldMatrix(true, false);
    const group = this.model.parts[c.part].group;
    group.updateWorldMatrix(true, false);
    return out.copy(c.anchor).applyMatrix4(group.matrixWorld);
  }

  /** Depth of the exploded stack in world units, for camera framing. */
  explodedDepth(): number {
    const zs = PART_ORDER.map((p) => this.model.parts[p].explodeZ);
    return (Math.max(...zs) - Math.min(...zs)) * this.model.root.scale.x;
  }

  /** Scratch vector for callers that want to avoid allocating. */
  get scratch(): Vector3 {
    return this.tmp;
  }
}
