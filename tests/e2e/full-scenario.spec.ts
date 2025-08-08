import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker/locale/ko';

// Test data generators
const generateUserData = () => ({
  email: faker.internet.email(),
  password: 'Test1234!@#$',
  name: faker.person.fullName(),
  nickname: faker.internet.userName(),
  phone: '010' + faker.string.numeric(8),
  birthDate: faker.date.birthdate({ min: 18, max: 40, mode: 'age' }).toISOString().split('T')[0],
  gender: faker.helpers.arrayElement(['MALE', 'FEMALE']),
  bio: faker.lorem.paragraph()
});

// Helper functions
async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/home', { timeout: 10000 });
}

async function createTestUser(page: Page) {
  const userData = generateUserData();
  await page.goto('/auth/register');
  
  // Fill registration form
  await page.fill('input[name="email"]', userData.email);
  await page.fill('input[name="password"]', userData.password);
  await page.fill('input[name="confirmPassword"]', userData.password);
  await page.fill('input[name="name"]', userData.name);
  await page.fill('input[name="nickname"]', userData.nickname);
  await page.fill('input[name="phone"]', userData.phone);
  await page.fill('input[name="birthDate"]', userData.birthDate);
  await page.selectOption('select[name="gender"]', userData.gender);
  
  await page.click('button[type="submit"]');
  await page.waitForURL('/auth/verify-email', { timeout: 10000 });
  
  return userData;
}

