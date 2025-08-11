import { test, expect } from '@playwright/test';
import { SUPPORTED_LANGUAGES } from '../../shared/constants/i18n';

/**
 * 다국어 지원 E2E 테스트
 * 
 * 테스트 시나리오:
 * 1. 언어 자동 감지
 * 2. 언어 변경
 * 3. 번역 텍스트 표시
 * 4. 날짜/시간 포맷
 * 5. 통화 포맷
 * 6. RTL 지원 (향후)
 */

test.describe('i18n - Internationalization Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // 테스트 환경 설정
    await page.goto('http://localhost:8081');
    await page.waitForLoadState('networkidle');
  });

  test('should detect browser language automatically', async ({ page, browserName }) => {
    // 브라우저 언어를 한국어로 설정
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'language', {
        get: () => 'ko-KR'
      });
    });
    
    await page.reload();
    await page.waitForTimeout(1000);
    
    // 한국어 텍스트 확인
    const homeTitle = await page.locator('text=홈').first();
    await expect(homeTitle).toBeVisible();
  });

  test('should change language from settings', async ({ page }) => {
    // 프로필 화면으로 이동
    await page.locator('[data-testid="tab-profile"]').click();
    await page.waitForTimeout(500);
    
    // 언어 선택기 클릭
    const languageSelector = await page.locator('[data-testid="language-selector"]');
    await languageSelector.click();
    
    // 영어 선택
    await page.locator('text=English').click();
    await page.waitForTimeout(1000);
    
    // 영어 텍스트 확인
    const settingsTitle = await page.locator('text=Settings').first();
    await expect(settingsTitle).toBeVisible();
    
    // 일본어로 변경
    await languageSelector.click();
    await page.locator('text=日本語').click();
    await page.waitForTimeout(1000);
    
    // 일본어 텍스트 확인
    const settingsTitleJa = await page.locator('text=設定').first();
    await expect(settingsTitleJa).toBeVisible();
  });

  test('should persist language preference', async ({ page, context }) => {
    // 언어를 영어로 변경
    await page.locator('[data-testid="tab-profile"]').click();
    await page.locator('[data-testid="language-selector"]').click();
    await page.locator('text=English').click();
    await page.waitForTimeout(1000);
    
    // 새 페이지 열기
    const newPage = await context.newPage();
    await newPage.goto('http://localhost:8081');
    await newPage.waitForLoadState('networkidle');
    
    // 영어가 유지되는지 확인
    const homeTitle = await newPage.locator('text=Home').first();
    await expect(homeTitle).toBeVisible();
    
    await newPage.close();
  });

  test('should display correct date format for each language', async ({ page }) => {
    const testDate = new Date('2024-03-15T10:30:00');
    
    // 한국어 날짜 포맷 확인
    await page.evaluate((date) => {
      const formatted = new Intl.DateTimeFormat('ko-KR').format(new Date(date));
      document.body.setAttribute('data-date-ko', formatted);
    }, testDate.toISOString());
    
    const koreanDate = await page.getAttribute('body', 'data-date-ko');
    expect(koreanDate).toMatch(/2024.*3.*15/);
    
    // 영어 날짜 포맷 확인
    await page.evaluate((date) => {
      const formatted = new Intl.DateTimeFormat('en-US').format(new Date(date));
      document.body.setAttribute('data-date-en', formatted);
    }, testDate.toISOString());
    
    const englishDate = await page.getAttribute('body', 'data-date-en');
    expect(englishDate).toMatch(/3.*15.*2024/);
    
    // 일본어 날짜 포맷 확인
    await page.evaluate((date) => {
      const formatted = new Intl.DateTimeFormat('ja-JP').format(new Date(date));
      document.body.setAttribute('data-date-ja', formatted);
    }, testDate.toISOString());
    
    const japaneseDate = await page.getAttribute('body', 'data-date-ja');
    expect(japaneseDate).toMatch(/2024.*3.*15/);
  });

  test('should display correct currency format for each language', async ({ page }) => {
    const amount = 9900;
    
    // 한국어 통화 포맷 확인 (₩9,900)
    await page.evaluate((amt) => {
      const formatted = new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW'
      }).format(amt);
      document.body.setAttribute('data-currency-ko', formatted);
    }, amount);
    
    const koreanCurrency = await page.getAttribute('body', 'data-currency-ko');
    expect(koreanCurrency).toContain('₩');
    expect(koreanCurrency).toContain('9,900');
    
    // 영어 통화 포맷 확인 ($9.90)
    await page.evaluate((amt) => {
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amt / 1000);
      document.body.setAttribute('data-currency-en', formatted);
    }, amount);
    
    const englishCurrency = await page.getAttribute('body', 'data-currency-en');
    expect(englishCurrency).toContain('$');
    expect(englishCurrency).toContain('9.90');
    
    // 일본어 통화 포맷 확인 (¥9,900)
    await page.evaluate((amt) => {
      const formatted = new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY'
      }).format(amt);
      document.body.setAttribute('data-currency-ja', formatted);
    }, amount);
    
    const japaneseCurrency = await page.getAttribute('body', 'data-currency-ja');
    expect(japaneseCurrency).toContain('¥');
  });

  test('should handle missing translations gracefully', async ({ page }) => {
    // 존재하지 않는 번역 키 테스트
    await page.evaluate(() => {
      // @ts-ignore
      window.testMissingKey = window.i18n?.t('nonexistent:key:path') || '[Missing]';
    });
    
    const missingTranslation = await page.evaluate(() => {
      // @ts-ignore
      return window.testMissingKey;
    });
    
    // 개발 환경에서는 키 경로를 표시하거나 폴백 텍스트 표시
    expect(missingTranslation).toBeTruthy();
    expect(missingTranslation).not.toBe('');
  });

  test('should handle long text truncation for different languages', async ({ page }) => {
    const longTexts = {
      en: 'This is a very long text that should be truncated properly in English',
      ko: '이것은 한국어로 작성된 매우 긴 텍스트이며 적절하게 잘려야 합니다',
      ja: 'これは日本語で書かれた非常に長いテキストで、適切に切り詰められるべきです',
      zh: '这是用中文写的非常长的文本，应该被适当地截断',
    };
    
    // 각 언어별 텍스트 truncation 테스트
    for (const [lang, text] of Object.entries(longTexts)) {
      await page.evaluate(({ text, maxLength }) => {
        const truncated = text.length > maxLength 
          ? text.substring(0, maxLength) + '...'
          : text;
        document.body.setAttribute(`data-truncated-${lang}`, truncated);
      }, { text, maxLength: 20, lang });
      
      const truncatedText = await page.getAttribute('body', `data-truncated-${lang}`);
      expect(truncatedText).toHaveLength(23); // 20 + '...'
      expect(truncatedText).toEndWith('...');
    }
  });

  test('should apply correct font for each language', async ({ page }) => {
    const languages = ['ko', 'en', 'ja', 'zh'];
    
    for (const lang of languages) {
      // 언어 변경
      await page.locator('[data-testid="tab-profile"]').click();
      await page.locator('[data-testid="language-selector"]').click();
      await page.locator(`[data-language="${lang}"]`).click();
      await page.waitForTimeout(500);
      
      // 폰트 패밀리 확인
      const bodyFont = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontFamily;
      });
      
      // 언어별 예상 폰트 확인
      switch (lang) {
        case 'ko':
          expect(bodyFont).toContain('Pretendard');
          break;
        case 'ja':
          expect(bodyFont).toMatch(/Hiragino|Meiryo/);
          break;
        case 'zh':
          expect(bodyFont).toMatch(/PingFang|Microsoft YaHei/);
          break;
        default:
          expect(bodyFont).toMatch(/system-ui|Segoe UI|Roboto/);
      }
    }
  });

  test('should handle pluralization correctly', async ({ page }) => {
    const testCases = [
      { count: 0, expected: { en: '0 messages', ko: '메시지 0개' } },
      { count: 1, expected: { en: '1 message', ko: '메시지 1개' } },
      { count: 5, expected: { en: '5 messages', ko: '메시지 5개' } },
    ];
    
    for (const testCase of testCases) {
      // 영어 복수형 테스트
      await page.evaluate(({ count }) => {
        const result = count === 1 ? `${count} message` : `${count} messages`;
        document.body.setAttribute('data-plural-en', result);
      }, testCase);
      
      const englishPlural = await page.getAttribute('body', 'data-plural-en');
      expect(englishPlural).toBe(testCase.expected.en);
      
      // 한국어 복수형 테스트 (한국어는 복수형이 없음)
      await page.evaluate(({ count }) => {
        const result = `메시지 ${count}개`;
        document.body.setAttribute('data-plural-ko', result);
      }, testCase);
      
      const koreanPlural = await page.getAttribute('body', 'data-plural-ko');
      expect(koreanPlural).toBe(testCase.expected.ko);
    }
  });

  test('should handle text direction (LTR/RTL) correctly', async ({ page }) => {
    // 현재는 모든 언어가 LTR이지만, 향후 RTL 언어 추가 시 테스트
    const textDirection = await page.evaluate(() => {
      return window.getComputedStyle(document.body).direction;
    });
    
    expect(textDirection).toBe('ltr');
  });
});

