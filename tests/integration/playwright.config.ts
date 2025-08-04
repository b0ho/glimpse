import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './scenarios',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  
  use: {
    baseURL: process.env.API_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'api-tests',
      use: {
        ...devices['Desktop Chrome'],
        extraHTTPHeaders: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      },
    },
  ],

  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),
});