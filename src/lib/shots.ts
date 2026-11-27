/** Resolves a content image key ("pam/web-folio.png") to the imported asset Astro can optimise. */
import type { ImageMetadata } from 'astro';

const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/projects/**/*.{png,jpg,jpeg,webp}', { eager: true });

export function shotImage(file: string): ImageMetadata {
  const mod = files[`/src/assets/projects/${file}`];
  if (!mod) throw new Error(`No image at src/assets/projects/${file}`);
  return mod.default;
}
