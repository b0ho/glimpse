import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:8082';
const API_URL = 'http://localhost:3001/api/v1';

// 테스트용 사용자 정보
const TEST_USER = {
  phone: '01012345678',
  verificationCode: '123456',
  nickname: 'TestUser' + Date.now(),
};

// 테스트용 관리자 정보
const ADMIN_USER = {
  email: 'admin@glimpse.app',
  password: 'admin123!',
};

test.describe('Mobile App API Integration Tests', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto(BASE_URL);
    
    // 개발자 모드 활성화를 위한 설정
    await page.evaluate(() => {
      localStorage.setItem('devMode', 'true');
      localStorage.setItem('x-dev-auth', 'true');
    });
  });

  test.afterEach(async () => {
    // 테스트 후 정리
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe('Authentication Flow', () => {
    test('should complete phone verification and login', async () => {
      await page.goto(`${BASE_URL}/auth/login`);
      
      // 전화번호 입력
      await page.fill('input[placeholder*="전화번호"]', TEST_USER.phone);
      await page.click('button:has-text("인증번호 전송")');
      
      // API 호출 확인
      const verificationRequest = page.waitForRequest(
        request => request.url().includes('/auth/send-verification') && 
                   request.method() === 'POST'
      );
      
      // 인증번호 입력
      await page.fill('input[placeholder*="인증번호"]', TEST_USER.verificationCode);
      await page.click('button:has-text("확인")');
      
      // 로그인 성공 확인
      await expect(page).toHaveURL(/\/home/, { timeout: 10000 });
      
      // 토큰 저장 확인
      const token = await page.evaluate(() => localStorage.getItem('userToken'));
      expect(token).toBeTruthy();
    });

    test('should handle logout correctly', async () => {
      // 먼저 로그인
      await loginTestUser(page);
      
      // 로그아웃
      await page.goto(`${BASE_URL}/profile`);
      await page.click('button:has-text("로그아웃")');
      
      // 로그인 페이지로 리다이렉트 확인
      await expect(page).toHaveURL(/\/auth\/login/);
      
      // 토큰 삭제 확인
      const token = await page.evaluate(() => localStorage.getItem('userToken'));
      expect(token).toBeFalsy();
    });
  });

  test.describe('Home Screen API Integration', () => {
    test.beforeEach(async () => {
      await loginTestUser(page);
    });

    test('should load real groups from API', async () => {
      await page.goto(`${BASE_URL}/home`);
      
      // API 호출 대기
      const groupsResponse = await page.waitForResponse(
        response => response.url().includes('/groups') && response.status() === 200
      );
      
      const groups = await groupsResponse.json();
      expect(groups).toBeDefined();
      expect(Array.isArray(groups.items || groups)).toBeTruthy();
      
      // UI에 그룹이 표시되는지 확인
      await page.waitForSelector('[data-testid="group-card"]', { timeout: 5000 });
      const groupCards = await page.$$('[data-testid="group-card"]');
      expect(groupCards.length).toBeGreaterThan(0);
    });

    test('should load real stories from API', async () => {
      await page.goto(`${BASE_URL}/home`);
      
      // Stories API 호출 대기
      const storiesResponse = await page.waitForResponse(
        response => response.url().includes('/stories') && response.status() === 200,
        { timeout: 10000 }
      );
      
      const stories = await storiesResponse.json();
      expect(stories).toBeDefined();
      
      // UI에 스토리가 표시되는지 확인
      const storyElements = await page.$$('[data-testid="story-item"]');
      expect(storyElements.length).toBeGreaterThan(0);
    });

    test('should load real feed content from API', async () => {
      await page.goto(`${BASE_URL}/home`);
      
      // Feed API 호출 대기
      const feedResponse = await page.waitForResponse(
        response => response.url().includes('/feed') && response.status() === 200,
        { timeout: 10000 }
      );
      
      const feed = await feedResponse.json();
      expect(feed).toBeDefined();
      
      // UI에 피드가 표시되는지 확인
      const feedItems = await page.$$('[data-testid="feed-item"]');
      expect(feedItems.length).toBeGreaterThan(0);
    });
  });

  test.describe('Groups Screen API Integration', () => {
    test.beforeEach(async () => {
      await loginTestUser(page);
    });

    test('should display all group types from API', async () => {
      await page.goto(`${BASE_URL}/groups`);
      
      // 각 그룹 타입별 API 호출 확인
      const groupTypes = ['OFFICIAL', 'CREATED', 'INSTANCE', 'LOCATION'];
      
      for (const type of groupTypes) {
        // 탭 클릭
        await page.click(`[data-testid="tab-${type}"]`);
        
        // API 호출 대기
        const response = await page.waitForResponse(
          response => response.url().includes(`/groups?type=${type}`) && 
                     response.status() === 200
        );
        
        const groups = await response.json();
        expect(groups).toBeDefined();
        
        // UI 확인
        if (groups.items && groups.items.length > 0) {
          await page.waitForSelector(`[data-testid="group-${type}"]`);
        }
      }
    });

    test('should join and leave group via API', async () => {
      await page.goto(`${BASE_URL}/groups`);
      
      // 그룹 선택
      const firstGroup = await page.$('[data-testid="group-card"]:first-child');
      await firstGroup?.click();
      
      // 그룹 가입
      await page.click('button:has-text("그룹 가입")');
      
      // API 호출 확인
      const joinResponse = await page.waitForResponse(
        response => response.url().includes('/groups/join') && 
                   response.method() === 'POST'
      );
      expect(joinResponse.status()).toBe(200);
      
      // UI 업데이트 확인
      await expect(page.locator('button:has-text("그룹 나가기")')).toBeVisible();
      
      // 그룹 나가기
      await page.click('button:has-text("그룹 나가기")');
      const leaveResponse = await page.waitForResponse(
        response => response.url().includes('/groups/leave') && 
                   response.method() === 'POST'
      );
      expect(leaveResponse.status()).toBe(200);
    });
  });

  test.describe('Matching & Like System API Integration', () => {
    test.beforeEach(async () => {
      await loginTestUser(page);
    });

    test('should send like via API', async () => {
      await page.goto(`${BASE_URL}/groups`);
      
      // 그룹 멤버 목록으로 이동
      await page.click('[data-testid="group-card"]:first-child');
      await page.click('button:has-text("멤버 보기")');
      
      // 좋아요 보내기
      const likeButton = await page.$('[data-testid="like-button"]:first-child');
      await likeButton?.click();
      
      // API 호출 확인
      const likeResponse = await page.waitForResponse(
        response => response.url().includes('/likes') && 
                   response.method() === 'POST'
      );
      expect(likeResponse.status()).toBe(200);
      
      // UI 피드백 확인
      await expect(page.locator('text="좋아요를 보냈습니다"')).toBeVisible();
    });

    test('should check matches via API', async () => {
      await page.goto(`${BASE_URL}/matches`);
      
      // Matches API 호출 대기
      const matchesResponse = await page.waitForResponse(
        response => response.url().includes('/matches') && response.status() === 200
      );
      
      const matches = await matchesResponse.json();
      expect(matches).toBeDefined();
      
      // 매치가 있다면 UI 확인
      if (matches.items && matches.items.length > 0) {
        await page.waitForSelector('[data-testid="match-card"]');
        const matchCards = await page.$$('[data-testid="match-card"]');
        expect(matchCards.length).toBe(matches.items.length);
      }
    });
  });

  test.describe('Chat System API Integration', () => {
    test.beforeEach(async () => {
      await loginTestUser(page);
    });

    test('should load chat list from API', async () => {
      await page.goto(`${BASE_URL}/chats`);
      
      // Chats API 호출 대기
      const chatsResponse = await page.waitForResponse(
        response => response.url().includes('/chats') && response.status() === 200
      );
      
      const chats = await chatsResponse.json();
      expect(chats).toBeDefined();
      
      // UI 확인
      if (chats.items && chats.items.length > 0) {
        await page.waitForSelector('[data-testid="chat-item"]');
      }
    });

    test('should send and receive messages via WebSocket', async () => {
      // 먼저 매치가 있는지 확인
      await page.goto(`${BASE_URL}/matches`);
      const matchCard = await page.$('[data-testid="match-card"]:first-child');
      
      if (matchCard) {
        // 채팅 시작
        await matchCard.click();
        await page.click('button:has-text("채팅 시작")');
        
        // 채팅 화면으로 이동 확인
        await expect(page).toHaveURL(/\/chat\//);
        
        // WebSocket 연결 확인
        await page.waitForFunction(() => {
          return window.socket && window.socket.connected;
        }, { timeout: 5000 });
        
        // 메시지 전송
        const messageInput = await page.$('input[placeholder*="메시지"]');
        await messageInput?.fill('테스트 메시지');
        await page.click('button[data-testid="send-message"]');
        
        // 메시지 전송 확인
        await expect(page.locator('text="테스트 메시지"')).toBeVisible();
      }
    });
  });

  test.describe('Profile Management API Integration', () => {
    test.beforeEach(async () => {
      await loginTestUser(page);
    });

    test('should load profile from API', async () => {
      await page.goto(`${BASE_URL}/profile`);
      
      // Profile API 호출 대기
      const profileResponse = await page.waitForResponse(
        response => response.url().includes('/users/me') && response.status() === 200
      );
      
      const profile = await profileResponse.json();
      expect(profile).toBeDefined();
      expect(profile.phoneNumber).toBeTruthy();
      
      // UI에 프로필 정보 표시 확인
      await expect(page.locator(`text="${profile.nickname || profile.phoneNumber}"`)).toBeVisible();
    });

    test('should update profile via API', async () => {
      await page.goto(`${BASE_URL}/profile/edit`);
      
      // 프로필 수정
      const nicknameInput = await page.$('input[placeholder*="닉네임"]');
      await nicknameInput?.fill('UpdatedNickname' + Date.now());
      
      const bioInput = await page.$('textarea[placeholder*="소개"]');
      await bioInput?.fill('Updated bio text');
      
      // 저장
      await page.click('button:has-text("저장")');
      
      // API 호출 확인
      const updateResponse = await page.waitForResponse(
        response => response.url().includes('/users/me') && 
                   response.method() === 'PUT'
      );
      expect(updateResponse.status()).toBe(200);
      
      // 성공 메시지 확인
      await expect(page.locator('text="프로필이 업데이트되었습니다"')).toBeVisible();
    });
  });

  test.describe('Premium & Payment API Integration', () => {
    test.beforeEach(async () => {
      await loginTestUser(page);
    });

    test('should load premium plans from API', async () => {
      await page.goto(`${BASE_URL}/premium`);
      
      // Premium plans API 호출 대기
      const plansResponse = await page.waitForResponse(
        response => response.url().includes('/premium/plans') && response.status() === 200
      );
      
      const plans = await plansResponse.json();
      expect(plans).toBeDefined();
      expect(Array.isArray(plans)).toBeTruthy();
      
      // UI에 플랜 표시 확인
      for (const plan of plans) {
        await expect(page.locator(`text="${plan.name}"`)).toBeVisible();
        await expect(page.locator(`text="₩${plan.price.toLocaleString()}"`)).toBeVisible();
      }
    });

    test('should initiate payment via API', async () => {
      await page.goto(`${BASE_URL}/premium`);
      
      // 플랜 선택
      await page.click('[data-testid="premium-plan-monthly"]');
      await page.click('button:has-text("구독하기")');
      
      // Payment API 호출 확인
      const paymentResponse = await page.waitForResponse(
        response => response.url().includes('/payments/initiate') && 
                   response.method() === 'POST'
      );
      expect(paymentResponse.status()).toBe(200);
      
      const paymentData = await paymentResponse.json();
      expect(paymentData.paymentId).toBeTruthy();
    });
  });

  test.describe('Notification System API Integration', () => {
    test.beforeEach(async () => {
      await loginTestUser(page);
    });

    test('should load notifications from API', async () => {
      await page.goto(`${BASE_URL}/notifications`);
      
      // Notifications API 호출 대기
      const notificationsResponse = await page.waitForResponse(
        response => response.url().includes('/notifications') && response.status() === 200
      );
      
      const notifications = await notificationsResponse.json();
      expect(notifications).toBeDefined();
      
      // UI 확인
      if (notifications.items && notifications.items.length > 0) {
        await page.waitForSelector('[data-testid="notification-item"]');
      }
    });

    test('should mark notification as read via API', async () => {
      await page.goto(`${BASE_URL}/notifications`);
      
      const notificationItem = await page.$('[data-testid="notification-item"]:first-child');
      if (notificationItem) {
        await notificationItem.click();
        
        // Mark as read API 호출 확인
        const markReadResponse = await page.waitForResponse(
          response => response.url().includes('/notifications/read') && 
                     response.method() === 'PUT'
        );
        expect(markReadResponse.status()).toBe(200);
        
        // UI 업데이트 확인
        await expect(notificationItem).toHaveClass(/read/);
      }
    });
  });

  test.describe('Data Persistence & Storage', () => {
    test('should only store essential data in localStorage', async () => {
      await loginTestUser(page);
      
      // localStorage 내용 확인
      const storageData = await page.evaluate(() => {
        const data: Record<string, any> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            data[key] = localStorage.getItem(key);
          }
        }
        return data;
      });
      
      // 필수 데이터만 저장되었는지 확인
      const essentialKeys = ['userToken', 'userId', 'deviceId', 'language', 'theme'];
      const storedKeys = Object.keys(storageData);
      
      // 불필요한 데이터가 저장되지 않았는지 확인
      const unnecessaryKeys = storedKeys.filter(key => 
        !essentialKeys.includes(key) && 
        !key.startsWith('dev') // 개발 모드 키 제외
      );
      
      expect(unnecessaryKeys.length).toBe(0);
    });

    test('should not store sensitive data in localStorage', async () => {
      await loginTestUser(page);
      
      // 민감한 데이터가 저장되지 않았는지 확인
      const storageData = await page.evaluate(() => {
        const data: Record<string, any> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            data[key] = localStorage.getItem(key);
          }
        }
        return data;
      });
      
      // 민감한 데이터 키워드 검사
      const sensitiveKeywords = ['password', 'credit', 'card', 'cvv', 'ssn'];
      const hasSensitiveData = Object.entries(storageData).some(([key, value]) => {
        const keyLower = key.toLowerCase();
        const valueLower = String(value).toLowerCase();
        return sensitiveKeywords.some(keyword => 
          keyLower.includes(keyword) || valueLower.includes(keyword)
        );
      });
      
      expect(hasSensitiveData).toBe(false);
    });
  });

  test.describe('Error Handling & Offline Mode', () => {
    test('should handle API errors gracefully', async () => {
      await loginTestUser(page);
      
      // 네트워크 오프라인 설정
      await page.context().setOffline(true);
      
      // API 호출 시도
      await page.goto(`${BASE_URL}/home`);
      
      // 오류 메시지 표시 확인
      await expect(page.locator('text="네트워크 연결을 확인해주세요"')).toBeVisible({ timeout: 5000 });
      
      // 네트워크 복구
      await page.context().setOffline(false);
      
      // 재시도 버튼 클릭
      await page.click('button:has-text("다시 시도")');
      
      // 데이터 로드 확인
      await page.waitForSelector('[data-testid="group-card"]', { timeout: 10000 });
    });

    test('should handle 401 unauthorized errors', async () => {
      // 잘못된 토큰 설정
      await page.evaluate(() => {
        localStorage.setItem('userToken', 'invalid-token');
      });
      
      await page.goto(`${BASE_URL}/home`);
      
      // 로그인 페이지로 리다이렉트 확인
      await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
    });
  });
});

// Helper Functions
async function loginTestUser(page: Page) {
  await page.evaluate((token) => {
    localStorage.setItem('userToken', token);
    localStorage.setItem('userId', 'test-user-id');
    localStorage.setItem('x-dev-auth', 'true');
  }, 'test-jwt-token');
  
  // 개발 모드에서 자동 로그인
  await page.goto(`${BASE_URL}/home`);
  await page.waitForSelector('[data-testid="home-screen"]', { timeout: 5000 });
}

async function createTestMatch(page: Page) {
  // 테스트용 매치 생성 로직
  await page.goto(`${BASE_URL}/groups`);
  // ... 매치 생성 로직
}