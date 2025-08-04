import { test, expect } from '@playwright/test';

test.describe('관리자 도구 및 모니터링', () => {
  test.beforeEach(async ({ page }) => {
    // 관리자 계정으로 로그인
    await page.goto('/admin/login');
    await page.fill('[data-testid="admin-email"]', 'admin@glimpse.app');
    await page.fill('[data-testid="admin-password"]', 'admin-secret-password');
    await page.click('[data-testid="admin-login-button"]');
    
    // 2FA 인증
    await page.fill('[data-testid="2fa-code"]', '123456');
    await page.click('[data-testid="verify-2fa"]');
    
    // 관리자 대시보드 진입 확인
    await expect(page).toHaveURL('/admin/dashboard');
  });

  test('대시보드 개요 및 통계', async ({ page }) => {
    // 대시보드 메트릭 확인
    await expect(page.locator('[data-testid="total-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-users-today"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-matches"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-today"]')).toBeVisible();
    
    // 실시간 그래프
    await expect(page.locator('[data-testid="realtime-activity-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    
    // 알림 센터
    await expect(page.locator('[data-testid="admin-alerts"]')).toBeVisible();
    const alertCount = await page.locator('[data-testid="alert-count"]').textContent();
    expect(Number(alertCount)).toBeGreaterThanOrEqual(0);
  });

  test('사용자 관리', async ({ page }) => {
    await page.goto('/admin/users');
    
    // 사용자 검색
    await page.fill('[data-testid="user-search"]', '01012345678');
    await page.click('[data-testid="search-button"]');
    
    // 검색 결과
    await expect(page.locator('[data-testid="user-result-1"]')).toBeVisible();
    
    // 사용자 상세 보기
    await page.click('[data-testid="view-user-details-1"]');
    
    // 사용자 정보 확인
    await expect(page.locator('[data-testid="user-phone"]')).toContainText('010-1234-5678');
    await expect(page.locator('[data-testid="user-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-created-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-groups"]')).toBeVisible();
    
    // 사용자 액션
    await expect(page.locator('[data-testid="suspend-user"]')).toBeEnabled();
    await expect(page.locator('[data-testid="delete-user"]')).toBeEnabled();
    await expect(page.locator('[data-testid="reset-password"]')).toBeEnabled();
    
    // 사용자 정지
    await page.click('[data-testid="suspend-user"]');
    await page.fill('[data-testid="suspend-reason"]', '이용약관 위반');
    await page.selectOption('[data-testid="suspend-duration"]', '7days');
    await page.click('[data-testid="confirm-suspend"]');
    
    // 정지 확인
    await expect(page.locator('[data-testid="user-suspended-badge"]')).toBeVisible();
  });

  test('신고 처리 시스템', async ({ page }) => {
    await page.goto('/admin/reports');
    
    // 신고 목록
    await expect(page.locator('[data-testid="reports-table"]')).toBeVisible();
    
    // 필터링
    await page.selectOption('[data-testid="report-type-filter"]', 'INAPPROPRIATE_CONTENT');
    await page.selectOption('[data-testid="report-status-filter"]', 'PENDING');
    
    // 신고 상세 보기
    await page.click('[data-testid="report-item-1"]');
    
    // 신고 내용 확인
    await expect(page.locator('[data-testid="report-type"]')).toContainText('부적절한 콘텐츠');
    await expect(page.locator('[data-testid="reporter-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="reported-user-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-evidence"]')).toBeVisible();
    
    // 신고된 콘텐츠 확인
    await page.click('[data-testid="view-reported-content"]');
    await expect(page.locator('[data-testid="content-preview"]')).toBeVisible();
    
    // 처리 액션
    await page.click('[data-testid="take-action"]');
    await page.selectOption('[data-testid="action-type"]', 'WARNING');
    await page.fill('[data-testid="action-message"]', '커뮤니티 가이드라인을 준수해주세요');
    await page.click('[data-testid="send-warning"]');
    
    // 처리 완료
    await expect(page.locator('[data-testid="report-resolved"]')).toBeVisible();
  });

  test('그룹 관리', async ({ page }) => {
    await page.goto('/admin/groups');
    
    // 그룹 목록
    await expect(page.locator('[data-testid="groups-table"]')).toBeVisible();
    
    // 그룹 유형별 필터
    await page.click('[data-testid="filter-official-groups"]');
    await expect(page.locator('[data-testid^="group-row-"]')).toHaveCount(10);
    
    // 그룹 상세
    await page.click('[data-testid="group-samsung"]');
    
    // 그룹 정보
    await expect(page.locator('[data-testid="group-member-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="group-activity-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="group-match-rate"]')).toBeVisible();
    
    // 그룹 설정 변경
    await page.click('[data-testid="edit-group-settings"]');
    await page.fill('[data-testid="min-members"]', '20');
    await page.check('[data-testid="require-verification"]');
    await page.click('[data-testid="save-group-settings"]');
  });

  test('수익 및 결제 분석', async ({ page }) => {
    await page.goto('/admin/revenue');
    
    // 수익 대시보드
    await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
    await expect(page.locator('[data-testid="mrr"]')).toBeVisible(); // Monthly Recurring Revenue
    await expect(page.locator('[data-testid="arpu"]')).toBeVisible(); // Average Revenue Per User
    
    // 기간별 분석
    await page.selectOption('[data-testid="date-range"]', 'last30days');
    await page.click('[data-testid="apply-filter"]');
    
    // 상품별 매출
    await expect(page.locator('[data-testid="credit-package-revenue"]')).toBeVisible();
    await expect(page.locator('[data-testid="premium-monthly-revenue"]')).toBeVisible();
    await expect(page.locator('[data-testid="premium-yearly-revenue"]')).toBeVisible();
    
    // 결제 수단별 분석
    await page.click('[data-testid="payment-methods-tab"]');
    await expect(page.locator('[data-testid="toss-payments-percentage"]')).toBeVisible();
    await expect(page.locator('[data-testid="kakao-pay-percentage"]')).toBeVisible();
    
    // 환불 관리
    await page.click('[data-testid="refunds-tab"]');
    await expect(page.locator('[data-testid="pending-refunds"]')).toBeVisible();
  });

  test('시스템 모니터링', async ({ page }) => {
    await page.goto('/admin/monitoring');
    
    // 시스템 상태
    await expect(page.locator('[data-testid="system-health"]')).toContainText('정상');
    await expect(page.locator('[data-testid="api-uptime"]')).toBeVisible();
    await expect(page.locator('[data-testid="database-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="redis-status"]')).toBeVisible();
    
    // 성능 메트릭
    await expect(page.locator('[data-testid="avg-response-time"]')).toBeVisible();
    await expect(page.locator('[data-testid="requests-per-second"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-rate"]')).toBeVisible();
    
    // 실시간 로그
    await page.click('[data-testid="view-logs"]');
    await expect(page.locator('[data-testid="log-stream"]')).toBeVisible();
    
    // 로그 필터
    await page.selectOption('[data-testid="log-level"]', 'ERROR');
    await page.fill('[data-testid="log-search"]', 'payment');
    await page.click('[data-testid="apply-log-filter"]');
    
    // 알림 설정
    await page.click('[data-testid="alert-settings"]');
    await page.check('[data-testid="alert-high-error-rate"]');
    await page.fill('[data-testid="alert-threshold"]', '5');
    await page.click('[data-testid="save-alert-settings"]');
  });

  test('보안 감시 및 이상 탐지', async ({ page }) => {
    await page.goto('/admin/security');
    
    // 보안 대시보드
    await expect(page.locator('[data-testid="security-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="suspicious-activities"]')).toBeVisible();
    
    // 이상 활동 목록
    await expect(page.locator('[data-testid="anomaly-list"]')).toBeVisible();
    
    // 이상 활동 상세
    await page.click('[data-testid="anomaly-item-1"]');
    await expect(page.locator('[data-testid="anomaly-type"]')).toContainText('비정상적인 로그인 시도');
    await expect(page.locator('[data-testid="anomaly-details"]')).toBeVisible();
    
    // IP 차단
    await page.click('[data-testid="block-ip"]');
    await page.fill('[data-testid="block-reason"]', '반복적인 로그인 시도');
    await page.click('[data-testid="confirm-block"]');
    
    // 차단 목록 관리
    await page.goto('/admin/security/blocked');
    await expect(page.locator('[data-testid="blocked-ips-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="blocked-users-table"]')).toBeVisible();
  });

  test('컨텐츠 모더레이션', async ({ page }) => {
    await page.goto('/admin/moderation');
    
    // 자동 필터링 설정
    await page.click('[data-testid="auto-moderation-settings"]');
    await page.check('[data-testid="enable-profanity-filter"]');
    await page.check('[data-testid="enable-spam-detection"]');
    await page.check('[data-testid="enable-image-moderation"]');
    
    // 금지어 관리
    await page.click('[data-testid="banned-words-tab"]');
    await page.fill('[data-testid="add-banned-word"]', '부적절한단어');
    await page.click('[data-testid="add-word-button"]');
    
    // 검토 대기 콘텐츠
    await page.click('[data-testid="pending-review-tab"]');
    await expect(page.locator('[data-testid="review-queue"]')).toBeVisible();
    
    // 콘텐츠 검토
    await page.click('[data-testid="review-content-1"]');
    await expect(page.locator('[data-testid="content-details"]')).toBeVisible();
    await page.click('[data-testid="approve-content"]');
    
    // 모더레이션 통계
    await page.click('[data-testid="moderation-stats-tab"]');
    await expect(page.locator('[data-testid="auto-blocked-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="manually-reviewed-count"]')).toBeVisible();
  });

  test('관리자 활동 로그', async ({ page }) => {
    await page.goto('/admin/audit-log');
    
    // 활동 로그 목록
    await expect(page.locator('[data-testid="audit-log-table"]')).toBeVisible();
    
    // 필터링
    await page.selectOption('[data-testid="admin-filter"]', 'admin@glimpse.app');
    await page.selectOption('[data-testid="action-type-filter"]', 'USER_SUSPENSION');
    await page.click('[data-testid="apply-filters"]');
    
    // 로그 상세
    await page.click('[data-testid="log-entry-1"]');
    await expect(page.locator('[data-testid="log-timestamp"]')).toBeVisible();
    await expect(page.locator('[data-testid="log-admin"]')).toBeVisible();
    await expect(page.locator('[data-testid="log-action"]')).toBeVisible();
    await expect(page.locator('[data-testid="log-target"]')).toBeVisible();
    await expect(page.locator('[data-testid="log-details"]')).toBeVisible();
  });
});