import { defineConfig } from '@playwright/test';

/**
 * End-to-end checks run against the built site (npm run build) served by `astro preview`.
 * They use the Chrome that is already installed, so no browser download is needed.
 * Software WebGL is switched on so the 3D scenes run headless.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: true,
  // Software WebGL is slow; a few workers keep the 3D pages responsive enough to test.
  workers: 3,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4322',
    channel: process.env.CI ? undefined : 'chrome',
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
  },
  webServer: {
    command: 'npx astro preview --port 4322 --host 127.0.0.1',
    url: 'http://127.0.0.1:4322/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: { ASTRO_TELEMETRY_DISABLED: '1' },
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'phone', use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
  ],
});
