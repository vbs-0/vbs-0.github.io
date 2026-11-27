/**
 * The phone, in millimetres. Origin at the centre of the body.
 * X to the right when you look at the screen, Y up, Z out of the screen towards you.
 * A generic slab phone with the proportions of the Redmi 13C 5G (168 x 77.9 x 8.1 mm).
 */
export const PHONE = {
  width: 77,
  height: 168,
  thickness: 8.2,
  corner: 9.5,
  /** The model root is scaled by this, so the phone is 1.68 world units tall. */
  scale: 0.01,
} as const;

/** Front (+Z) and back (-Z) faces of the body. */
export const Z_FRONT = PHONE.thickness / 2;
export const Z_BACK = -PHONE.thickness / 2;

export const GLASS = { inset: 0.6, thickness: 0.7 } as const;
export const DISPLAY = { inset: 1.5, thickness: 0.9, bezel: 1.7, chin: 3.4 } as const;
export const FRAME = { wall: 1.7, depth: 6.6, plate: 0.6 } as const;
export const BACK = { thickness: 0.8, inset: 0.2 } as const;

/** Logic board: the top third, behind the mid-plate. Components sit on its back face. */
export const BOARD = { width: 68, height: 46, y: 56, thickness: 1, z: -0.4 } as const;
export const BATTERY = { width: 62, height: 80, y: -9.5, thickness: 4.4, z: -1.5 } as const;
export const SUBBOARD = { width: 66, height: 16, y: -69, thickness: 0.9, z: -0.4 } as const;

/** Rear cameras, top-left when you look at the back (so +X in phone space). */
export const CAMERA = { x: 21, yMain: 65, ySecond: 47, main: 12, second: 8.4, depth: 4.4 } as const;

/** How far each part travels along Z when the phone is fully taken apart. */
export const EXPLODE = {
  glass: 50,
  display: 32,
  frame: 10,
  board: -14,
  soc: -14,
  shield: -14,
  camera: -14,
  battery: -26,
  subboard: -14,
  back: -50,
} as const;

/** Extra travel for the parts that lift clear when their layer is selected. */
export const LIFT = { shield: -16, camera: -12, soc: -2 } as const;

/** Screen texture size in pixels. 9:20, like the panel. */
export const SCREEN_PX = { width: 432, height: 960 } as const;