test.describe('Glimpse App - 전체 시나리오 테스트', () => {
  let user1Data: any;
  let user2Data: any;
  
  test.beforeAll(async () => {
    // Initialize test data
    user1Data = generateUserData();
    user2Data = generateUserData();
  });

  test('1. 회원가입 프로세스', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to registration
    await page.click('text=회원가입');
    await expect(page).toHaveURL('/auth/register');
    
    // Fill registration form
    await page.fill('input[name="email"]', user1Data.email);
    await page.fill('input[name="password"]', user1Data.password);
    await page.fill('input[name="confirmPassword"]', user1Data.password);
    await page.fill('input[name="name"]', user1Data.name);
    await page.fill('input[name="nickname"]', user1Data.nickname);
    await page.fill('input[name="phone"]', user1Data.phone);
    await page.fill('input[name="birthDate"]', user1Data.birthDate);
    await page.selectOption('select[name="gender"]', user1Data.gender);
    
    // Check terms agreement
    await page.check('input[name="termsAgreed"]');
    await page.check('input[name="privacyAgreed"]');
    
    // Submit registration
    await page.click('button[type="submit"]');
    
    // Verify email verification page
    await expect(page).toHaveURL('/auth/verify-email');
    await expect(page.locator('text=이메일 인증')).toBeVisible();
    
    // Simulate email verification (mock)
    await page.evaluate(() => {
      localStorage.setItem('emailVerified', 'true');
    });
    
    // Continue to profile setup
    await page.click('text=다음');
    await expect(page).toHaveURL('/onboarding/profile');
  });

  test('2. 로그인 및 로그아웃', async ({ page }) => {
    // Login test
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', user1Data.email);
    await page.fill('input[name="password"]', user1Data.password);
    await page.click('button[type="submit"]');
    
    // Check successful login
    await expect(page).toHaveURL('/home');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // Logout test
    await page.click('[data-testid="user-menu"]');
    await page.click('text=로그아웃');
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=로그인')).toBeVisible();
  });

  test('3. 프로필 관리', async ({ page }) => {
    await loginUser(page, user1Data.email, user1Data.password);
    
    // Navigate to profile
    await page.click('[data-testid="user-menu"]');
    await page.click('text=프로필');
    await expect(page).toHaveURL('/profile');
    
    // Update bio
    const newBio = '안녕하세요! 새로운 자기소개입니다.';
    await page.fill('textarea[name="bio"]', newBio);
    await page.click('text=저장');
    
    // Verify update
    await expect(page.locator('.toast-success')).toContainText('프로필이 업데이트되었습니다');
    await page.reload();
    await expect(page.locator('textarea[name="bio"]')).toHaveValue(newBio);
    
    // Upload profile image (mock)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'profile.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });
    
    await expect(page.locator('.toast-success')).toContainText('프로필 사진이 업데이트되었습니다');
  });

  test('4. 그룹 탐색 및 가입', async ({ page }) => {
    await loginUser(page, user1Data.email, user1Data.password);
    
    // Navigate to groups
    await page.click('text=그룹');
    await expect(page).toHaveURL('/groups');
    
    // Search for a group
    await page.fill('input[placeholder="그룹 검색"]', '개발자');
    await page.press('input[placeholder="그룹 검색"]', 'Enter');
    
    // Join a group
    const firstGroup = page.locator('.group-card').first();
    await firstGroup.click();
    await page.click('text=그룹 가입');
    
    // Verify join success
    await expect(page.locator('.toast-success')).toContainText('그룹에 가입했습니다');
    await expect(page.locator('text=그룹 나가기')).toBeVisible();
    
    // Create a new group
    await page.goto('/groups/create');
    await page.fill('input[name="groupName"]', '테스트 그룹');
    await page.fill('textarea[name="description"]', '테스트용 그룹입니다');
    await page.selectOption('select[name="category"]', 'HOBBY');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.toast-success')).toContainText('그룹이 생성되었습니다');
  });

  test('5. 좋아요 및 매칭 시스템', async ({ page, context }) => {
    // Create second user in new context
    const page2 = await context.newPage();
    await createTestUser(page2);
    
    // User 1 sends like
    await loginUser(page, user1Data.email, user1Data.password);
    await page.goto('/groups/1/members'); // Assuming group ID 1
    
    const memberCard = page.locator('.member-card').first();
    await memberCard.hover();
    await memberCard.locator('[data-testid="like-button"]').click();
    
    await expect(page.locator('.toast-success')).toContainText('좋아요를 보냈습니다');
    
    // User 2 sends like back (mutual match)
    await loginUser(page2, user2Data.email, user2Data.password);
    await page2.goto('/likes/received');
    
    await page2.locator('[data-testid="like-back-button"]').first().click();
    await expect(page2.locator('.toast-success')).toContainText('매칭되었습니다!');
    
    // Verify match appears in matches list
    await page.goto('/matches');
    await expect(page.locator('.match-card')).toHaveCount(1);
    
    await page2.close();
  });

  test('6. 채팅 기능', async ({ page, context }) => {
    const page2 = await context.newPage();
    
    // User 1 sends message
    await loginUser(page, user1Data.email, user1Data.password);
    await page.goto('/matches');
    await page.locator('.match-card').first().click();
    await expect(page).toHaveURL(/\/chat\/\d+/);
    
    const message1 = '안녕하세요! 반갑습니다.';
    await page.fill('[data-testid="message-input"]', message1);
    await page.press('[data-testid="message-input"]', 'Enter');
    
    // Verify message sent
    await expect(page.locator('.message-bubble').last()).toContainText(message1);
    
    // User 2 receives and replies
    await loginUser(page2, user2Data.email, user2Data.password);
    await page2.goto('/matches');
    await page2.locator('.match-card').first().click();
    
    // Verify received message
    await expect(page2.locator('.message-bubble').last()).toContainText(message1);
    
    // Send reply
    const message2 = '네, 저도 반갑습니다!';
    await page2.fill('[data-testid="message-input"]', message2);
    await page2.press('[data-testid="message-input"]', 'Enter');
    
    // User 1 sees reply
    await expect(page.locator('.message-bubble').last()).toContainText(message2);
    
    // Test typing indicator
    await page.fill('[data-testid="message-input"]', '타이핑 중...');
    await expect(page2.locator('[data-testid="typing-indicator"]')).toBeVisible();
    
    await page2.close();
  });

  test('7. 프리미엄 구독 및 결제', async ({ page }) => {
    await loginUser(page, user1Data.email, user1Data.password);
    
    // Navigate to premium page
    await page.goto('/premium');
    await expect(page.locator('h1')).toContainText('프리미엄');
    
    // Select monthly plan
    await page.click('[data-testid="premium-monthly"]');
    await expect(page.locator('.selected-plan')).toContainText('월간 구독');
    
    // Proceed to payment
    await page.click('text=결제하기');
    await expect(page).toHaveURL('/payment/checkout');
    
    // Select payment method (TossPay)
    await page.click('[data-testid="payment-toss"]');
    
    // Fill payment info (mock)
    await page.fill('input[name="cardNumber"]', '4242424242424242');
    await page.fill('input[name="expiry"]', '12/25');
    await page.fill('input[name="cvc"]', '123');
    
    // Complete payment
    await page.click('button[type="submit"]');
    
    // Mock successful payment
    await page.evaluate(() => {
      window.postMessage({ type: 'PAYMENT_SUCCESS', orderId: 'TEST123' }, '*');
    });
    
    // Verify premium activated
    await expect(page).toHaveURL('/premium/success');
    await expect(page.locator('.toast-success')).toContainText('프리미엄 구독이 활성화되었습니다');
    
    // Check premium features
    await page.goto('/home');
    await expect(page.locator('[data-testid="premium-badge"]')).toBeVisible();
    
    // Test unlimited likes
    await page.goto('/groups/1/members');
    for (let i = 0; i < 5; i++) {
      const memberCard = page.locator('.member-card').nth(i);
      await memberCard.hover();
      await memberCard.locator('[data-testid="like-button"]').click();
      await page.waitForTimeout(500);
    }
    
    // No like limit error should appear
    await expect(page.locator('.toast-error')).not.toBeVisible();
  });

  test('8. 회사 인증', async ({ page }) => {
    await loginUser(page, user1Data.email, user1Data.password);
    
    // Navigate to company verification
    await page.goto('/profile/verify-company');
    
    // Enter company email
    await page.fill('input[name="companyEmail"]', 'test@samsung.com');
    await page.click('text=인증 메일 전송');
    
    await expect(page.locator('.toast-success')).toContainText('인증 메일이 전송되었습니다');
    
    // Mock email verification
    await page.evaluate(() => {
      localStorage.setItem('companyVerified', 'true');
      localStorage.setItem('companyDomain', 'samsung.com');
    });
    
    // Upload business card (mock OCR)
    const fileInput = page.locator('input[type="file"][name="businessCard"]');
    await fileInput.setInputFiles({
      name: 'business-card.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-business-card')
    });
    
    // Mock OCR result
    await page.evaluate(() => {
      window.postMessage({ 
        type: 'OCR_COMPLETE', 
        data: { company: 'Samsung Electronics', verified: true }
      }, '*');
    });
    
    await expect(page.locator('.toast-success')).toContainText('회사 인증이 완료되었습니다');
    await expect(page.locator('[data-testid="company-badge"]')).toBeVisible();
  });

  test('9. 위치 기반 그룹', async ({ page }) => {
    await loginUser(page, user1Data.email, user1Data.password);
    
    // Navigate to location groups
    await page.goto('/groups/location');
    
    // Request location permission (mock)
    await page.evaluate(() => {
      navigator.geolocation.getCurrentPosition = (success) => {
        success({
          coords: {
            latitude: 37.5665,
            longitude: 126.9780,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
          },
          timestamp: Date.now()
        });
      };
    });
    
    // Enable location
    await page.click('text=위치 서비스 활성화');
    
    // Find nearby groups
    await expect(page.locator('.location-group-card')).toBeVisible();
    
    // Join location-based group
    const nearbyGroup = page.locator('.location-group-card').first();
    await nearbyGroup.click();
    await page.click('text=그룹 입장');
    
    await expect(page.locator('.toast-success')).toContainText('위치 그룹에 입장했습니다');
  });

  test('10. 알림 설정', async ({ page }) => {
    await loginUser(page, user1Data.email, user1Data.password);
    
    // Navigate to settings
    await page.goto('/settings/notifications');
    
    // Toggle notification settings
    await page.click('[data-testid="toggle-match-notifications"]');
    await page.click('[data-testid="toggle-message-notifications"]');
    await page.click('[data-testid="toggle-like-notifications"]');
    
    // Save settings
    await page.click('text=저장');
    await expect(page.locator('.toast-success')).toContainText('알림 설정이 저장되었습니다');
    
    // Test push notification permission (mock)
    await page.evaluate(() => {
      Notification.requestPermission = () => Promise.resolve('granted');
    });
    
    await page.click('text=푸시 알림 활성화');
    await expect(page.locator('[data-testid="push-enabled"]')).toBeVisible();
  });

  test('11. 신고 및 차단', async ({ page }) => {
    await loginUser(page, user1Data.email, user1Data.password);
    
    // Navigate to a user profile
    await page.goto('/users/2'); // Assuming user ID 2
    
    // Report user
    await page.click('[data-testid="more-options"]');
    await page.click('text=신고하기');
    
    await page.selectOption('select[name="reportReason"]', 'INAPPROPRIATE_CONTENT');
    await page.fill('textarea[name="reportDetails"]', '부적절한 내용을 게시했습니다.');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.toast-success')).toContainText('신고가 접수되었습니다');
    
    // Block user
    await page.click('[data-testid="more-options"]');
    await page.click('text=차단하기');
    await page.click('text=확인'); // Confirm dialog
    
    await expect(page.locator('.toast-success')).toContainText('사용자를 차단했습니다');
    await expect(page.locator('[data-testid="user-blocked"]')).toBeVisible();
  });

  test('12. 크레딧 구매', async ({ page }) => {
    await loginUser(page, user1Data.email, user1Data.password);
    
    // Navigate to credit purchase
    await page.goto('/credits');
    
    // Check current credit balance
    const initialCredits = await page.locator('[data-testid="credit-balance"]').textContent();
    
    // Select credit package
    await page.click('[data-testid="credit-package-10"]'); // 10 credits
    await expect(page.locator('.selected-package')).toContainText('10 크레딧');
    
    // Proceed to payment
    await page.click('text=구매하기');
    
    // Complete payment (mock)
    await page.fill('input[name="cardNumber"]', '5555555555554444');
    await page.click('button[type="submit"]');
    
    await page.evaluate(() => {
      window.postMessage({ type: 'PAYMENT_SUCCESS', credits: 10 }, '*');
    });
    
    // Verify credits added
    await expect(page.locator('.toast-success')).toContainText('크레딧이 충전되었습니다');
    const newCredits = await page.locator('[data-testid="credit-balance"]').textContent();
    expect(parseInt(newCredits || '0')).toBeGreaterThan(parseInt(initialCredits || '0'));
  });

  test('13. 좋아요 쿨다운 테스트', async ({ page }) => {
    await loginUser(page, user1Data.email, user1Data.password);
    
    // Send like to a user
    await page.goto('/groups/1/members');
    const targetUser = page.locator('.member-card').first();
    const userId = await targetUser.getAttribute('data-user-id');
    
    await targetUser.hover();
    await targetUser.locator('[data-testid="like-button"]').click();
    await expect(page.locator('.toast-success')).toContainText('좋아요를 보냈습니다');
    
    // Try to like the same user again
    await page.reload();
    await targetUser.hover();
    await targetUser.locator('[data-testid="like-button"]').click();
    
    // Should show cooldown error
    await expect(page.locator('.toast-error')).toContainText('2주 후에 다시 좋아요를 보낼 수 있습니다');
  });

  test('14. 탈퇴 프로세스', async ({ page }) => {
    await loginUser(page, user1Data.email, user1Data.password);
    
    // Navigate to account settings
    await page.goto('/settings/account');
    
    // Click delete account
    await page.click('text=계정 삭제');
    
    // Confirm deletion
    await page.fill('input[name="confirmDelete"]', 'DELETE');
    await page.click('text=계정 영구 삭제');
    
    // Re-enter password for confirmation
    await page.fill('input[name="password"]', user1Data.password);
    await page.click('button[type="submit"]');
    
    // Verify account deleted
    await expect(page).toHaveURL('/goodbye');
    await expect(page.locator('h1')).toContainText('계정이 삭제되었습니다');
    
    // Try to login with deleted account
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', user1Data.email);
    await page.fill('input[name="password"]', user1Data.password);
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.toast-error')).toContainText('계정을 찾을 수 없습니다');
  });
});

