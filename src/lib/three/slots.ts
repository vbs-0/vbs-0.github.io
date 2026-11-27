/**
 * Slots: DOM elements that say where on the page the 3D subject should appear.
 * The canvas is fixed to the viewport; a scene reads the active slot's rectangle each frame
 * and frames its camera so the subject sits inside it. Layout stays in CSS.
 */
import type { OrthographicCamera, PerspectiveCamera } from 'three';

export interface SlotFrame {
  /** Centre of the slot in canvas CSS pixels. */
  cx: number;
  cy: number;
  width: number;
  height: number;
  /** How much of the slot is inside the viewport, 0 to 1. */
  visible: number;
}

export function measureSlot(el: Element, canvas: HTMLCanvasElement): SlotFrame {
  const r = el.getBoundingClientRect();
  const c = canvas.getBoundingClientRect();
  const left = Math.max(r.left, c.left);
  const right = Math.min(r.right, c.right);
  const top = Math.max(r.top, c.top);
  const bottom = Math.min(r.bottom, c.bottom);
  const area = Math.max(0, right - left) * Math.max(0, bottom - top);
  const full = Math.max(1, r.width * r.height);
  return {
    cx: r.left - c.left + r.width / 2,
    cy: r.top - c.top + r.height / 2,
    width: r.width,
    height: r.height,
    visible: area / full,
  };
}

/** The slot that currently shows the largest share of itself; ties go to the earlier element. */
export function mostVisible(slots: Element[], canvas: HTMLCanvasElement): { el: Element; frame: SlotFrame } | undefined {
  let best: { el: Element; frame: SlotFrame } | undefined;
  for (const el of slots) {
    const frame = measureSlot(el, canvas);
    if (frame.width < 2 || frame.height < 2) continue;
    if (!best || frame.visible > best.frame.visible + 0.001) best = { el, frame };
  }
  return best;
}

/**
 * Frames a perspective camera so that a subject of `subjectHeight` world units, centred on the origin
 * at `distance` from the camera, fills `fill` of the slot's height and sits at the slot's centre.
 * Uses a view offset (a lens shift), so the subject is not skewed when the slot is off-centre.
 */
export function framePerspective(
  camera: PerspectiveCamera,
  canvasW: number,
  canvasH: number,
  cx: number,
  cy: number,
  slotH: number,
  subjectHeight: number,
  distance: number,
  fill = 0.9,
): void {
  const visibleHeightAtDistance = 2 * distance * Math.tan((camera.fov * Math.PI) / 360);
  // zoom 1 shows `visibleHeightAtDistance` across the full canvas height
  camera.zoom = (fill * slotH * visibleHeightAtDistance) / (subjectHeight * canvasH);
  camera.aspect = canvasW / canvasH;
  camera.setViewOffset(canvasW, canvasH, canvasW / 2 - cx, canvasH / 2 - cy, canvasW, canvasH);
  camera.updateProjectionMatrix();
}

/** The orthographic equivalent: `subjectHeight` world units fill `fill` of the slot's height. */
export function frameOrthographic(
  camera: OrthographicCamera,
  canvasW: number,
  canvasH: number,
  cx: number,
  cy: number,
  slotH: number,
  subjectHeight: number,
  fill = 0.9,
): void {
  const worldPerPixel = subjectHeight / (fill * slotH);
  const halfW = (canvasW * worldPerPixel) / 2;
  const halfH = (canvasH * worldPerPixel) / 2;
  const shiftX = (canvasW / 2 - cx) * worldPerPixel;
  const shiftY = (cy - canvasH / 2) * worldPerPixel;
  camera.left = -halfW + shiftX;
  camera.right = halfW + shiftX;
  camera.top = halfH + shiftY;
  camera.bottom = -halfH + shiftY;
  camera.zoom = 1;
  camera.updateProjectionMatrix();
}
