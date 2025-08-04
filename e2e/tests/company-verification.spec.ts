import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';

test.describe('회사 인증 시스템', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    
    // 로그인
    await authPage.goto();
    await authPage.enterPhoneNumber('01012341234');
    await authPage.clickSendCode();
    await authPage.enterVerificationCode('123412');
    await authPage.clickVerify();
  });

  test('회사 이메일 도메인 인증', async ({ page }) => {
    await page.goto('/company-verification');
    
    // 회사 이메일 입력
    await page.fill('[data-testid="company-email"]', 'john.doe@samsung.com');
    await page.click('[data-testid="send-verification-email"]');
    
    // 이메일 전송 확인
    await expect(page.locator('[data-testid="email-sent-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-sent-message"]')).toContainText('john.doe@samsung.com');
    
    // 인증 코드 입력
    await page.fill('[data-testid="verification-code"]', 'ABC123');
    await page.click('[data-testid="verify-code"]');
    
    // 인증 완료
    await expect(page.locator('[data-testid="verification-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="company-badge"]')).toContainText('삼성전자');
  });

  test('재직 증명서 OCR 인증', async ({ page }) => {
    await page.goto('/company-verification');
    
    // OCR 인증 선택
    await page.click('[data-testid="ocr-verification-tab"]');
    
    // 재직 증명서 업로드
    await page.setInputFiles('[data-testid="document-upload"]', './test-assets/employment-certificate.jpg');
    
    // OCR 처리 대기
    await expect(page.locator('[data-testid="ocr-processing"]')).toBeVisible();
    await page.waitForSelector('[data-testid="ocr-complete"]', { timeout: 10000 });
    
    // OCR 결과 확인
    await expect(page.locator('[data-testid="ocr-company-name"]')).toContainText('네이버');
    await expect(page.locator('[data-testid="ocr-employee-name"]')).toContainText('김철수');
    
    // 인증 승인
    await page.click('[data-testid="confirm-ocr-verification"]');
    
    // 인증 완료
    await expect(page.locator('[data-testid="verification-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="company-badge"]')).toContainText('네이버');
  });

  test('지원하지 않는 도메인', async ({ page }) => {
    await page.goto('/company-verification');
    
    // 개인 이메일 입력
    await page.fill('[data-testid="company-email"]', 'test@gmail.com');
    await page.click('[data-testid="send-verification-email"]');
    
    // 에러 메시지 확인
    await expect(page.locator('[data-testid="error-message"]')).toContainText('회사 이메일이 아닙니다');
  });

  test('이미 사용된 이메일', async ({ page }) => {
    await page.goto('/company-verification');
    
    // 이미 인증된 이메일 입력
    await page.fill('[data-testid="company-email"]', 'existing@samsung.com');
    await page.click('[data-testid="send-verification-email"]');
    
    // 에러 메시지 확인
    await expect(page.locator('[data-testid="error-message"]')).toContainText('이미 사용된 이메일');
  });

  test('OCR 인증 실패 (문서 불명확)', async ({ page }) => {
    await page.goto('/company-verification');
    
    // OCR 인증 선택
    await page.click('[data-testid="ocr-verification-tab"]');
    
    // 불명확한 문서 업로드
    await page.setInputFiles('[data-testid="document-upload"]', './test-assets/blurry-document.jpg');
    
    // OCR 실패 메시지
    await expect(page.locator('[data-testid="ocr-failed"]')).toBeVisible();
    await expect(page.locator('[data-testid="ocr-failed"]')).toContainText('문서를 인식할 수 없습니다');
    
    // 재시도 버튼
    await expect(page.locator('[data-testid="retry-upload"]')).toBeVisible();
  });

  test('인증 후 회사 그룹 자동 가입', async ({ page }) => {
    await page.goto('/company-verification');
    
    // 카카오 이메일 인증
    await page.fill('[data-testid="company-email"]', 'test@kakaocorp.com');
    await page.click('[data-testid="send-verification-email"]');
    await page.fill('[data-testid="verification-code"]', 'KAKAO123');
    await page.click('[data-testid="verify-code"]');
    
    // 인증 완료 후 그룹 확인
    await page.goto('/groups');
    await page.click('[data-testid="my-groups-tab"]');
    
    // 카카오 그룹 자동 가입 확인
    await expect(page.locator('[data-testid="group-kakao"]')).toBeVisible();
    await expect(page.locator('[data-testid="group-kakao"]')).toContainText('카카오');
    await expect(page.locator('[data-testid="group-kakao-badge"]')).toContainText('공식 인증');
  });
});