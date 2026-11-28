import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { defineConfig, type UserConfig } from 'vite';
import { profile, projectById } from './src/content';
import { imageName, plateFor, renderWorld } from './motion/template';
import { worldIds, worlds, type World } from './motion/worlds';

const repo = dirname(fileURLToPath(import.meta.url));
const root = resolve(repo, 'motion');
const publicDir = resolve(root, '.media');

export default defineConfig(async (): Promise<UserConfig> => {
  const resume = resolve(publicDir, profile.resumePath.slice(1));
  await Promise.all([mkdir(dirname(resume), { recursive: true }), mkdir(resolve(publicDir, 'work-plates'), { recursive: true })]);
  await Promise.all([
    copyFile(resolve(repo, 'public', profile.resumePath.slice(1)), resume),
    copyFile(resolve(repo, 'public/favicon.svg'), resolve(publicDir, 'favicon.svg')),
    ...[...new Set(worldIds.flatMap((id) => [...worlds[id].projectIds]))].map(async (id) => {
      const shot = plateFor(projectById(id));
      if (!shot) return;
      await sharp(resolve(repo, 'src/assets/projects', shot.file))
        .resize({ width: 1000, withoutEnlargement: true }).webp({ quality: 79 }).toFile(resolve(publicDir, imageName(id)));
    }),
  ]);

  let base = '/';
  return {
    root, publicDir, appType: 'mpa',
    server: { host: '127.0.0.1', port: 4350, strictPort: true, fs: { allow: [repo] } },
    preview: { host: '127.0.0.1', port: 4351, strictPort: true },
    build: {
      outDir: resolve(repo, 'dist-motion'),
      emptyOutDir: true,
      chunkSizeWarningLimit: 690,
      rolldownOptions: {
        input: Object.fromEntries(worldIds.map((id) => [id, resolve(root, worlds[id].path, 'index.html')])),
      },
    },
    plugins: [{
      name: 'vbs-static-motion-pages',
      configResolved(config) { base = config.base; },
      transformIndexHtml: {
        order: 'pre',
        handler(html) {
          const id = /<!-- vbs-world: (\w+) -->/.exec(html)?.[1] as World | undefined;
          if (!id || !worldIds.includes(id)) return html;
          return renderWorld(id, base);
        },
      },
    }],
  };
});
