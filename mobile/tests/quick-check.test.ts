import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8082';

test.describe('Quick API Check', () => {
  test('should load mobile app and check API connectivity', async ({ page }) => {
    console.log('Starting quick API check...');
    
    // 앱 로드
    await page.goto(BASE_URL);
    
    // 초기 화면 확인
    await page.waitForLoadState('networkidle');
    
    // 스크린샷 촬영
    await page.screenshot({ path: 'mobile-initial.png', fullPage: true });
    
    // 개발 모드 설정
    await page.evaluate(() => {
      localStorage.setItem('devMode', 'true');
      localStorage.setItem('x-dev-auth', 'true');
    });
    
    // 로그인 화면으로 이동
    const loginButton = await page.$('button:has-text("시작하기"), button:has-text("로그인")');
    if (loginButton) {
      await loginButton.click();
      await page.waitForTimeout(2000);
    }
    
    // 현재 URL 확인
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // 화면에 표시된 텍스트 확인
    const bodyText = await page.textContent('body');
    console.log('Page contains:', bodyText?.substring(0, 200));
    
    // API 호출 로그 설정
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log('API Request:', request.method(), request.url());
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log('API Response:', response.status(), response.url());
      }
    });
    
    // 테스트 사용자로 로그인 시도
    if (currentUrl.includes('auth') || currentUrl.includes('login')) {
      console.log('Login page detected, attempting test login...');
      
      // 전화번호 입력 필드 찾기
      const phoneInput = await page.$('input[type="tel"], input[placeholder*="전화번호"], input[placeholder*="Phone"]');
      if (phoneInput) {
        await phoneInput.fill('01012345678');
        console.log('Phone number entered');
        
        // 다음 버튼 클릭
        const nextButton = await page.$('button:has-text("다음"), button:has-text("인증번호 전송"), button:has-text("Send")');
        if (nextButton) {
          await nextButton.click();
          console.log('Next button clicked');
          await page.waitForTimeout(2000);
        }
      }
    }
    
    // 최종 스크린샷
    await page.screenshot({ path: 'mobile-after-action.png', fullPage: true });
    
    console.log('Quick check completed');
  });
});