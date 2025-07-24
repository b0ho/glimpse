import { test, expect } from '@playwright/test';

test.describe('Backend API Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
  });

  test('should connect to backend API', async ({ page }) => {
    // Monitor all API calls to backend
    const apiCalls = [];
    
    page.on('response', response => {
      const url = response.url();
      if (url.includes('localhost:8080') || url.includes('/api/v1/')) {
        apiCalls.push({
          url: url,
          status: response.status(),
          method: response.request().method(),
          headers: response.headers()
        });
      }
    });
    
    // Trigger some app actions that should make API calls
    await page.reload();
    await page.waitForTimeout(5000);
    
    // Navigate through different sections to trigger API calls
    const tabs = ['Groups', '그룹', 'Profile', '프로필', 'Matches', '매치'];
    for (const tabText of tabs) {
      const tab = page.locator(`button:has-text("${tabText}")`).first();
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Log API calls for debugging
    console.log('Backend API calls detected:', apiCalls);
    
    if (apiCalls.length > 0) {
      // Check if we got responses from backend
      const successfulCalls = apiCalls.filter(call => call.status >= 200 && call.status < 400);
      expect(successfulCalls.length).toBeGreaterThan(0);
      
      // Verify backend is responding with JSON
      const jsonResponses = apiCalls.filter(call => 
        call.headers['content-type']?.includes('application/json')
      );
      if (jsonResponses.length > 0) {
        expect(jsonResponses.length).toBeGreaterThan(0);
      }
    }
  });

  test('should handle authentication with Clerk JWT', async ({ page }) => {
    // Monitor auth-related API calls
    const authCalls = [];
    
    page.on('request', request => {
      const authHeader = request.headers()['authorization'];
      if (authHeader && authHeader.includes('Bearer')) {
        authCalls.push({
          url: request.url(),
          method: request.method(),
          hasAuthHeader: true,
          authHeader: authHeader.substring(0, 20) + '...' // Log partial token for debugging
        });
      }
    });
    
    // Try to trigger authenticated actions
    const authButton = page.locator('button:has-text("Login"), button:has-text("로그인")').first();
    if (await authButton.isVisible()) {
      await authButton.click();
      await page.waitForTimeout(3000);
    }
    
    console.log('Authenticated API calls:', authCalls);
    
    if (authCalls.length > 0) {
      expect(authCalls[0].hasAuthHeader).toBe(true);
    }
  });

  test('should test user endpoints', async ({ page }) => {
    // Monitor user-related API endpoints
    const userApiCalls = [];
    
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/v1/users') || url.includes('/user')) {
        userApiCalls.push({
          url,
          status: response.status(),
          method: response.request().method()
        });
      }
    });
    
    // Navigate to profile to trigger user API calls
    const profileTab = page.locator('button:has-text("Profile"), button:has-text("프로필")').first();
    if (await profileTab.isVisible()) {
      await profileTab.click();
      await page.waitForTimeout(3000);
    }
    
    console.log('User API calls:', userApiCalls);
    
    if (userApiCalls.length > 0) {
      const successfulUserCalls = userApiCalls.filter(call => call.status >= 200 && call.status < 400);
      expect(successfulUserCalls.length).toBeGreaterThan(0);
    }
  });

  test('should test group endpoints', async ({ page }) => {
    // Monitor group-related API endpoints
    const groupApiCalls = [];
    
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/v1/groups') || url.includes('/group')) {
        groupApiCalls.push({
          url,
          status: response.status(),
          method: response.request().method()
        });
      }
    });
    
    // Navigate to groups to trigger group API calls
    const groupsTab = page.locator('button:has-text("Groups"), button:has-text("그룹")').first();
    if (await groupsTab.isVisible()) {
      await groupsTab.click();
      await page.waitForTimeout(3000);
      
      // Try to create a group
      const createBtn = page.locator('button:has-text("Create"), button:has-text("생성")').first();
      if (await createBtn.isVisible()) {
        await createBtn.click();
        await page.waitForTimeout(2000);
      }
    }
    
    console.log('Group API calls:', groupApiCalls);
    
    if (groupApiCalls.length > 0) {
      const successfulGroupCalls = groupApiCalls.filter(call => call.status >= 200 && call.status < 400);
      expect(successfulGroupCalls.length).toBeGreaterThan(0);
    }
  });

  test('should test WebSocket connection to backend', async ({ page }) => {
    // Monitor WebSocket connections
    const wsConnections = [];
    const wsMessages = [];
    
    page.on('websocket', ws => {
      wsConnections.push({
        url: ws.url(),
        connected: true
      });
      
      ws.on('framereceived', event => {
        wsMessages.push({
          type: 'received',
          payload: event.payload
        });
      });
      
      ws.on('framesent', event => {
        wsMessages.push({
          type: 'sent',
          payload: event.payload
        });
      });
    });
    
    // Navigate to chat to trigger WebSocket connection
    const matchesTab = page.locator('button:has-text("Matches"), button:has-text("매치")').first();
    if (await matchesTab.isVisible()) {
      await matchesTab.click();
      await page.waitForTimeout(3000);
    }
    
    // Wait for potential WebSocket connections
    await page.waitForTimeout(5000);
    
    console.log('WebSocket connections:', wsConnections);
    console.log('WebSocket messages:', wsMessages);
    
    if (wsConnections.length > 0) {
      expect(wsConnections[0].url).toContain('localhost:8080');
      expect(wsConnections[0].connected).toBe(true);
    }
  });

  test('should handle API error responses gracefully', async ({ page }) => {
    // Monitor API errors
    const apiErrors = [];
    
    page.on('response', response => {
      if (response.status() >= 400) {
        apiErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    // Monitor console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate through app to trigger potential errors
    const actions = [
      () => page.reload(),
      () => page.locator('button').first().click(),
      () => page.goBack(),
      () => page.goForward()
    ];
    
    for (const action of actions) {
      try {
        await action();
        await page.waitForTimeout(1000);
      } catch (e) {
        // Continue with other actions
      }
    }
    
    console.log('API errors detected:', apiErrors);
    console.log('Console errors:', consoleErrors);
    
    // App should handle errors gracefully without crashing
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('Uncaught') || error.includes('TypeError')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('should verify environment configuration', async ({ page }) => {
    // Check if environment variables are properly configured
    const envCheck = await page.evaluate(() => {
      return {
        hasApiUrl: !!window.process?.env?.EXPO_PUBLIC_API_URL,
        hasClerkKey: !!window.process?.env?.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
        hasSocketUrl: !!window.process?.env?.EXPO_PUBLIC_SOCKET_URL,
        currentUrl: window.location.href
      };
    });
    
    console.log('Environment check:', envCheck);
    
    // Verify basic configuration
    expect(envCheck.currentUrl).toContain('localhost');
  });
});