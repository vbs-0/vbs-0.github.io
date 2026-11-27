import { Box3, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { PHONE } from '@/lib/three/phone/dimensions';
import { CALLOUT_ORDER, PART_ORDER, buildPhone } from '@/lib/three/phone/model';
import { PhoneRig } from '@/lib/three/phone/rig';

function bounds(model: ReturnType<typeof buildPhone>, parts = PART_ORDER) {
  const b = new Box3();
  for (const item of model.items) {
    if (!parts.includes(item.part)) continue;
    item.geometry.computeBoundingBox();
    b.union(item.geometry.boundingBox as Box3);
  }
  return b;
}

describe('buildPhone', () => {
  const model = buildPhone();
  it('has every part, each with geometry', () => {
    for (const p of PART_ORDER) expect(model.parts[p].items.length, p).toBeGreaterThan(0);
    expect(model.items.every((i) => i.geometry.getAttribute('position').count > 0)).toBe(true);
  });
  it('fits the body the dimensions describe', () => {
    const size = bounds(model).getSize(new Vector3());
    expect(size.x).toBeGreaterThan(PHONE.width - 0.5);
    expect(size.x).toBeLessThan(PHONE.width + 1.5);
    expect(size.y).toBeCloseTo(PHONE.height, 0);
    expect(size.z).toBeLessThan(PHONE.thickness + 2.2);
  });
  it('keeps the internals inside the frame', () => {
    const inner = bounds(model, ['board', 'shield', 'soc', 'battery', 'subboard']);
    expect(inner.min.x).toBeGreaterThan(-PHONE.width / 2 + 1);
    expect(inner.max.x).toBeLessThan(PHONE.width / 2 - 1);
    expect(inner.min.y).toBeGreaterThan(-PHONE.height / 2 + 1);
    expect(inner.max.y).toBeLessThan(PHONE.height / 2 - 1);
    expect(inner.min.z).toBeGreaterThan(-PHONE.thickness / 2);
    expect(inner.max.z).toBeLessThan(PHONE.thickness / 2);
  });
  it('defines the six callouts on real parts', () => {
    expect(Object.keys(model.callouts).sort()).toEqual([...CALLOUT_ORDER].sort());
    for (const id of CALLOUT_ORDER) {
      expect(PART_ORDER).toContain(model.callouts[id].part);
      expect(model.callouts[id].highlight.length).toBeGreaterThan(0);
    }
  });
  it('builds a lighter model for weak devices and a sharp one for the ink drawing', () => {
    expect(buildPhone({ detail: 'lite' }).items.length).toBeLessThan(model.items.length);
    const tris = (m: typeof model) => m.items.reduce((n, i) => n + (i.geometry.index ? i.geometry.index.count : i.geometry.getAttribute('position').count) / 3, 0);
    expect(tris(buildPhone({ bevel: false }))).toBeLessThan(tris(model));
  });
});

describe('PhoneRig', () => {
  it('moves every part to its exploded position and back', () => {
    const rig = new PhoneRig(buildPhone({ detail: 'lite' }));
    rig.update(0.016, true);
    for (const p of PART_ORDER) expect(rig.model.parts[p].group.position.z).toBe(0);
    rig.explode = 1;
    rig.update(0.016, true);
    for (const p of PART_ORDER) expect(rig.model.parts[p].group.position.z).toBeCloseTo(rig.model.parts[p].explodeZ, 3);
    expect(rig.model.parts.glass.group.position.z).toBeGreaterThan(rig.model.parts.back.group.position.z);
  });
  it('lifts the shield clear of the chip only when the phone is apart', () => {
    const rig = new PhoneRig(buildPhone({ detail: 'lite' }));
    rig.active = 'soc';
    rig.update(0.016, true);
    expect(rig.model.parts.shield.group.position.z).toBe(0);
    rig.explode = 1;
    rig.update(0.016, true);
    rig.update(0.016, true);
    expect(rig.model.parts.shield.group.position.z).toBeLessThan(rig.model.parts.soc.group.position.z - 5);
    expect(rig.focus.soc).toBeCloseTo(1, 3);
    expect(rig.focus.battery).toBeCloseTo(0, 3);
    expect(rig.dim).toBeCloseTo(1, 3);
  });
  it('eases instead of jumping, and reports when it has settled', () => {
    const rig = new PhoneRig(buildPhone({ detail: 'lite' }));
    rig.explode = 1;
    expect(rig.update(1 / 60)).toBe(true);
    expect(rig.amount).toBeGreaterThan(0);
    expect(rig.amount).toBeLessThan(0.5);
    for (let i = 0; i < 600; i++) rig.update(1 / 60);
    expect(rig.update(1 / 60)).toBe(false);
    expect(rig.amount).toBeCloseTo(1, 3);
  });
  it('reports callout anchors in world units', () => {
    const rig = new PhoneRig(buildPhone({ detail: 'lite' }));
    rig.update(0.016, true);
    const a = rig.anchorWorld('display');
    expect(Math.abs(a.x)).toBeLessThan(PHONE.width * PHONE.scale);
    expect(a.z).toBeGreaterThan(0);
    rig.explode = 1;
    rig.update(0.016, true);
    expect(rig.anchorWorld('display').z).toBeGreaterThan(a.z + 0.2);
  });
});
