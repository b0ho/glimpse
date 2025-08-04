import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';
import { MatchingPage } from '../pages/matching.page';

test.describe('익명 좋아요 및 매칭 시스템', () => {
  let authPage: AuthPage;
  let matchingPage: MatchingPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    matchingPage = new MatchingPage(page);
    
    // 로그인
    await authPage.goto();
    await authPage.enterPhoneNumber('01055555555');
    await authPage.clickSendCode();
    await authPage.enterVerificationCode('555555');
    await authPage.clickVerify();
  });

  test('익명 좋아요 전송 (무료 사용자)', async ({ page }) => {
    await matchingPage.goto();
    
    // 초기 무료 좋아요 개수 확인
    const remainingLikes = await matchingPage.getRemainingLikes();
    expect(remainingLikes).toBe(1);
    
    // 좋아요 전송
    await matchingPage.sendLike('user-123');
    
    // 좋아요 전송 확인 메시지
    await expect(page.locator('[data-testid="like-sent-message"]')).toBeVisible();
    
    // 남은 좋아요 0개 확인
    const updatedLikes = await matchingPage.getRemainingLikes();
    expect(updatedLikes).toBe(0);
    
    // 추가 좋아요 시도 시 크레딧 구매 유도
    await matchingPage.sendLike('user-456');
    await expect(page.locator('[data-testid="buy-credits-modal"]')).toBeVisible();
  });

  test('상호 매칭 생성', async ({ page, context }) => {
    await matchingPage.goto();
    
    // User A가 User B에게 좋아요
    await matchingPage.sendLike('user-B');
    
    // User B로 로그인 (다른 브라우저 컨텍스트)
    const page2 = await context.newPage();
    const authPage2 = new AuthPage(page2);
    const matchingPage2 = new MatchingPage(page2);
    
    await authPage2.goto();
    await authPage2.enterPhoneNumber('01066666666');
    await authPage2.clickSendCode();
    await authPage2.enterVerificationCode('666666');
    await authPage2.clickVerify();
    
    // User B가 User A에게 좋아요
    await matchingPage2.goto();
    await matchingPage2.sendLike('user-A');
    
    // 매치 생성 알림 확인
    await expect(page2.locator('[data-testid="match-created-notification"]')).toBeVisible();
    
    // 매치 목록에서 확인
    await matchingPage2.viewMatches();
    await expect(matchingPage2.hasMatch('match-AB')).resolves.toBe(true);
    
    // 닉네임 공개 확인
    await expect(page2.locator('[data-testid="match-nickname-user-A"]')).toBeVisible();
  });

  test('쿨다운 기간 확인', async ({ page }) => {
    await matchingPage.goto();
    
    // 첫 번째 좋아요
    await matchingPage.sendLike('user-789');
    
    // 24시간 후 시뮬레이션
    await page.evaluate(() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      localStorage.setItem('test-time', tomorrow.toISOString());
    });
    
    await page.reload();
    
    // 같은 사용자에게 다시 좋아요 시도
    await matchingPage.sendLike('user-789');
    
    // 쿨다운 메시지 확인
    await expect(page.locator('[data-testid="cooldown-message"]')).toContainText('2주 후에 다시');
  });

  test('크레딧 구매 및 사용', async ({ page }) => {
    await matchingPage.goto();
    
    // 무료 좋아요 소진
    await matchingPage.sendLike('user-001');
    
    // 크레딧 구매
    await matchingPage.buyCredits('package-5'); // 5개 크레딧
    
    // 결제 완료 확인
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
    
    // 크레딧으로 좋아요 전송
    const creditsAfterPurchase = await matchingPage.getRemainingLikes();
    expect(creditsAfterPurchase).toBe(5);
    
    await matchingPage.sendLike('user-002');
    
    const creditsAfterUse = await matchingPage.getRemainingLikes();
    expect(creditsAfterUse).toBe(4);
  });

  test('스와이프 제스처로 좋아요/패스', async ({ page }) => {
    await matchingPage.goto();
    
    // 오른쪽 스와이프 (좋아요)
    await matchingPage.swipeRight();
    await expect(page.locator('[data-testid="like-animation"]')).toBeVisible();
    
    // 왼쪽 스와이프 (패스)
    await matchingPage.swipeLeft();
    await expect(page.locator('[data-testid="pass-animation"]')).toBeVisible();
  });

  test('프리미엄 사용자 무제한 좋아요', async ({ page }) => {
    // 프리미엄 사용자로 로그인
    await page.goto('/');
    await authPage.enterPhoneNumber('01077777777'); // 프리미엄 사용자
    await authPage.clickSendCode();
    await authPage.enterVerificationCode('777777');
    await authPage.clickVerify();
    
    await matchingPage.goto();
    
    // 무제한 좋아요 표시 확인
    await expect(page.locator('[data-testid="unlimited-likes-badge"]')).toBeVisible();
    
    // 여러 번 좋아요 전송
    for (let i = 0; i < 10; i++) {
      await matchingPage.sendLike(`user-${i}`);
      await page.waitForTimeout(100);
    }
    
    // 제한 없이 계속 가능
    await expect(page.locator('[data-testid="buy-credits-modal"]')).not.toBeVisible();
  });
});