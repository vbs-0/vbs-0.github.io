/** The phone's display: a 2D canvas the build paints into, used as a texture on the screen. */
import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace } from 'three';
import { SCREEN_PX } from './dimensions';

export type ScreenPainter = (ctx: CanvasRenderingContext2D, width: number, height: number) => void;

export interface PhoneScreen {
  readonly canvas: HTMLCanvasElement;
  readonly texture: CanvasTexture;
  /** Repaints the screen and uploads it to the GPU. */
  paint(painter: ScreenPainter): void;
  dispose(): void;
}

export function createScreen(scale = 1, anisotropy = 4): PhoneScreen {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(SCREEN_PX.width * scale);
  canvas.height = Math.round(SCREEN_PX.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas is not available');

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = anisotropy;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = true;

  return {
    canvas,
    texture,
    paint(painter) {
      ctx.save();
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.clearRect(0, 0, SCREEN_PX.width, SCREEN_PX.height);
      painter(ctx, SCREEN_PX.width, SCREEN_PX.height);
      ctx.restore();
      texture.needsUpdate = true;
    },
    dispose() {
      texture.dispose();
    },
  };
}
