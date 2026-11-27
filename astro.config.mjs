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
  integrations: [sitemap()],
  vite: {
    build: { chunkSizeWarningLimit: 900 },
  },
});
