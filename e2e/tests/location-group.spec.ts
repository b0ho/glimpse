import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';

test.describe('위치 기반 그룹 시스템', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page, context }) => {
    authPage = new AuthPage(page);
    
    // 위치 권한 허용
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 37.5665, longitude: 126.9780 }); // 서울시청
    
    // 로그인
    await authPage.goto();
    await authPage.enterPhoneNumber('01056565656');
    await authPage.clickSendCode();
    await authPage.enterVerificationCode('565656');
    await authPage.clickVerify();
  });

  test('GPS 기반 근처 그룹 검색', async ({ page }) => {
    await page.goto('/location-groups');
    
    // 위치 권한 요청 확인
    await expect(page.locator('[data-testid="location-permission-granted"]')).toBeVisible();
    
    // 현재 위치 표시
    await expect(page.locator('[data-testid="current-location"]')).toContainText('서울특별시');
    
    // 근처 그룹 로딩
    await page.waitForSelector('[data-testid="nearby-groups-list"]');
    
    // 거리순 정렬 확인
    const distances = await page.locator('[data-testid^="group-distance-"]').allTextContents();
    const numericDistances = distances.map(d => parseFloat(d.replace('km', '')));
    expect(numericDistances).toEqual([...numericDistances].sort((a, b) => a - b));
    
    // 가장 가까운 그룹 참여
    await page.click('[data-testid="join-nearest-group"]');
    await expect(page.locator('[data-testid="group-joined-message"]')).toBeVisible();
  });

  test('QR 코드로 위치 그룹 참여', async ({ page }) => {
    await page.goto('/location-groups');
    
    // QR 스캔 버튼 클릭
    await page.click('[data-testid="scan-qr-button"]');
    
    // 카메라 권한 허용 (시뮬레이션)
    await page.evaluate(() => {
      window.postMessage({ 
        type: 'QR_SCANNED', 
        data: {
          groupId: 'location-group-starbucks-gangnam',
          location: { latitude: 37.4979, longitude: 127.0276 }
        }
      }, '*');
    });
    
    // 그룹 정보 확인
    await expect(page.locator('[data-testid="scanned-group-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="group-name"]')).toContainText('스타벅스 강남역점');
    await expect(page.locator('[data-testid="group-type"]')).toContainText('위치 기반');
    
    // 거리 확인 (너무 멀 경우)
    await expect(page.locator('[data-testid="distance-warning"]')).toContainText('11.2km 떨어져 있습니다');
    
    // 그룹 참여
    await page.click('[data-testid="join-anyway"]');
    await expect(page.locator('[data-testid="group-joined"]')).toBeVisible();
  });

  test('위치 기반 그룹 생성', async ({ page }) => {
    await page.goto('/location-groups/create');
    
    // 그룹 정보 입력
    await page.fill('[data-testid="group-name"]', '서울시청 점심 모임');
    await page.fill('[data-testid="group-description"]', '매일 점심 같이 드실 분');
    await page.selectOption('[data-testid="group-radius"]', '500'); // 500m 반경
    
    // 현재 위치 사용
    await page.click('[data-testid="use-current-location"]');
    await expect(page.locator('[data-testid="location-set"]')).toContainText('37.5665, 126.9780');
    
    // 그룹 생성
    await page.click('[data-testid="create-group"]');
    
    // QR 코드 생성 확인
    await expect(page.locator('[data-testid="group-qr-code"]')).toBeVisible();
    await expect(page.locator('[data-testid="download-qr"]')).toBeVisible();
  });

  test('위치 업데이트시 그룹 자동 퇴장', async ({ page, context }) => {
    await page.goto('/location-groups');
    
    // 근처 그룹 참여
    await page.click('[data-testid="join-group-seoul-city-hall"]');
    await expect(page.locator('[data-testid="active-location-group"]')).toBeVisible();
    
    // 위치 변경 (강남으로 이동)
    await context.setGeolocation({ latitude: 37.4979, longitude: 127.0276 });
    
    // 위치 업데이트 트리거
    await page.click('[data-testid="refresh-location"]');
    
    // 자동 퇴장 알림
    await expect(page.locator('[data-testid="auto-leave-notification"]')).toBeVisible();
    await expect(page.locator('[data-testid="auto-leave-notification"]')).toContainText('위치 그룹에서 자동으로 나갔습니다');
    
    // 활성 그룹 없음 확인
    await expect(page.locator('[data-testid="no-active-location-group"]')).toBeVisible();
  });

  test('위치 권한 거부시 처리', async ({ page, context }) => {
    // 위치 권한 거부
    await context.clearPermissions();
    
    await page.goto('/location-groups');
    
    // 권한 요청 메시지
    await expect(page.locator('[data-testid="location-permission-denied"]')).toBeVisible();
    await expect(page.locator('[data-testid="location-permission-message"]')).toContainText('위치 권한이 필요합니다');
    
    // QR 코드 스캔은 가능
    await expect(page.locator('[data-testid="scan-qr-button"]')).toBeEnabled();
    
    // 수동 위치 입력 옵션
    await page.click('[data-testid="manual-location-input"]');
    await page.fill('[data-testid="address-search"]', '강남역');
    await page.click('[data-testid="search-button"]');
    
    // 검색 결과에서 선택
    await page.click('[data-testid="location-result-0"]');
    await expect(page.locator('[data-testid="nearby-groups-list"]')).toBeVisible();
  });

  test('실시간 위치 공유 (프리미엄)', async ({ page }) => {
    // 프리미엄 사용자로 로그인
    await page.goto('/');
    await authPage.enterPhoneNumber('01067676767'); // 프리미엄 사용자
    await authPage.clickSendCode();
    await authPage.enterVerificationCode('676767');
    await authPage.clickVerify();
    
    await page.goto('/location-groups');
    
    // 실시간 위치 공유 활성화
    await page.click('[data-testid="enable-live-location"]');
    await expect(page.locator('[data-testid="live-location-active"]')).toBeVisible();
    
    // 그룹 멤버들의 실시간 위치 표시
    await page.click('[data-testid="view-group-map"]');
    await expect(page.locator('[data-testid="member-markers"]')).toBeVisible();
    
    // 익명성 유지 (닉네임만 표시)
    const memberInfo = await page.locator('[data-testid="member-marker-0"]').textContent();
    expect(memberInfo).not.toContain('실명');
    expect(memberInfo).toMatch(/^[가-힣]+$/); // 닉네임만 포함
  });
});