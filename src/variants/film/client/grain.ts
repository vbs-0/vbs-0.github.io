/** Film grain: a small tile of white specks, made once on a 2D canvas and stepped on the compositor. */
import { seededRandom } from '@/lib/three/math';

export function filmGrain(): void {
  const size = 160;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const image = ctx.createImageData(size, size);
  const rand = seededRandom(24);
  for (let i = 0; i < image.data.length; i += 4) {
    image.data[i] = 255;
    image.data[i + 1] = 255;
    image.data[i + 2] = 255;
    image.data[i + 3] = Math.round(rand() ** 3 * 255);
  }
  ctx.putImageData(image, 0, 0);
  canvas.toBlob((blob) => {
    if (blob) document.documentElement.style.setProperty('--grain-img', `url("${URL.createObjectURL(blob)}")`);
  });
}
