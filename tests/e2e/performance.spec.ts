import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('should load landing page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // 페이지 로드 시간이 3초 이내여야 함
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have optimized images', async ({ page }) => {
    await page.goto('/');
    
    // 모든 이미지 찾기
    const images = await page.locator('img').all();
    
    for (const img of images) {
      // 이미지에 alt 텍스트가 있는지 확인
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
      
      // 이미지가 로드되었는지 확인
      const isVisible = await img.isVisible();
      if (isVisible) {
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        expect(naturalWidth).toBeGreaterThan(0);
      }
    }
  });

  test('should handle slow network gracefully', async ({ page }) => {
    // 느린 3G 네트워크 시뮬레이션
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 100);
    });
    
    await page.goto('/');
    
    // 로딩 인디케이터가 표시되는지 확인
    const loader = page.locator('[aria-label="로딩중"]');
    if (await loader.isVisible()) {
      await expect(loader).toBeHidden({ timeout: 10000 });
    }
    
    // 페이지가 결국 로드되는지 확인
    await expect(page.locator('h1')).toContainText('Glimpse');
  });
});