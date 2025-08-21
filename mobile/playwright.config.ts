import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8082',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 }, // iPhone 14 Pro size
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
      },
    },
  ],

  webServer: [
    {
      command: 'cd /Users/b0ho/git/glimpse/server && npm run dev',
      port: 3001,
      reuseExistingServer: true,
      timeout: 60000,
    },
    {
      command: 'cd /Users/b0ho/git/glimpse/mobile && npx expo start --web --clear --port 8082',
      port: 8082,
      reuseExistingServer: true,
      timeout: 60000,
    }
  ],
});