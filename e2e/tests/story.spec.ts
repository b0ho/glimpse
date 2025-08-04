import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';

test.describe('스토리 기능 (24시간 임시 콘텐츠)', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    
    // 로그인
    await authPage.goto();
    await authPage.enterPhoneNumber('01078787878');
    await authPage.clickSendCode();
    await authPage.enterVerificationCode('787878');
    await authPage.clickVerify();
  });

  test('스토리 업로드 및 표시', async ({ page }) => {
    await page.goto('/stories');
    
    // 스토리 추가 버튼
    await page.click('[data-testid="add-story-button"]');
    
    // 이미지 선택
    await page.setInputFiles('[data-testid="story-image-input"]', './test-assets/story-image.jpg');
    
    // 캡션 추가
    await page.fill('[data-testid="story-caption"]', '오늘의 점심 🍜');
    
    // 공개 범위 설정 (그룹 선택)
    await page.click('[data-testid="story-privacy"]');
    await page.click('[data-testid="group-samsung"]'); // 삼성전자 그룹만
    
    // 업로드
    await page.click('[data-testid="upload-story"]');
    
    // 업로드 완료 확인
    await expect(page.locator('[data-testid="story-uploaded"]')).toBeVisible();
    
    // 내 스토리 표시 확인
    await expect(page.locator('[data-testid="my-story-ring"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="story-count"]')).toContainText('1');
  });

  test('스토리 뷰어 및 조회수', async ({ page, context }) => {
    await page.goto('/stories');
    
    // 다른 사용자의 스토리 클릭
    await page.click('[data-testid="user-story-user123"]');
    
    // 스토리 뷰어 열림
    await expect(page.locator('[data-testid="story-viewer"]')).toBeVisible();
    
    // 진행 바 확인
    await expect(page.locator('[data-testid="story-progress-bar"]')).toBeVisible();
    
    // 자동 다음 스토리 전환 (5초 후)
    await page.waitForTimeout(5100);
    await expect(page.locator('[data-testid="story-index"]')).toContainText('2/3');
    
    // 수동 다음/이전
    await page.click('[data-testid="story-next"]');
    await expect(page.locator('[data-testid="story-index"]')).toContainText('3/3');
    
    await page.click('[data-testid="story-prev"]');
    await expect(page.locator('[data-testid="story-index"]')).toContainText('2/3');
    
    // 스토리 나가기
    await page.click('[data-testid="close-story"]');
    
    // 조회 기록 (스토리 소유자만 볼 수 있음)
    // 다른 사용자로 로그인하여 조회수 확인
    const page2 = await context.newPage();
    const authPage2 = new AuthPage(page2);
    await authPage2.goto();
    await authPage2.enterPhoneNumber('01089898989');
    await authPage2.clickSendCode();
    await authPage2.enterVerificationCode('898989');
    await authPage2.clickVerify();
    
    await page2.goto('/stories');
    await page2.click('[data-testid="my-story-ring"]');
    
    // 조회자 목록 (프리미엄 기능)
    await expect(page2.locator('[data-testid="story-views"]')).toContainText('1명이 봤습니다');
  });

  test('24시간 후 자동 삭제', async ({ page }) => {
    await page.goto('/stories');
    
    // 테스트용 오래된 스토리 확인
    await page.evaluate(() => {
      // 25시간 전 스토리 시뮬레이션
      const oldStory = {
        id: 'old-story-1',
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000)
      };
      window.localStorage.setItem('test-old-story', JSON.stringify(oldStory));
    });
    
    await page.reload();
    
    // 오래된 스토리는 표시되지 않음
    await expect(page.locator('[data-testid="story-old-story-1"]')).not.toBeVisible();
    
    // 23시간 된 스토리는 아직 표시됨
    await page.evaluate(() => {
      const recentStory = {
        id: 'recent-story-1',
        createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000)
      };
      window.localStorage.setItem('test-recent-story', JSON.stringify(recentStory));
    });
    
    await page.reload();
    await expect(page.locator('[data-testid="story-recent-story-1"]')).toBeVisible();
    
    // 만료 임박 표시
    await expect(page.locator('[data-testid="story-expiring-soon"]')).toBeVisible();
  });

  test('스토리 답장 (프리미엄)', async ({ page }) => {
    // 프리미엄 사용자로 로그인
    await page.goto('/');
    await authPage.enterPhoneNumber('01090909090'); // 프리미엄 사용자
    await authPage.clickSendCode();
    await authPage.enterVerificationCode('909090');
    await authPage.clickVerify();
    
    await page.goto('/stories');
    
    // 다른 사용자 스토리 보기
    await page.click('[data-testid="user-story-user456"]');
    
    // 답장 입력창 표시 (프리미엄만)
    await expect(page.locator('[data-testid="story-reply-input"]')).toBeVisible();
    
    // 답장 전송
    await page.fill('[data-testid="story-reply-input"]', '멋진 사진이네요! 👍');
    await page.press('[data-testid="story-reply-input"]', 'Enter');
    
    // 답장 전송 확인
    await expect(page.locator('[data-testid="reply-sent"]')).toBeVisible();
    
    // 채팅으로 이동
    await page.click('[data-testid="go-to-chat"]');
    await expect(page).toHaveURL(/\/chat/);
    await expect(page.locator('[data-testid="chat-message-1"]')).toContainText('멋진 사진이네요!');
  });

  test('스토리 신고 및 차단', async ({ page }) => {
    await page.goto('/stories');
    
    // 부적절한 스토리 보기
    await page.click('[data-testid="user-story-spam-user"]');
    
    // 더보기 메뉴
    await page.click('[data-testid="story-more-options"]');
    
    // 신고하기
    await page.click('[data-testid="report-story"]');
    await page.selectOption('[data-testid="report-reason"]', 'INAPPROPRIATE_CONTENT');
    await page.fill('[data-testid="report-details"]', '부적절한 콘텐츠');
    await page.click('[data-testid="submit-report"]');
    
    // 신고 완료
    await expect(page.locator('[data-testid="report-submitted"]')).toBeVisible();
    
    // 사용자 차단
    await page.click('[data-testid="block-user"]');
    await page.click('[data-testid="confirm-block"]');
    
    // 차단 후 스토리 목록에서 사라짐
    await page.goto('/stories');
    await expect(page.locator('[data-testid="user-story-spam-user"]')).not.toBeVisible();
  });

  test('스토리 하이라이트 저장', async ({ page }) => {
    await page.goto('/stories');
    
    // 내 스토리 보기
    await page.click('[data-testid="my-story-ring"]');
    
    // 하이라이트에 추가
    await page.click('[data-testid="add-to-highlight"]');
    
    // 하이라이트 선택/생성
    await page.click('[data-testid="create-new-highlight"]');
    await page.fill('[data-testid="highlight-name"]', '맛집 컬렉션');
    await page.click('[data-testid="save-highlight"]');
    
    // 프로필에서 하이라이트 확인
    await page.goto('/profile');
    await expect(page.locator('[data-testid="highlight-맛집 컬렉션"]')).toBeVisible();
    
    // 하이라이트는 24시간 후에도 유지됨
    await expect(page.locator('[data-testid="highlight-permanent"]')).toBeVisible();
  });
});