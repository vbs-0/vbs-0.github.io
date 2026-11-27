/** Pure helpers for the Film build: the playhead, the shot blend and the rolling counters. Unit-tested. */
import { clamp } from '@/lib/three/math';

/** "HH:MM:SS:FF" at `fps` frames per second. */
export function timecode(seconds: number, fps = 24): string {
  const total = Math.max(0, Math.floor(seconds * fps));
  const frames = total % fps;
  const s = Math.floor(total / fps);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(frames)}`;
}

/**
 * Where the camera is between scenes. `centers` are the scroll positions at which each scene sits
 * centred in the viewport, in order; `y` is the current centre line. Returns a continuous index:
 * 2 means scene 2 is centred, 2.5 means halfway to scene 3. Clamped to the first and the last scene.
 */
export function playhead(centers: number[], y: number): number {
  const first = centers[0];
  if (first === undefined || y <= first) return 0;
  for (let i = 0; i < centers.length - 1; i++) {
    const a = centers[i] as number;
    const b = centers[i + 1] as number;
    if (y < b) return i + (b > a ? (y - a) / (b - a) : 0);
  }
  return centers.length - 1;
}

/** The two shots to blend, and how far between them, for a continuous index over `count` shots. */
export function blend(index: number, count: number): { a: number; b: number; t: number } {
  if (count < 2) return { a: 0, b: 0, t: 0 };
  const c = clamp(index, 0, count - 1);
  const a = Math.min(count - 2, Math.floor(c));
  return { a, b: a + 1, t: c - a };
}

export type Glyph = { digit: number } | { char: string };

/** Splits a measured value ("97.99%", "1,004,038", "~46 KB") into rolling digits and fixed characters. */
export function glyphs(value: string): Glyph[] {
  return [...value].map((c) => (c >= '0' && c <= '9' ? { digit: c.charCodeAt(0) - 48 } : { char: c }));
}
