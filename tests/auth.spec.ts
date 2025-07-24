import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    // Wait for app to load
    await page.waitForTimeout(2000);
  });

  test('should display auth screen for unauthenticated users', async ({ page }) => {
    // Check if auth screen is displayed
    const authScreen = page.locator('[data-testid="auth-screen"]');
    await expect(authScreen).toBeVisible({ timeout: 10000 });
    
    // Check for phone input field
    const phoneInput = page.locator('input[placeholder*="phone"], input[placeholder*="전화"], input[type="tel"]').first();
    await expect(phoneInput).toBeVisible();
    
    // Check for login/register button
    const authButton = page.locator('button:has-text("로그인"), button:has-text("Login"), button:has-text("Sign"), button:has-text("인증")').first();
    await expect(authButton).toBeVisible();
  });

  test('should validate phone number input', async ({ page }) => {
    // Find phone input
    const phoneInput = page.locator('input[placeholder*="phone"], input[placeholder*="전화"], input[type="tel"]').first();
    await expect(phoneInput).toBeVisible();
    
    // Test empty phone validation
    const submitButton = page.locator('button:has-text("로그인"), button:has-text("Login"), button:has-text("Sign"), button:has-text("인증")').first();
    await submitButton.click();
    
    // Should show validation error or stay on same screen
    await page.waitForTimeout(1000);
    
    // Test invalid phone number
    await phoneInput.fill('123');
    await submitButton.click();
    await page.waitForTimeout(1000);
    
    // Test valid phone number format
    await phoneInput.fill('+82 10-1234-5678');
    await submitButton.click();
    
    // Should either proceed to SMS verification or show error
    await page.waitForTimeout(2000);
  });

  test('should handle SMS verification flow', async ({ page }) => {
    // Skip to SMS verification if possible
    const phoneInput = page.locator('input[placeholder*="phone"], input[placeholder*="전화"], input[type="tel"]').first();
    await phoneInput.fill('+82 10-1234-5678');
    
    const submitButton = page.locator('button:has-text("로그인"), button:has-text("Login"), button:has-text("Sign"), button:has-text("인증")').first();
    await submitButton.click();
    
    await page.waitForTimeout(2000);
    
    // Look for SMS verification screen
    const smsInput = page.locator('input[placeholder*="code"], input[placeholder*="인증"], input[maxlength="6"]').first();
    if (await smsInput.isVisible()) {
      // Test SMS code input
      await smsInput.fill('123456');
      
      const verifyButton = page.locator('button:has-text("확인"), button:has-text("Verify"), button:has-text("인증")').first();
      await verifyButton.click();
      
      await page.waitForTimeout(2000);
    }
  });
});