// Performance tests
test.describe('성능 테스트', () => {
  test('페이지 로딩 시간', async ({ page }) => {
    const metrics: any = {};
    
    // Home page
    const homeStart = Date.now();
    await page.goto('/');
    metrics.home = Date.now() - homeStart;
    
    // Groups page
    const groupsStart = Date.now();
    await page.goto('/groups');
    metrics.groups = Date.now() - groupsStart;
    
    // Check all pages load within 3 seconds
    Object.entries(metrics).forEach(([page, time]) => {
      expect(time).toBeLessThan(3000);
      console.log(`${page} 페이지 로딩 시간: ${time}ms`);
    });
  });

  test('API 응답 시간', async ({ page }) => {
    await page.goto('/');
    
    // Monitor API calls
    const apiTimes: number[] = [];
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiTimes.push(response.timing().responseEnd);
      }
    });
    
    // Trigger various API calls
    await loginUser(page, 'test@example.com', 'Test1234!');
    await page.goto('/groups');
    await page.goto('/matches');
    
    // Check API response times
    apiTimes.forEach(time => {
      expect(time).toBeLessThan(1000); // All APIs should respond within 1 second
    });
  });
});

// Accessibility tests
test.describe('접근성 테스트', () => {
  test('키보드 네비게이션', async ({ page }) => {
    await page.goto('/');
    
    // Tab through elements
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocused).toBeTruthy();
    
    // Navigate with keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Verify navigation worked
    await expect(page).not.toHaveURL('/');
  });

  test('스크린 리더 지원', async ({ page }) => {
    await page.goto('/');
    
    // Check for ARIA labels
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      
      // Button should have either aria-label or text content
      expect(ariaLabel || text).toBeTruthy();
    }
    
    // Check for proper heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1); // Should have exactly one h1
  });
});

