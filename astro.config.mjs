import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { siteConfig } from './site.config.ts';

export default defineConfig({
  site: siteConfig.site,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  compressHTML: true,
  devToolbar: { enabled: false },
  integrations: [
    sitemap(),
    {
      // /lab/ is a viewer for the 3D phone, used while developing and by scripts/capture-posters.mjs. Dev only.
      name: 'lab-route',
      hooks: {
        'astro:config:setup': ({ command, injectRoute }) => {
          if (command === 'dev') injectRoute({ pattern: '/lab', entrypoint: './src/lab/index.astro' });
        },
      },
    },
  ],
  vite: {
    build: { chunkSizeWarningLimit: 900 },
  },
});
