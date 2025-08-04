import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';

test.describe('인증 및 회원가입 플로우', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await authPage.goto();
  });

  test('SMS 인증을 통한 신규 회원가입', async ({ page }) => {
    // 전화번호 입력 및 인증코드 전송
    await authPage.enterPhoneNumber('01012345678');
    await authPage.clickSendCode();
    
    // 인증코드 전송 확인
    await expect(page.locator('[data-testid="code-sent-message"]')).toBeVisible();
    
    // 테스트용 인증코드 입력
    await authPage.enterVerificationCode('123456');
    await authPage.clickVerify();
    
    // 프로필 설정 페이지로 이동 확인
    await expect(page).toHaveURL(/\/onboarding/);
    
    // 프로필 정보 입력
    await authPage.enterNickname('테스트유저');
    await authPage.selectAge('25');
    await authPage.selectGender('MALE');
    
    // 회원가입 완료
    await authPage.clickComplete();
    
    // 메인 화면으로 이동 및 로그인 상태 확인
    await expect(page).toHaveURL('/');
    await expect(authPage.isLoggedIn()).resolves.toBe(true);
  });

  test('기존 회원 로그인', async ({ page }) => {
    // 기존 회원 전화번호 입력
    await authPage.enterPhoneNumber('01087654321');
    await authPage.clickSendCode();
    
    // 인증코드 입력
    await authPage.enterVerificationCode('654321');
    await authPage.clickVerify();
    
    // 바로 메인 화면으로 이동 확인 (온보딩 스킵)
    await expect(page).toHaveURL('/');
    await expect(authPage.isLoggedIn()).resolves.toBe(true);
  });

  test('중복 전화번호 가입 방지', async ({ page }) => {
    // 이미 등록된 전화번호로 시도
    await authPage.enterPhoneNumber('01011111111');
    await authPage.clickSendCode();
    
    // 에러 메시지 확인
    await expect(page.locator('[data-testid="error-message"]')).toContainText('이미 등록된 전화번호');
  });

  test('잘못된 인증코드 처리', async ({ page }) => {
    await authPage.enterPhoneNumber('01022222222');
    await authPage.clickSendCode();
    
    // 잘못된 인증코드 입력
    await authPage.enterVerificationCode('000000');
    await authPage.clickVerify();
    
    // 에러 메시지 확인
    await expect(page.locator('[data-testid="error-message"]')).toContainText('인증코드가 올바르지 않습니다');
  });

  test('인증 토큰 만료 처리', async ({ page, context }) => {
    // 로그인
    await authPage.enterPhoneNumber('01033333333');
    await authPage.clickSendCode();
    await authPage.enterVerificationCode('333333');
    await authPage.clickVerify();
    
    // 토큰 삭제 (만료 시뮬레이션)
    await context.clearCookies();
    
    // 보호된 페이지 접근 시도
    await page.goto('/matching');
    
    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL('/');
  });
});