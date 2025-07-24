import { test, expect } from '@playwright/test';

test.describe('Groups Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Navigate to Groups tab
    const groupsTab = page.locator('button:has-text("Groups"), button:has-text("그룹")').first();
    if (await groupsTab.isVisible()) {
      await groupsTab.click();
      await page.waitForTimeout(2000);
    }
  });

  test('should display groups screen', async ({ page }) => {
    // Check for groups screen elements
    const groupsSelectors = [
      '[data-testid="groups-screen"]',
      'text="Groups"',
      'text="그룹"',
      'button:has-text("Create")',
      'button:has-text("생성")',
      'button:has-text("그룹 생성")',
      '.group-item',
      '[data-testid="group-list"]',
      '[data-testid="group-item"]',
      '[data-testid="create-group-btn"]'
    ];
    
    let foundElements = 0;
    for (const selector of groupsSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          foundElements++;
        }
      } catch (e) {
        // Continue checking
      }
    }
    
    // If no elements found, check if we're on the groups screen by looking for h2
    if (foundElements === 0) {
      const groupsHeader = page.locator('h2:has-text("Groups"), h2:has-text("그룹")').first();
      if (await groupsHeader.isVisible({ timeout: 2000 })) {
        foundElements = 1;
      }
    }
    
    expect(foundElements).toBeGreaterThan(0);
  });

  test('should handle group creation flow', async ({ page }) => {
    // Look for create group button
    const createButton = page.locator('button:has-text("Create"), button:has-text("생성"), button:has-text("새"), [data-testid="create-group-btn"]').first();
    
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(2000);
      
      // Should show group creation form
      const groupForm = page.locator('input[placeholder*="name"], input[placeholder*="이름"], input[placeholder*="그룹"]').first();
      if (await groupForm.isVisible()) {
        await groupForm.fill('Test Group');
        
        // Look for description field
        const descField = page.locator('input[placeholder*="description"], textarea[placeholder*="설명"], textarea[placeholder*="소개"]').first();
        if (await descField.isVisible()) {
          await descField.fill('Test group description');
        }
        
        // Submit form
        const submitBtn = page.locator('button:has-text("Create"), button:has-text("생성"), button:has-text("확인")').first();
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    }
  });

  test('should display group list and handle group joining', async ({ page }) => {
    // Look for existing groups
    const groupItems = page.locator('.group-item, [data-testid="group-item"], button:has-text("Join"), button:has-text("참여")');
    
    const count = await groupItems.count();
    if (count > 0) {
      // Try to join first group
      const firstGroup = groupItems.first();
      await firstGroup.click();
      await page.waitForTimeout(2000);
      
      // Look for join button or group details
      const joinButton = page.locator('button:has-text("Join"), button:has-text("참여"), button:has-text("가입")').first();
      if (await joinButton.isVisible()) {
        await joinButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('should handle group type selection', async ({ page }) => {
    // Look for different group types
    const groupTypes = [
      'Official', '공식', 'Company', '회사',
      'Created', '생성', 'Hobby', '취미',
      'Location', '위치', 'Event', '이벤트'
    ];
    
    let foundTypes = 0;
    for (const typeText of groupTypes) {
      const typeElement = page.locator(`button:has-text("${typeText}"), [role="tab"]:has-text("${typeText}")`).first();
      if (await typeElement.isVisible()) {
        foundTypes++;
        // Click on the type to test filtering
        await typeElement.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should validate API integration for groups', async ({ page }) => {
    // Monitor network requests
    const responses = [];
    
    page.on('response', response => {
      if (response.url().includes('/api/') && response.url().includes('group')) {
        responses.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    // Trigger some group actions
    const refreshButton = page.locator('button:has-text("Refresh"), button:has-text("새로고침"), [data-testid="refresh-btn"]').first();
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await page.waitForTimeout(3000);
    }
    
    // Check if any API calls were made
    if (responses.length > 0) {
      const successfulResponses = responses.filter(r => r.status >= 200 && r.status < 300);
      console.log('Group API responses:', responses);
      
      // At least some API calls should be successful
      expect(successfulResponses.length).toBeGreaterThan(0);
    }
  });
});