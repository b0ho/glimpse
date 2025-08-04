import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';
import { GroupPage } from '../pages/group.page';

test.describe('그룹 가입 및 관리 시스템', () => {
  let authPage: AuthPage;
  let groupPage: GroupPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    groupPage = new GroupPage(page);
    
    // 로그인
    await authPage.goto();
    await authPage.enterPhoneNumber('01044444444');
    await authPage.clickSendCode();
    await authPage.enterVerificationCode('444444');
    await authPage.clickVerify();
  });

  test('회사 이메일 인증을 통한 공식 그룹 가입', async ({ page }) => {
    await groupPage.goto();
    await groupPage.selectGroupType('OFFICIAL');
    
    // 회사 이메일 인증
    await groupPage.verifyCompanyEmail('test@samsung.com');
    await expect(page.locator('[data-testid="email-sent-message"]')).toBeVisible();
    
    // 이메일 인증코드 입력
    await groupPage.enterEmailVerificationCode('ABC123');
    
    // 삼성전자 그룹 자동 가입 확인
    await expect(groupPage.isInGroup('삼성전자')).resolves.toBe(true);
  });

  test('취미 그룹 생성 및 가입', async ({ page }) => {
    await groupPage.goto();
    await groupPage.selectGroupType('CREATED');
    
    // 새 그룹 생성
    await groupPage.createGroup({
      name: '서울 테니스 모임',
      description: '주말 테니스 동호회',
      type: 'CREATED'
    });
    
    // 그룹 생성 확인
    await expect(page.locator('[data-testid="group-created-message"]')).toBeVisible();
    
    // 생성한 그룹에 자동 가입 확인
    await expect(groupPage.isInGroup('서울 테니스 모임')).resolves.toBe(true);
  });

  test('위치 기반 그룹 참여 (QR 코드)', async ({ page }) => {
    await groupPage.goto();
    await groupPage.selectGroupType('LOCATION');
    
    // QR 코드 스캔 시뮬레이션
    await page.evaluate(() => {
      window.postMessage({ type: 'QR_SCANNED', data: 'LOCATION_GROUP_12345' }, '*');
    });
    
    // 위치 그룹 가입 확인
    await expect(page.locator('[data-testid="location-group-joined"]')).toBeVisible();
  });

  test('인스턴스 그룹 (이벤트) 참여', async ({ page }) => {
    await groupPage.goto();
    await groupPage.selectGroupType('INSTANCE');
    
    // 이벤트 그룹 검색
    await groupPage.searchGroup('개발자 컨퍼런스 2024');
    
    // 그룹 가입
    await groupPage.joinGroup('event-12345');
    
    // 가입 확인
    await expect(groupPage.isInGroup('개발자 컨퍼런스 2024')).resolves.toBe(true);
  });

  test('그룹 최소 인원 및 성별 균형 확인', async ({ page }) => {
    await groupPage.goto();
    
    // 인원 부족 그룹 확인
    await groupPage.searchGroup('신규 스타트업');
    
    // 매칭 비활성화 상태 확인
    await expect(page.locator('[data-testid="group-inactive-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="group-inactive-reason"]')).toContainText('최소 인원 미달');
  });

  test('그룹 탈퇴', async ({ page }) => {
    await groupPage.goto();
    
    // 내 그룹 목록에서 탈퇴
    await page.click('[data-testid="my-groups-tab"]');
    await page.click('[data-testid="leave-group-test-group"]');
    await page.click('[data-testid="confirm-leave"]');
    
    // 탈퇴 확인
    await expect(page.locator('[data-testid="group-left-message"]')).toBeVisible();
    await expect(groupPage.isInGroup('test-group')).resolves.toBe(false);
  });
});