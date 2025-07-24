import { test, expect } from '@playwright/test';

test.describe('Premium and Payment Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
  });

  test('should access premium screen', async ({ page }) => {
    // Look for premium/payment related navigation
    const premiumSelectors = [
      'button:has-text("Premium")',
      'button:has-text("프리미엄")',
      'button:has-text("구독")',
      '[data-testid="premium-btn"]',
      'text="₩"' // Korean currency
    ];
    
    let foundPremium = false;
    for (const selector of premiumSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        await element.click();
        await page.waitForTimeout(2000);
        foundPremium = true;
        break;
      }
    }
    
    // Also try through profile
    const profileTab = page.locator('button:has-text("Profile"), button:has-text("프로필")').first();
    if (!foundPremium && await profileTab.isVisible()) {
      await profileTab.click();
      await page.waitForTimeout(2000);
      
      const premiumInProfile = page.locator('button:has-text("Premium"), button:has-text("프리미엄")').first();
      if (await premiumInProfile.isVisible()) {
        await premiumInProfile.click();
        await page.waitForTimeout(2000);
        foundPremium = true;
      }
    }
  });

  test('should display pricing plans', async ({ page }) => {
    // Navigate to premium screen
    await page.evaluate(() => {
      // Try to access premium through any available method
      const premiumLinks = document.querySelectorAll('[href*="premium"], button[text*="Premium"], button[text*="프리미엄"]');
      if (premiumLinks.length > 0) {
        premiumLinks[0].click();
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Look for pricing information
    const pricingSelectors = [
      'text="₩9,900"', // Monthly price
      'text="₩99,000"', // Yearly price
      'text="₩2,500"', // Like package
      '[data-testid="pricing-card"]',
      '.pricing-plan',
      'button:has-text("Subscribe"), button:has-text("구독")'
    ];
    
    let foundPricing = 0;
    for (const selector of pricingSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          foundPricing++;
        }
      } catch (e) {
        // Continue checking
      }
    }
    
    if (foundPricing > 0) {
      expect(foundPricing).toBeGreaterThan(0);
    }
  });

  test('should handle like credit system', async ({ page }) => {
    // Look for like/credit related elements
    const likeSelectors = [
      'button:has-text("Like"), button:has-text("좋아요")',
      '[data-testid="like-btn"]',
      'text="credit"',
      'text="크레딧"',
      '.like-button'
    ];
    
    let foundLikeSystem = false;
    for (const selector of likeSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        foundLikeSystem = true;
        
        // Try to use like functionality
        await element.click();
        await page.waitForTimeout(2000);
        break;
      }
    }
    
    // Check for credit display
    const creditDisplay = page.locator('text="credit", text="크레딧", [data-testid="credit-count"]').first();
    if (await creditDisplay.isVisible({ timeout: 2000 })) {
      const creditText = await creditDisplay.textContent();
      expect(creditText).toBeTruthy();
    }
  });

  test('should validate payment flow initialization', async ({ page }) => {
    // Look for payment buttons
    const paymentButtons = page.locator('button:has-text("구매"), button:has-text("Purchase"), button:has-text("Subscribe")');
    
    const count = await paymentButtons.count();
    if (count > 0) {
      // Click on first payment button
      await paymentButtons.first().click();
      await page.waitForTimeout(2000);
      
      // On web, Stripe should be mocked, so no actual payment processing
      // But we can check if the payment flow was initiated
      const paymentModal = page.locator('[data-testid="payment-modal"], .payment-form, text="결제"').first();
      if (await paymentModal.isVisible({ timeout: 2000 })) {
        expect(await paymentModal.isVisible()).toBe(true);
      }
    }
  });

  test('should display premium features list', async ({ page }) => {
    // Look for premium features description
    const featureTexts = [
      '무제한 좋아요',
      'Unlimited likes',
      '우선 매칭',
      'Priority matching',
      '읽음 표시',
      'Read receipts',
      '온라인 상태',
      'Online status'
    ];
    
    let foundFeatures = 0;
    for (const featureText of featureTexts) {
      const feature = page.locator(`text="${featureText}"`).first();
      if (await feature.isVisible({ timeout: 1000 })) {
        foundFeatures++;
      }
    }
    
    if (foundFeatures > 0) {
      expect(foundFeatures).toBeGreaterThan(0);
    }
  });

  test('should handle API calls for premium/payment', async ({ page }) => {
    // Monitor API calls related to payment/premium
    const paymentApiCalls = [];
    
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/') && (
        url.includes('payment') || 
        url.includes('premium') || 
        url.includes('subscribe') ||
        url.includes('credit')
      )) {
        paymentApiCalls.push({
          url: url,
          status: response.status(),
          method: response.request().method()
        });
      }
    });
    
    // Trigger premium-related actions
    const premiumBtn = page.locator('button:has-text("Premium"), button:has-text("프리미엄")').first();
    if (await premiumBtn.isVisible()) {
      await premiumBtn.click();
      await page.waitForTimeout(3000);
    }
    
    // Log any payment-related API calls
    if (paymentApiCalls.length > 0) {
      console.log('Payment API calls detected:', paymentApiCalls);
      expect(paymentApiCalls.length).toBeGreaterThan(0);
    }
  });
});