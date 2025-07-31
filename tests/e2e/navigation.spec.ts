import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate between main pages', async ({ page }) => {
    await page.goto('/');
    
    // 홈페이지 확인
    await expect(page.locator('h1')).toContainText('Glimpse');
    
    // Features 섹션으로 스크롤
    await page.click('text=특징');
    await expect(page.locator('text=익명 매칭')).toBeVisible();
    
    // 가격 섹션으로 스크롤
    await page.click('text=가격');
    await expect(page.locator('text=프리미엄')).toBeVisible();
  });

  test('should have responsive mobile menu', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // 모바일 메뉴 버튼 확인
    const menuButton = page.locator('[aria-label="메뉴"]');
    await expect(menuButton).toBeVisible();
    
    // 메뉴 열기
    await menuButton.click();
    
    // 메뉴 항목 확인
    await expect(page.locator('text=특징')).toBeVisible();
    await expect(page.locator('text=가격')).toBeVisible();
    await expect(page.locator('text=시작하기')).toBeVisible();
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    await page.goto('/');
    
    // 인증 페이지로 이동
    await page.click('text=시작하기');
    await expect(page).toHaveURL(/.*auth/);
    
    // 뒤로가기
    await page.goBack();
    await expect(page).toHaveURL('/');
    
    // 앞으로가기
    await page.goForward();
    await expect(page).toHaveURL(/.*auth/);
  });
});