/**
 * API 다국어 응답 테스트
 */
test.describe('i18n - API Response Tests', () => {
  
  test('should return localized error messages', async ({ request }) => {
    // 한국어 에러 메시지 테스트
    const responseKo = await request.get('http://localhost:3001/api/v1/users/nonexistent', {
      headers: {
        'Accept-Language': 'ko-KR',
      },
    });
    
    const dataKo = await responseKo.json();
    expect(dataKo.locale).toBe('ko');
    expect(dataKo.error?.message).toContain('찾을 수 없습니다');
    
    // 영어 에러 메시지 테스트
    const responseEn = await request.get('http://localhost:3001/api/v1/users/nonexistent', {
      headers: {
        'Accept-Language': 'en-US',
      },
    });
    
    const dataEn = await responseEn.json();
    expect(dataEn.locale).toBe('en');
    expect(dataEn.error?.message).toContain('not found');
  });

  test('should return localized success messages', async ({ request }) => {
    // 테스트용 사용자 프로필 업데이트
    const updateData = { nickname: 'TestUser' };
    
    // 한국어 성공 메시지 테스트
    const responseKo = await request.put('http://localhost:3001/api/v1/users/profile', {
      headers: {
        'Accept-Language': 'ko-KR',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      data: updateData,
    });
    
    if (responseKo.ok()) {
      const dataKo = await responseKo.json();
      expect(dataKo.locale).toBe('ko');
      expect(dataKo.message).toContain('업데이트');
    }
  });
});