import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 테스트 설정
 */
export default defineConfig({
  testDir: './server/tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 60000,
  
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    actionTimeout: 10000,
  },

  projects: [
    {
      name: 'Mobile Test',
      use: { 
        ...devices['iPhone 12'],
        permissions: ['geolocation'],
        locale: 'ko-KR',
        viewport: { width: 390, height: 844 },
      },
    },
  ],

  webServer: [
    {
      command: 'npm run dev:server',
      port: 3001,
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