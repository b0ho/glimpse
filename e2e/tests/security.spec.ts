import { test, expect } from '@playwright/test';

test.describe('보안 테스트', () => {
  test('인증 우회 시도 방지', async ({ page }) => {
    // 직접 보호된 페이지 접근 시도
    await page.goto('/matching');
    
    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL('/auth/login');
    
    // 가짜 토큰으로 접근 시도
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'fake-jwt-token');
    });
    
    await page.goto('/matching');
    
    // 여전히 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL('/auth/login');
    
    // 에러 메시지 확인
    await expect(page.locator('[data-testid="auth-error"]')).toContainText('유효하지 않은 토큰');
  });

  test('SQL 인젝션 방지', async ({ page }) => {
    await page.goto('/auth/login');
    
    // SQL 인젝션 시도
    const sqlInjectionPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "admin'--",
      "' OR 1=1--"
    ];
    
    for (const payload of sqlInjectionPayloads) {
      await page.fill('[data-testid="phone-input"]', payload);
      await page.click('[data-testid="send-code-button"]');
      
      // 정상적인 에러 메시지만 표시
      await expect(page.locator('[data-testid="error-message"]')).toContainText('올바른 전화번호를 입력하세요');
      
      // 데이터베이스 에러 노출 없음
      await expect(page.locator('body')).not.toContainText('SQL');
      await expect(page.locator('body')).not.toContainText('syntax error');
    }
  });

  test('XSS(Cross-Site Scripting) 방지', async ({ page }) => {
    // 로그인
    await page.goto('/auth/login');
    await page.fill('[data-testid="phone-input"]', '01012121212');
    await page.click('[data-testid="send-code-button"]');
    await page.fill('[data-testid="code-input"]', '121212');
    await page.click('[data-testid="verify-button"]');
    
    // XSS 페이로드
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>'
    ];
    
    // 프로필 편집에서 XSS 시도
    await page.goto('/profile/edit');
    
    for (const payload of xssPayloads) {
      await page.fill('[data-testid="nickname-input"]', payload);
      await page.fill('[data-testid="bio-input"]', payload);
      await page.click('[data-testid="save-profile"]');
      
      // 스크립트 실행 안됨 확인
      const alertCount = await page.evaluate(() => {
        let count = 0;
        const originalAlert = window.alert;
        window.alert = () => { count++; };
        setTimeout(() => { window.alert = originalAlert; }, 100);
        return count;
      });
      
      expect(alertCount).toBe(0);
      
      // HTML 이스케이프 확인
      await page.goto('/profile');
      await expect(page.locator('[data-testid="user-nickname"]')).not.toContainText('<script>');
      await expect(page.locator('[data-testid="user-bio"]')).not.toContainText('<script>');
    }
  });

  test('CSRF(Cross-Site Request Forgery) 보호', async ({ page, context }) => {
    // 로그인
    await page.goto('/auth/login');
    await page.fill('[data-testid="phone-input"]', '01013131313');
    await page.click('[data-testid="send-code-button"]');
    await page.fill('[data-testid="code-input"]', '131313');
    await page.click('[data-testid="verify-button"]');
    
    // CSRF 토큰 확인
    const csrfToken = await page.evaluate(() => {
      return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    });
    
    expect(csrfToken).toBeTruthy();
    
    // 다른 도메인에서 요청 시도 (시뮬레이션)
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/user/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://malicious-site.com'
          },
          body: JSON.stringify({ userId: 'current' })
        });
        return { status: res.status, ok: res.ok };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    // CORS 또는 CSRF 보호로 차단됨
    expect(response.ok).toBeFalsy();
  });

  test('세션 하이재킹 방지', async ({ page, browser }) => {
    // 첫 번째 브라우저에서 로그인
    await page.goto('/auth/login');
    await page.fill('[data-testid="phone-input"]', '01014141414');
    await page.click('[data-testid="send-code-button"]');
    await page.fill('[data-testid="code-input"]', '141414');
    await page.click('[data-testid="verify-button"]');
    
    // 세션 토큰 획득
    const sessionToken = await page.evaluate(() => {
      return localStorage.getItem('auth-token');
    });
    
    // 다른 브라우저/컨텍스트에서 같은 토큰 사용 시도
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    
    await page2.goto('/');
    await page2.evaluate((token) => {
      localStorage.setItem('auth-token', token);
    }, sessionToken);
    
    await page2.goto('/profile');
    
    // IP/디바이스 변경 감지로 재인증 요구
    await expect(page2).toHaveURL('/auth/verify-device');
    await expect(page2.locator('[data-testid="device-verification"]')).toBeVisible();
    
    await context2.close();
  });

  test('비밀번호/민감정보 노출 방지', async ({ page }) => {
    // 네트워크 요청 모니터링
    const requests: any[] = [];
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        postData: request.postData()
      });
    });
    
    // 로그인 과정
    await page.goto('/auth/login');
    await page.fill('[data-testid="phone-input"]', '01015151515');
    await page.click('[data-testid="send-code-button"]');
    await page.fill('[data-testid="code-input"]', '151515');
    await page.click('[data-testid="verify-button"]');
    
    // 결제 정보 입력
    await page.goto('/payment');
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="card-cvv"]', '123');
    await page.click('[data-testid="submit-payment"]');
    
    // 민감 정보가 평문으로 전송되지 않음 확인
    for (const request of requests) {
      if (request.postData) {
        // 전화번호는 마스킹되어야 함
        expect(request.postData).not.toContain('01015151515');
        
        // 카드 정보는 토큰화되어야 함
        expect(request.postData).not.toContain('4242424242424242');
        expect(request.postData).not.toContain('123');
        
        // 인증 코드도 해시되어야 함
        expect(request.postData).not.toContain('151515');
      }
    }
  });

  test('파일 업로드 보안', async ({ page }) => {
    // 로그인
    await page.goto('/auth/login');
    await page.fill('[data-testid="phone-input"]', '01016161616');
    await page.click('[data-testid="send-code-button"]');
    await page.fill('[data-testid="code-input"]', '161616');
    await page.click('[data-testid="verify-button"]');
    
    await page.goto('/profile/edit');
    
    // 악성 파일 업로드 시도
    const maliciousFiles = [
      { name: 'malicious.php', content: '<?php system($_GET["cmd"]); ?>' },
      { name: 'script.html', content: '<script>alert("XSS")</script>' },
      { name: 'large.jpg', size: 50 * 1024 * 1024 }, // 50MB
      { name: '../../../etc/passwd', content: 'root:x:0:0:root:/root:/bin/bash' }
    ];
    
    for (const file of maliciousFiles) {
      // 파일 생성 및 업로드 시뮬레이션
      const buffer = file.size 
        ? Buffer.alloc(file.size) 
        : Buffer.from(file.content || '');
        
      const fileInput = page.locator('[data-testid="profile-image-input"]');
      
      // 파일 업로드 시도
      await fileInput.setInputFiles({
        name: file.name,
        mimeType: 'image/jpeg',
        buffer: buffer
      });
      
      // 적절한 에러 메시지 확인
      if (file.name.includes('..')) {
        await expect(page.locator('[data-testid="upload-error"]')).toContainText('잘못된 파일명');
      } else if (file.name.includes('.php') || file.name.includes('.html')) {
        await expect(page.locator('[data-testid="upload-error"]')).toContainText('허용되지 않는 파일 형식');
      } else if (file.size && file.size > 10 * 1024 * 1024) {
        await expect(page.locator('[data-testid="upload-error"]')).toContainText('파일 크기 초과');
      }
    }
  });

  test('API 속도 제한(Rate Limiting)', async ({ page }) => {
    await page.goto('/auth/login');
    
    // 연속적인 요청
    const requestCount = 20;
    const responses: number[] = [];
    
    for (let i = 0; i < requestCount; i++) {
      await page.fill('[data-testid="phone-input"]', `010${String(i).padStart(8, '0')}`);
      
      const response = await page.evaluate(async () => {
        try {
          const res = await fetch('/api/auth/send-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: '01000000000' })
          });
          return res.status;
        } catch {
          return 0;
        }
      });
      
      responses.push(response);
      
      // 빠른 연속 요청
      if (i < 10) {
        await page.waitForTimeout(100);
      }
    }
    
    // 일정 횟수 이후 429 (Too Many Requests) 응답
    const rateLimitedResponses = responses.filter(status => status === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
    
    // 속도 제한 메시지 확인
    await expect(page.locator('[data-testid="rate-limit-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="rate-limit-error"]')).toContainText('너무 많은 요청');
  });

  test('데이터 암호화 확인', async ({ page }) => {
    // 로그인
    await page.goto('/auth/login');
    await page.fill('[data-testid="phone-input"]', '01017171717');
    await page.click('[data-testid="send-code-button"]');
    await page.fill('[data-testid="code-input"]', '171717');
    await page.click('[data-testid="verify-button"]');
    
    // localStorage 데이터 암호화 확인
    const localStorageData = await page.evaluate(() => {
      const data: any = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          data[key] = localStorage.getItem(key);
        }
      }
      return data;
    });
    
    // 민감한 데이터가 평문으로 저장되지 않음
    const sensitivePatterns = [
      /010\d{8}/, // 전화번호
      /\d{6}/, // 인증코드
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // 이메일
    ];
    
    for (const value of Object.values(localStorageData)) {
      if (typeof value === 'string') {
        for (const pattern of sensitivePatterns) {
          expect(value).not.toMatch(pattern);
        }
      }
    }
    
    // HTTPS 확인 (프로덕션 환경)
    if (!page.url().includes('localhost')) {
      expect(page.url()).toMatch(/^https:/);
    }
  });

  test('관리자 권한 상승 방지', async ({ page }) => {
    // 일반 사용자로 로그인
    await page.goto('/auth/login');
    await page.fill('[data-testid="phone-input"]', '01018181818');
    await page.click('[data-testid="send-code-button"]');
    await page.fill('[data-testid="code-input"]', '181818');
    await page.click('[data-testid="verify-button"]');
    
    // 관리자 페이지 직접 접근 시도
    await page.goto('/admin/dashboard');
    
    // 접근 거부
    await expect(page).toHaveURL('/403');
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
    
    // 권한 조작 시도
    await page.evaluate(() => {
      localStorage.setItem('user-role', 'admin');
      sessionStorage.setItem('isAdmin', 'true');
    });
    
    await page.goto('/admin/dashboard');
    
    // 여전히 접근 거부 (서버 측 검증)
    await expect(page).toHaveURL('/403');
  });
});