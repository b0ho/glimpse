import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';

test.describe('한국형 결제 시스템', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    
    // 로그인
    await authPage.goto();
    await authPage.enterPhoneNumber('01012121212');
    await authPage.clickSendCode();
    await authPage.enterVerificationCode('121212');
    await authPage.clickVerify();
  });

  test('토스페이로 크레딧 구매', async ({ page }) => {
    await page.goto('/payment');
    
    // 5개 크레딧 패키지 선택
    await page.click('[data-testid="credit-package-5"]');
    expect(await page.textContent('[data-testid="payment-amount"]')).toBe('₩2,500');
    
    // 토스페이 선택
    await page.click('[data-testid="payment-method-toss"]');
    await page.click('[data-testid="proceed-payment"]');
    
    // 토스페이 결제창 시뮬레이션
    await page.waitForSelector('[data-testid="toss-payment-frame"]');
    await page.frameLocator('[data-testid="toss-payment-frame"]').locator('#pay-button').click();
    
    // 결제 완료 확인
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="credit-balance"]')).toContainText('5');
  });

  test('카카오페이로 프리미엄 구독', async ({ page }) => {
    await page.goto('/premium');
    
    // 월간 구독 선택
    await page.click('[data-testid="premium-monthly"]');
    expect(await page.textContent('[data-testid="payment-amount"]')).toBe('₩9,900');
    
    // 카카오페이 선택
    await page.click('[data-testid="payment-method-kakao"]');
    await page.click('[data-testid="proceed-payment"]');
    
    // 카카오페이 QR 코드 표시 확인
    await expect(page.locator('[data-testid="kakao-qr-code"]')).toBeVisible();
    
    // 결제 완료 시뮬레이션
    await page.evaluate(() => {
      window.postMessage({ type: 'PAYMENT_SUCCESS', paymentId: 'kakao-123' }, '*');
    });
    
    // 프리미엄 활성화 확인
    await expect(page.locator('[data-testid="premium-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="premium-features"]')).toContainText('무제한 좋아요');
  });

  test('신용카드로 연간 구독 (할인 적용)', async ({ page }) => {
    await page.goto('/premium');
    
    // 연간 구독 선택
    await page.click('[data-testid="premium-yearly"]');
    
    // 할인 금액 확인
    await expect(page.locator('[data-testid="original-price"]')).toContainText('₩118,800');
    await expect(page.locator('[data-testid="discounted-price"]')).toContainText('₩99,000');
    await expect(page.locator('[data-testid="discount-badge"]')).toContainText('17% 할인');
    
    // 카드 결제 선택
    await page.click('[data-testid="payment-method-card"]');
    
    // 카드 정보 입력
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvc"]', '123');
    
    await page.click('[data-testid="proceed-payment"]');
    
    // 구독 완료 확인
    await expect(page.locator('[data-testid="subscription-active"]')).toBeVisible();
    await expect(page.locator('[data-testid="subscription-type"]')).toContainText('연간');
  });

  test('결제 실패 처리', async ({ page }) => {
    await page.goto('/payment');
    
    // 크레딧 구매 시도
    await page.click('[data-testid="credit-package-10"]');
    await page.click('[data-testid="payment-method-toss"]');
    await page.click('[data-testid="proceed-payment"]');
    
    // 결제 실패 시뮬레이션
    await page.evaluate(() => {
      window.postMessage({ type: 'PAYMENT_FAILED', error: 'INSUFFICIENT_FUNDS' }, '*');
    });
    
    // 에러 메시지 확인
    await expect(page.locator('[data-testid="payment-error"]')).toContainText('잔액이 부족합니다');
    
    // 다른 결제 수단 선택 가능
    await expect(page.locator('[data-testid="payment-methods"]')).toBeVisible();
  });

  test('구독 갱신 알림', async ({ page }) => {
    // 프리미엄 사용자로 로그인
    await page.goto('/');
    await authPage.enterPhoneNumber('01013131313'); // 구독 만료 임박 사용자
    await authPage.clickSendCode();
    await authPage.enterVerificationCode('131313');
    await authPage.clickVerify();
    
    // 구독 만료 알림 확인
    await expect(page.locator('[data-testid="subscription-expiry-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="subscription-expiry-banner"]')).toContainText('3일 후 만료');
    
    // 갱신 버튼 클릭
    await page.click('[data-testid="renew-subscription"]');
    
    // 결제 페이지로 이동 확인
    await expect(page).toHaveURL('/premium');
  });

  test('환불 요청', async ({ page }) => {
    await page.goto('/account/purchases');
    
    // 최근 구매 내역에서 환불 요청
    await page.click('[data-testid="refund-purchase-123"]');
    
    // 환불 사유 선택
    await page.selectOption('[data-testid="refund-reason"]', 'ACCIDENTAL_PURCHASE');
    await page.fill('[data-testid="refund-details"]', '실수로 구매했습니다');
    
    await page.click('[data-testid="submit-refund"]');
    
    // 환불 요청 완료 확인
    await expect(page.locator('[data-testid="refund-requested"]')).toBeVisible();
    await expect(page.locator('[data-testid="refund-status-purchase-123"]')).toContainText('환불 처리 중');
  });
});