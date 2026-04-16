import { defineConfig } from '@playwright/test';

const PORT = 5173;

export default defineConfig({
  testDir: './tests/ui',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
  },
  globalSetup: './tests/ui/global-setup.ts',
  globalTeardown: './tests/ui/global-teardown.ts',
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