// Security tests
test.describe('보안 테스트', () => {
  test('XSS 방지', async ({ page }) => {
    await loginUser(page, 'test@example.com', 'Test1234!');
    
    // Try to inject script in bio
    const xssPayload = '<script>alert("XSS")</script>';
    await page.goto('/profile');
    await page.fill('textarea[name="bio"]', xssPayload);
    await page.click('text=저장');
    
    // Reload and check if script executed
    await page.reload();
    const bioContent = await page.locator('textarea[name="bio"]').inputValue();
    
    // Script should be escaped, not executed
    expect(bioContent).not.toContain('<script>');
  });

  test('SQL Injection 방지', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Try SQL injection in login
    await page.fill('input[name="email"]', "' OR '1'='1");
    await page.fill('input[name="password"]', "' OR '1'='1");
    await page.click('button[type="submit"]');
    
    // Should not log in
    await expect(page.locator('.toast-error')).toBeVisible();
    await expect(page).toHaveURL('/auth/login');
  });

  test('CSRF 토큰 검증', async ({ page }) => {
    await loginUser(page, 'test@example.com', 'Test1234!');
    
    // Check for CSRF token in forms
    await page.goto('/profile');
    const csrfToken = await page.locator('input[name="csrf_token"]').inputValue();
    expect(csrfToken).toBeTruthy();
  });
});