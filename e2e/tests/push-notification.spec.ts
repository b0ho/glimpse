import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';

test.describe('푸시 알림 및 실시간 업데이트', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page, context }) => {
    authPage = new AuthPage(page);
    
    // 알림 권한 허용
    await context.grantPermissions(['notifications']);
    
    // 로그인
    await authPage.goto();
    await authPage.enterPhoneNumber('01045454545');
    await authPage.clickSendCode();
    await authPage.enterVerificationCode('454545');
    await authPage.clickVerify();
  });

  test('알림 권한 요청 및 설정', async ({ page }) => {
    await page.goto('/settings/notifications');
    
    // 알림 권한 상태 확인
    await expect(page.locator('[data-testid="notification-permission-status"]')).toContainText('허용됨');
    
    // FCM 토큰 등록 확인
    await expect(page.locator('[data-testid="fcm-token-registered"]')).toBeVisible();
    
    // 알림 설정 옵션들
    await expect(page.locator('[data-testid="notification-matches"]')).toBeChecked();
    await expect(page.locator('[data-testid="notification-messages"]')).toBeChecked();
    await expect(page.locator('[data-testid="notification-likes"]')).toBeChecked();
    await expect(page.locator('[data-testid="notification-subscription"]')).toBeChecked();
  });

  test('새 매치 알림', async ({ page, context }) => {
    // 알림 모니터링 설정
    const notifications: any[] = [];
    await page.addInitScript(() => {
      window.addEventListener('push', (event: any) => {
        (window as any).pushNotifications = (window as any).pushNotifications || [];
        (window as any).pushNotifications.push(event.data);
      });
    });
    
    // 다른 사용자가 좋아요 보냄 (시뮬레이션)
    await page.evaluate(() => {
      window.postMessage({ 
        type: 'MATCH_CREATED',
        data: { matchId: 'match-999', timestamp: new Date() }
      }, '*');
    });
    
    // 알림 수신 확인
    await page.waitForTimeout(1000);
    const receivedNotifications = await page.evaluate(() => (window as any).pushNotifications);
    
    expect(receivedNotifications).toHaveLength(1);
    expect(receivedNotifications[0]).toMatchObject({
      title: expect.stringContaining('새로운 매치'),
      body: expect.stringContaining('누군가와 매치되었습니다'),
      icon: expect.any(String),
    });
    
    // 인앱 알림 확인
    await expect(page.locator('[data-testid="in-app-notification"]')).toBeVisible();
    await expect(page.locator('[data-testid="notification-badge"]')).toContainText('1');
  });

  test('메시지 알림 (익명성 보장)', async ({ page }) => {
    // 채팅방 입장
    await page.goto('/chat/match-123');
    
    // 백그라운드로 전환 (탭 전환 시뮬레이션)
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    
    // 메시지 수신 시뮬레이션
    await page.evaluate(() => {
      window.postMessage({
        type: 'MESSAGE_RECEIVED',
        data: {
          matchId: 'match-123',
          message: '안녕하세요!',
          senderId: 'anonymous-user'
        }
      }, '*');
    });
    
    // 알림 확인 (발신자 익명)
    const notification = await page.evaluate(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          const notifs = (window as any).pushNotifications || [];
          resolve(notifs[notifs.length - 1]);
        }, 500);
      });
    });
    
    expect(notification).toMatchObject({
      title: '새 메시지',
      body: expect.not.stringContaining('실명'), // 실명 포함 안됨
      data: { matchId: 'match-123' }
    });
  });

  test('좋아요 수신 알림 (개수만 표시)', async ({ page }) => {
    await page.goto('/');
    
    // 좋아요 수신 시뮬레이션
    await page.evaluate(() => {
      window.postMessage({
        type: 'LIKES_RECEIVED',
        data: { count: 3 }
      }, '*');
    });
    
    // 알림 내용 확인
    await page.waitForTimeout(500);
    const notifications = await page.evaluate(() => (window as any).pushNotifications || []);
    const likeNotification = notifications.find((n: any) => n.title.includes('좋아요'));
    
    expect(likeNotification).toBeTruthy();
    expect(likeNotification.body).toContain('3명');
    expect(likeNotification.body).not.toContain('님이'); // 특정 사용자 언급 없음
  });

  test('구독 만료 알림', async ({ page }) => {
    // 프리미엄 만료 3일 전 사용자로 로그인
    await page.goto('/');
    await authPage.enterPhoneNumber('01078787878'); // 만료 임박 사용자
    await authPage.clickSendCode();
    await authPage.enterVerificationCode('787878');
    await authPage.clickVerify();
    
    // 앱 시작시 만료 알림 확인
    await expect(page.locator('[data-testid="subscription-expiry-notification"]')).toBeVisible();
    await expect(page.locator('[data-testid="subscription-expiry-notification"]')).toContainText('3일 후 만료');
    
    // 알림 클릭시 결제 페이지로 이동
    await page.click('[data-testid="subscription-expiry-notification"]');
    await expect(page).toHaveURL('/premium');
  });

  test('알림 설정 개별 제어', async ({ page }) => {
    await page.goto('/settings/notifications');
    
    // 메시지 알림 끄기
    await page.uncheck('[data-testid="notification-messages"]');
    await page.click('[data-testid="save-notification-settings"]');
    
    // 설정 저장 확인
    await expect(page.locator('[data-testid="settings-saved"]')).toBeVisible();
    
    // 메시지 수신해도 알림 없음 (시뮬레이션)
    await page.evaluate(() => {
      (window as any).pushNotifications = [];
      window.postMessage({
        type: 'MESSAGE_RECEIVED',
        data: { matchId: 'match-456', message: 'test' }
      }, '*');
    });
    
    await page.waitForTimeout(1000);
    const notifications = await page.evaluate(() => (window as any).pushNotifications || []);
    expect(notifications).toHaveLength(0);
  });

  test('방해 금지 모드', async ({ page }) => {
    await page.goto('/settings/notifications');
    
    // 방해 금지 시간 설정
    await page.click('[data-testid="do-not-disturb"]');
    await page.fill('[data-testid="dnd-start-time"]', '22:00');
    await page.fill('[data-testid="dnd-end-time"]', '08:00');
    await page.click('[data-testid="save-dnd-settings"]');
    
    // 현재 시간을 방해 금지 시간으로 설정 (시뮬레이션)
    await page.evaluate(() => {
      const mockDate = new Date();
      mockDate.setHours(23, 0, 0, 0); // 23:00
      Date.now = () => mockDate.getTime();
    });
    
    // 알림 수신 시도
    await page.evaluate(() => {
      window.postMessage({
        type: 'MATCH_CREATED',
        data: { matchId: 'match-dnd' }
      }, '*');
    });
    
    // 알림 표시 안됨
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="in-app-notification"]')).not.toBeVisible();
  });

  test('알림 히스토리 및 관리', async ({ page }) => {
    await page.goto('/notifications');
    
    // 알림 목록 표시
    await expect(page.locator('[data-testid="notification-list"]')).toBeVisible();
    
    // 알림 유형별 필터
    await page.click('[data-testid="filter-matches"]');
    await expect(page.locator('[data-testid^="notification-item-"]')).toHaveCount(3);
    
    // 알림 읽음 처리
    await page.click('[data-testid="notification-item-1"]');
    await expect(page.locator('[data-testid="notification-item-1"]')).not.toHaveClass(/unread/);
    
    // 모두 읽음 처리
    await page.click('[data-testid="mark-all-read"]');
    await expect(page.locator('.unread')).toHaveCount(0);
    
    // 알림 삭제
    await page.click('[data-testid="delete-notification-2"]');
    await expect(page.locator('[data-testid="notification-item-2"]')).not.toBeVisible();
  });

  test('배터리 최적화 및 백그라운드 제한', async ({ page }) => {
    await page.goto('/settings/notifications');
    
    // 배터리 최적화 안내
    await expect(page.locator('[data-testid="battery-optimization-warning"]')).toBeVisible();
    
    // 최적화 비활성화 가이드
    await page.click('[data-testid="battery-optimization-guide"]');
    await expect(page.locator('[data-testid="optimization-steps"]')).toBeVisible();
    
    // 백그라운드 알림 테스트
    await page.click('[data-testid="test-background-notification"]');
    await expect(page.locator('[data-testid="test-notification-sent"]')).toBeVisible();
  });
});