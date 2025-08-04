import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('접근성 테스트', () => {
  test('로그인 페이지 접근성', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Axe 접근성 검사 도구 주입
    await injectAxe(page);
    
    // 접근성 검사 실행
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      }
    });
    
    // 폼 레이블 확인
    await expect(page.locator('label[for="phone-input"]')).toBeVisible();
    await expect(page.locator('label[for="phone-input"]')).toContainText('전화번호');
    
    // ARIA 속성 확인
    const phoneInput = page.locator('[data-testid="phone-input"]');
    await expect(phoneInput).toHaveAttribute('aria-label', '전화번호 입력');
    await expect(phoneInput).toHaveAttribute('aria-required', 'true');
    
    // 에러 메시지 접근성
    await page.click('[data-testid="send-code-button"]');
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toHaveAttribute('role', 'alert');
    await expect(errorMessage).toHaveAttribute('aria-live', 'polite');
  });

  test('키보드 네비게이션', async ({ page }) => {
    await page.goto('/');
    
    // Tab 키로 포커스 이동
    await page.keyboard.press('Tab');
    const firstFocusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocusedElement).toBeTruthy();
    
    // 로그인
    await page.goto('/auth/login');
    await page.fill('[data-testid="phone-input"]', '01019191919');
    await page.click('[data-testid="send-code-button"]');
    await page.fill('[data-testid="code-input"]', '191919');
    await page.click('[data-testid="verify-button"]');
    
    // 메인 네비게이션 키보드 접근
    await page.goto('/');
    
    // Tab으로 네비게이션 메뉴 이동
    let navReached = false;
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el?.tagName,
          role: el?.getAttribute('role'),
          text: el?.textContent
        };
      });
      
      if (focused.role === 'navigation' || focused.text?.includes('그룹')) {
        navReached = true;
        break;
      }
    }
    expect(navReached).toBeTruthy();
    
    // Enter 키로 선택
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/groups');
    
    // Escape 키로 모달 닫기
    await page.click('[data-testid="create-group-button"]');
    await expect(page.locator('[data-testid="create-group-modal"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="create-group-modal"]')).not.toBeVisible();
  });

  test('스크린 리더 호환성', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[data-testid="phone-input"]', '01020202020');
    await page.click('[data-testid="send-code-button"]');
    await page.fill('[data-testid="code-input"]', '202020');
    await page.click('[data-testid="verify-button"]');
    
    await page.goto('/matching');
    
    // 주요 랜드마크 확인
    await expect(page.locator('header[role="banner"]')).toBeVisible();
    await expect(page.locator('nav[role="navigation"]')).toBeVisible();
    await expect(page.locator('main[role="main"]')).toBeVisible();
    
    // 이미지 대체 텍스트
    const userCards = await page.locator('[data-testid^="user-card-"]').all();
    for (const card of userCards.slice(0, 3)) {
      const img = card.locator('img');
      await expect(img).toHaveAttribute('alt');
      const altText = await img.getAttribute('alt');
      expect(altText).not.toBe('');
    }
    
    // 버튼 레이블
    const likeButton = page.locator('[data-testid="like-button"]');
    await expect(likeButton).toHaveAttribute('aria-label', '좋아요');
    
    const passButton = page.locator('[data-testid="pass-button"]');
    await expect(passButton).toHaveAttribute('aria-label', '패스');
    
    // 동적 콘텐츠 알림
    await likeButton.click();
    const notification = page.locator('[data-testid="action-notification"]');
    await expect(notification).toHaveAttribute('aria-live', 'polite');
    await expect(notification).toHaveAttribute('aria-atomic', 'true');
  });

  test('색상 대비 및 시각적 표시', async ({ page }) => {
    await page.goto('/');
    
    // 색상 대비 검사 (WCAG AA 기준)
    await injectAxe(page);
    const results = await page.evaluate(async () => {
      const axe = (window as any).axe;
      const result = await axe.run({
        rules: {
          'color-contrast': { enabled: true }
        }
      });
      return result.violations;
    });
    
    // 색상 대비 위반 없음
    const colorContrastViolations = results.filter((v: any) => v.id === 'color-contrast');
    expect(colorContrastViolations).toHaveLength(0);
    
    // 포커스 표시 확인
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus');
    const focusStyle = await focusedElement.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        outlineColor: styles.outlineColor,
        boxShadow: styles.boxShadow
      };
    });
    
    // 포커스가 시각적으로 표시됨
    const hasVisibleFocus = 
      (focusStyle.outline !== 'none' && focusStyle.outlineWidth !== '0px') ||
      focusStyle.boxShadow !== 'none';
    expect(hasVisibleFocus).toBeTruthy();
  });

  test('폼 접근성', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[data-testid="phone-input"]', '01021212121');
    await page.click('[data-testid="send-code-button"]');
    await page.fill('[data-testid="code-input"]', '212121');
    await page.click('[data-testid="verify-button"]');
    
    await page.goto('/profile/edit');
    
    // 필수 필드 표시
    const requiredFields = await page.locator('[required], [aria-required="true"]').all();
    expect(requiredFields.length).toBeGreaterThan(0);
    
    // 필드 그룹화
    const fieldsets = await page.locator('fieldset').all();
    for (const fieldset of fieldsets) {
      const legend = fieldset.locator('legend');
      await expect(legend).toBeVisible();
    }
    
    // 에러 메시지와 필드 연결
    await page.fill('[data-testid="nickname-input"]', '');
    await page.click('[data-testid="save-profile"]');
    
    const nicknameInput = page.locator('[data-testid="nickname-input"]');
    const errorId = await nicknameInput.getAttribute('aria-describedby');
    expect(errorId).toBeTruthy();
    
    const errorElement = page.locator(`#${errorId}`);
    await expect(errorElement).toBeVisible();
    await expect(errorElement).toContainText('필수');
  });

  test('모바일 터치 타겟 크기', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/auth/login');
    await page.fill('[data-testid="phone-input"]', '01022222222');
    await page.click('[data-testid="send-code-button"]');
    await page.fill('[data-testid="code-input"]', '222222');
    await page.click('[data-testid="verify-button"]');
    
    await page.goto('/matching');
    
    // 터치 타겟 크기 확인 (최소 44x44px)
    const touchTargets = await page.locator('button, a, [role="button"]').all();
    
    for (const target of touchTargets.slice(0, 5)) {
      const box = await target.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('언어 및 지역화', async ({ page }) => {
    await page.goto('/');
    
    // HTML lang 속성
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe('ko');
    
    // 날짜/시간 형식
    await page.goto('/auth/login');
    await page.fill('[data-testid="phone-input"]', '01023232323');
    await page.click('[data-testid="send-code-button"]');
    await page.fill('[data-testid="code-input"]', '232323');
    await page.click('[data-testid="verify-button"]');
    
    await page.goto('/chat');
    
    // 한국 시간 형식 확인
    const timeElements = await page.locator('[data-testid^="message-time-"]').all();
    for (const timeEl of timeElements.slice(0, 3)) {
      const timeText = await timeEl.textContent();
      expect(timeText).toMatch(/오전|오후/); // 한국식 시간 표시
    }
    
    // 통화 형식
    await page.goto('/payment');
    const priceElements = await page.locator('[data-testid^="price-"]').all();
    for (const priceEl of priceElements.slice(0, 3)) {
      const priceText = await priceEl.textContent();
      expect(priceText).toMatch(/₩|원/); // 한국 통화
    }
  });

  test('로딩 상태 접근성', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[data-testid="phone-input"]', '01024242424');
    
    // 로딩 상태 알림
    const sendButton = page.locator('[data-testid="send-code-button"]');
    await sendButton.click();
    
    // 로딩 중 ARIA 상태
    await expect(sendButton).toHaveAttribute('aria-busy', 'true');
    await expect(sendButton).toHaveAttribute('aria-disabled', 'true');
    
    // 로딩 스피너 접근성
    const spinner = page.locator('[data-testid="loading-spinner"]');
    await expect(spinner).toHaveAttribute('role', 'status');
    await expect(spinner).toHaveAttribute('aria-label', '로딩 중');
  });

  test('에러 처리 접근성', async ({ page }) => {
    await page.goto('/auth/login');
    
    // 네트워크 오류 시뮬레이션
    await page.route('**/api/auth/send-code', route => {
      route.abort('failed');
    });
    
    await page.fill('[data-testid="phone-input"]', '01025252525');
    await page.click('[data-testid="send-code-button"]');
    
    // 에러 알림
    const errorAlert = page.locator('[data-testid="error-alert"]');
    await expect(errorAlert).toHaveAttribute('role', 'alert');
    await expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
    
    // 에러 복구 안내
    await expect(errorAlert).toContainText('다시 시도');
    const retryButton = errorAlert.locator('button');
    await expect(retryButton).toHaveAttribute('aria-label', '다시 시도');
  });

  test('다크 모드 접근성', async ({ page }) => {
    await page.goto('/');
    
    // 시스템 다크 모드 선호 감지
    await page.emulateMedia({ colorScheme: 'dark' });
    
    // 다크 모드에서도 색상 대비 유지
    await injectAxe(page);
    const darkModeResults = await page.evaluate(async () => {
      const axe = (window as any).axe;
      const result = await axe.run({
        rules: {
          'color-contrast': { enabled: true }
        }
      });
      return result.violations;
    });
    
    expect(darkModeResults).toHaveLength(0);
    
    // 다크 모드 토글 접근성
    const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"]');
    await expect(darkModeToggle).toHaveAttribute('aria-label');
    await expect(darkModeToggle).toHaveAttribute('aria-pressed');
  });
});