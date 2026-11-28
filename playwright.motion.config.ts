import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/motion',
  timeout: 35_000,
  workers: 2,
  use: {
    channel: 'chrome',
    baseURL: 'http://127.0.0.1:4351',
    launchOptions: { args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1100, height: 800 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: 'chrome', deviceScaleFactor: 1 } },
  ],
  webServer: {
    command: 'npm run motion:preview',
    url: 'http://127.0.0.1:4351',
    reuseExistingServer: true,
    env: { VITE_CONFIG_NATIVE_IGNORE_WARNING: 'true' },
  },
});
