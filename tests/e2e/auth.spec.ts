import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show landing page', async ({ page }) => {
    await page.goto('/');
    
    // 랜딩 페이지 요소 확인
    await expect(page.locator('h1')).toContainText('Glimpse');
    await expect(page.locator('text=익명으로 시작하는')).toBeVisible();
    await expect(page.locator('text=시작하기')).toBeVisible();
  });

  test('should navigate to auth page', async ({ page }) => {
    await page.goto('/');
    
    // 시작하기 버튼 클릭
    await page.click('text=시작하기');
    
    // 인증 페이지로 이동 확인
    await expect(page).toHaveURL(/.*auth/);
    await expect(page.locator('text=전화번호로 시작하기')).toBeVisible();
  });

  test('should show phone number input', async ({ page }) => {
    await page.goto('/auth');
    
    // 전화번호 입력 필드 확인
    const phoneInput = page.locator('input[type="tel"]');
    await expect(phoneInput).toBeVisible();
    await expect(phoneInput).toHaveAttribute('placeholder', /010/);
  });

  test('should validate phone number format', async ({ page }) => {
    await page.goto('/auth');
    
    // 잘못된 전화번호 입력
    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill('123');
    await page.click('button:has-text("인증번호 받기")');
    
    // 에러 메시지 확인
    await expect(page.locator('text=올바른 전화번호를 입력해주세요')).toBeVisible();
  });

  test('should proceed with valid phone number', async ({ page }) => {
    await page.goto('/auth');
    
    // 올바른 전화번호 입력
    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill('01012345678');
    
    // 인증번호 받기 버튼 활성화 확인
    const submitButton = page.locator('button:has-text("인증번호 받기")');
    await expect(submitButton).toBeEnabled();
    
    // 버튼 클릭 (실제 SMS는 보내지 않음)
    await submitButton.click();
    
    // 인증코드 입력 화면으로 전환 확인
    await expect(page.locator('text=인증번호를 입력해주세요')).toBeVisible({ timeout: 5000 });
  });
});