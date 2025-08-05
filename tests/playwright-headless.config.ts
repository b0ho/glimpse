import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 30000,

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'off',
    video: 'off',
    screenshot: 'off',
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...require('@playwright/test').devices['Desktop Chrome'],
        headless: true,
      },
    },
  ],
});