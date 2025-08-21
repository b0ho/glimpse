import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 테스트 설정
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never' }]
  ],
  timeout: 60000,
  
  use: {
    baseURL: 'http://localhost:3004',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'Mobile Test',
      use: { 
        ...devices['iPhone 14 Pro'],
        permissions: ['geolocation'],
        locale: 'ko-KR',
        viewport: { width: 390, height: 844 },
      },
    },
  ],

  webServer: [
    {
      command: 'cd server && npm run dev',
      port: 3001,
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
    {
      command: 'cd admin && npm run dev',
      port: 3004,
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
    {
      command: 'cd mobile && npm start',
      port: 8081,
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
  ],
});