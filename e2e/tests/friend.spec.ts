import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';

test.describe('친구 시스템', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    
    // 로그인
    await authPage.goto();
    await authPage.enterPhoneNumber('01023232323');
    await authPage.clickSendCode();
    await authPage.enterVerificationCode('232323');
    await authPage.clickVerify();
  });

  test('매칭 후 친구 요청 보내기', async ({ page }) => {
    await page.goto('/matches');
    
    // 기존 매치 확인
    await page.click('[data-testid="match-user789"]');
    
    // 채팅방에서 친구 추가 버튼
    await page.click('[data-testid="add-friend-button"]');
    
    // 친구 요청 확인 모달
    await expect(page.locator('[data-testid="friend-request-modal"]')).toBeVisible();
    await page.fill('[data-testid="friend-request-message"]', '친구가 되어주세요!');
    await page.click('[data-testid="send-friend-request"]');
    
    // 요청 전송 확인
    await expect(page.locator('[data-testid="friend-request-sent"]')).toBeVisible();
    await expect(page.locator('[data-testid="friend-status"]')).toContainText('요청 대기 중');
  });

  test('친구 요청 수락/거절', async ({ page, context }) => {
    // User B로 로그인
    const page2 = await context.newPage();
    const authPage2 = new AuthPage(page2);
    await authPage2.goto();
    await authPage2.enterPhoneNumber('01034343434');
    await authPage2.clickSendCode();
    await authPage2.enterVerificationCode('343434');
    await authPage2.clickVerify();
    
    // 친구 요청 목록
    await page2.goto('/friends/requests');
    
    // 받은 요청 확인
    await expect(page2.locator('[data-testid="pending-requests-count"]')).toContainText('2');
    
    // 첫 번째 요청 수락
    await page2.click('[data-testid="accept-request-user123"]');
    await expect(page2.locator('[data-testid="friend-added-message"]')).toBeVisible();
    
    // 두 번째 요청 거절
    await page2.click('[data-testid="reject-request-user456"]');
    await expect(page2.locator('[data-testid="request-rejected-message"]')).toBeVisible();
    
    // 친구 목록에 추가 확인
    await page2.goto('/friends');
    await expect(page2.locator('[data-testid="friend-user123"]')).toBeVisible();
    await expect(page2.locator('[data-testid="friend-user456"]')).not.toBeVisible();
  });

  test('친구 프로필 공개 설정', async ({ page }) => {
    await page.goto('/friends');
    
    // 친구 프로필 클릭
    await page.click('[data-testid="friend-bestfriend"]');
    
    // 친구에게만 공개되는 정보 확인
    await expect(page.locator('[data-testid="real-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="real-name"]')).toContainText('김철수');
    await expect(page.locator('[data-testid="instagram-id"]')).toBeVisible();
    await expect(page.locator('[data-testid="phone-number"]')).toBeVisible();
    
    // 일반 매치와 비교
    await page.goto('/matches');
    await page.click('[data-testid="match-normaluser"]');
    
    // 일반 매치는 닉네임만 표시
    await expect(page.locator('[data-testid="nickname"]')).toBeVisible();
    await expect(page.locator('[data-testid="real-name"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="phone-number"]')).not.toBeVisible();
  });

  test('친구 삭제', async ({ page }) => {
    await page.goto('/friends');
    
    // 친구 목록에서 삭제
    await page.click('[data-testid="friend-options-user999"]');
    await page.click('[data-testid="remove-friend"]');
    
    // 확인 다이얼로그
    await expect(page.locator('[data-testid="confirm-remove-friend"]')).toBeVisible();
    await expect(page.locator('[data-testid="confirm-message"]')).toContainText('친구를 삭제하시겠습니까?');
    
    await page.click('[data-testid="confirm-remove"]');
    
    // 삭제 완료
    await expect(page.locator('[data-testid="friend-removed-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="friend-user999"]')).not.toBeVisible();
    
    // 매치는 유지됨
    await page.goto('/matches');
    await expect(page.locator('[data-testid="match-user999"]')).toBeVisible();
  });

  test('친구 추천 시스템', async ({ page }) => {
    await page.goto('/friends/suggestions');
    
    // 추천 친구 목록
    await expect(page.locator('[data-testid="friend-suggestions"]')).toBeVisible();
    
    // 추천 이유 표시
    await expect(page.locator('[data-testid="suggestion-reason-user111"]')).toContainText('3명의 공통 친구');
    await expect(page.locator('[data-testid="suggestion-reason-user222"]')).toContainText('같은 그룹 소속');
    
    // 추천에서 친구 요청
    await page.click('[data-testid="send-request-user111"]');
    await expect(page.locator('[data-testid="request-sent-user111"]')).toBeVisible();
    
    // 관심 없음 처리
    await page.click('[data-testid="not-interested-user222"]');
    await expect(page.locator('[data-testid="suggestion-user222"]')).not.toBeVisible();
  });

  test('친구 전용 피드', async ({ page }) => {
    await page.goto('/friends/feed');
    
    // 친구들의 활동 표시
    await expect(page.locator('[data-testid="friend-activity-list"]')).toBeVisible();
    
    // 활동 유형별 표시
    await expect(page.locator('[data-testid="activity-new-match"]')).toContainText('새로운 매치');
    await expect(page.locator('[data-testid="activity-profile-update"]')).toContainText('프로필 업데이트');
    await expect(page.locator('[data-testid="activity-group-joined"]')).toContainText('그룹 가입');
    
    // 활동에 반응 (좋아요)
    await page.click('[data-testid="like-activity-123"]');
    await expect(page.locator('[data-testid="activity-liked-123"]')).toBeVisible();
    
    // 활동 알림 설정
    await page.click('[data-testid="activity-settings"]');
    await page.uncheck('[data-testid="notify-profile-updates"]');
    await page.click('[data-testid="save-settings"]');
  });

  test('비상 연락처 지정', async ({ page }) => {
    await page.goto('/settings/emergency-contacts');
    
    // 친구 중에서 비상 연락처 선택
    await page.click('[data-testid="add-emergency-contact"]');
    await page.click('[data-testid="select-friend-emergency1"]');
    await page.click('[data-testid="select-friend-emergency2"]');
    
    // 최대 3명까지 선택 가능
    await page.click('[data-testid="select-friend-emergency3"]');
    await page.click('[data-testid="select-friend-emergency4"]'); // 4번째 시도
    await expect(page.locator('[data-testid="max-contacts-error"]')).toContainText('최대 3명까지');
    
    // 저장
    await page.click('[data-testid="save-emergency-contacts"]');
    
    // 비상 연락처 알림
    await expect(page.locator('[data-testid="emergency-contacts-saved"]')).toBeVisible();
    
    // 선택된 친구들에게 알림 전송됨
    await expect(page.locator('[data-testid="notification-sent"]')).toContainText('비상 연락처로 지정되었음을 알렸습니다');
  });
});