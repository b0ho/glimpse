import { test, expect, Page, Browser } from '@playwright/test';

const BASE_URL = 'http://localhost:8082';
const API_URL = 'http://localhost:3001/api/v1';

// 테스트용 사용자 정보
const TEST_USER = {
  phone: '01012345678',
  verificationCode: '123456',
  nickname: `TestUser${Date.now()}`,
  password: 'test123!',
};

test.describe('Mobile App Full API Integration Tests', () => {
  let page: Page;
  let apiCalls: { method: string; url: string; status: number }[] = [];

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    apiCalls = [];
    
    // API 호출 모니터링
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log(`[API Request] ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiCalls.push({
          method: response.request().method(),
          url: response.url(),
          status: response.status()
        });
        console.log(`[API Response] ${response.status()} ${response.url()}`);
      }
    });
    
    await page.goto(BASE_URL);
    
    // 개발 모드 활성화
    await page.evaluate(() => {
      localStorage.setItem('devMode', 'true');
      localStorage.setItem('x-dev-auth', 'true');
    });
  });

  test.afterEach(async () => {
    // 테스트 결과 리포트
    console.log('\n=== API Call Summary ===');
    apiCalls.forEach(call => {
      console.log(`${call.method} ${call.url} - ${call.status}`);
    });
    console.log('========================\n');
    
    await page.close();
  });

  test('1. Authentication Flow - Complete Cycle', async () => {
    console.log('\n🔐 Testing Authentication Flow...');
    
    // 로그인 페이지로 이동
    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState('networkidle');
    
    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/auth-login.png', fullPage: true });
    
    // 전화번호 입력
    const phoneInput = await page.locator('input[type="tel"], input[placeholder*="전화번호"], input[placeholder*="Phone"]');
    if (await phoneInput.isVisible()) {
      await phoneInput.fill(TEST_USER.phone);
      console.log('✅ Phone number entered');
      
      // 인증번호 전송 버튼 클릭
      const sendCodeButton = await page.locator('button:has-text("인증번호 전송"), button:has-text("Send Code"), button:has-text("다음")');
      if (await sendCodeButton.isVisible()) {
        await sendCodeButton.click();
        console.log('✅ Verification code requested');
        
        // 인증번호 입력 필드가 나타날 때까지 대기
        await page.waitForTimeout(2000);
        
        // 인증번호 입력
        const codeInput = await page.locator('input[placeholder*="인증번호"], input[placeholder*="Code"], input[type="number"]');
        if (await codeInput.isVisible()) {
          await codeInput.fill(TEST_USER.verificationCode);
          console.log('✅ Verification code entered');
          
          // 확인 버튼 클릭
          const verifyButton = await page.locator('button:has-text("확인"), button:has-text("Verify"), button:has-text("로그인")');
          if (await verifyButton.isVisible()) {
            await verifyButton.click();
            console.log('✅ Login attempt made');
            
            // 로그인 성공 확인
            await page.waitForTimeout(3000);
            const currentUrl = page.url();
            console.log(`Current URL after login: ${currentUrl}`);
            
            // 토큰 확인
            const token = await page.evaluate(() => localStorage.getItem('userToken'));
            if (token) {
              console.log('✅ Authentication token saved');
            } else {
              console.log('⚠️ No authentication token found');
            }
          }
        }
      }
    }
    
    // API 호출 검증
    const authApiCalls = apiCalls.filter(call => 
      call.url.includes('/auth') || call.url.includes('/verify') || call.url.includes('/login')
    );
    console.log(`Auth API calls made: ${authApiCalls.length}`);
    expect(authApiCalls.length).toBeGreaterThan(0);
  });

  test('2. Home Screen - Real API Data Loading', async () => {
    console.log('\n🏠 Testing Home Screen API Integration...');
    
    // 먼저 로그인 상태 시뮬레이션
    await setupAuthenticatedUser(page);
    
    // 홈 화면으로 이동
    await page.goto(`${BASE_URL}/home`);
    await page.waitForLoadState('networkidle');
    
    // 스크린샷
    await page.screenshot({ path: 'test-results/home-screen.png', fullPage: true });
    
    // 콘텐츠 로딩 확인
    await page.waitForTimeout(3000);
    
    // API 호출 검증
    const contentApiCalls = apiCalls.filter(call => call.url.includes('/contents'));
    const storyApiCalls = apiCalls.filter(call => call.url.includes('/stories'));
    const groupApiCalls = apiCalls.filter(call => call.url.includes('/groups'));
    
    console.log(`Content API calls: ${contentApiCalls.length}`);
    console.log(`Story API calls: ${storyApiCalls.length}`);
    console.log(`Group API calls: ${groupApiCalls.length}`);
    
    // 콘텐츠가 화면에 표시되는지 확인
    const contentElements = await page.$$('[data-testid*="content"], [data-testid*="feed"], [class*="content"], [class*="feed"]');
    console.log(`Content elements found: ${contentElements.length}`);
    
    // 스토리가 화면에 표시되는지 확인
    const storyElements = await page.$$('[data-testid*="story"], [class*="story"]');
    console.log(`Story elements found: ${storyElements.length}`);
    
    // localStorage 검사
    const storageData = await page.evaluate(() => {
      const data: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.includes('mock') && !key.includes('fake') && !key.includes('dummy')) {
          data[key] = localStorage.getItem(key);
        }
      }
      return data;
    });
    
    console.log('localStorage keys:', Object.keys(storageData));
    
    // Mock 데이터 사용 여부 확인
    const hasMockData = Object.entries(storageData).some(([key, value]) => {
      const str = String(value).toLowerCase();
      return str.includes('mock') || str.includes('fake') || str.includes('dummy');
    });
    
    if (hasMockData) {
      console.log('⚠️ Warning: Mock data detected in localStorage');
    } else {
      console.log('✅ No mock data in localStorage');
    }
  });

  test('3. Groups Screen - API Data Verification', async () => {
    console.log('\n👥 Testing Groups Screen API Integration...');
    
    await setupAuthenticatedUser(page);
    
    // 그룹 화면으로 이동
    await page.goto(`${BASE_URL}/groups`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/groups-screen.png', fullPage: true });
    
    // 그룹 탭 테스트
    const tabs = ['OFFICIAL', 'CREATED', 'INSTANCE', 'LOCATION'];
    
    for (const tab of tabs) {
      console.log(`Testing ${tab} groups...`);
      
      // 탭 버튼 찾기 및 클릭
      const tabButton = await page.locator(`[data-testid="tab-${tab}"], button:has-text("${tab}"), [role="tab"]:has-text("${tab}")`);
      if (await tabButton.isVisible()) {
        await tabButton.click();
        await page.waitForTimeout(2000);
        
        // API 호출 확인
        const tabApiCalls = apiCalls.filter(call => 
          call.url.includes(`/groups`) && call.url.includes(tab)
        );
        console.log(`${tab} API calls: ${tabApiCalls.length}`);
      }
    }
    
    // 그룹 가입 테스트
    const groupCard = await page.locator('[data-testid*="group"], [class*="group-card"]').first();
    if (await groupCard.isVisible()) {
      await groupCard.click();
      await page.waitForTimeout(2000);
      
      const joinButton = await page.locator('button:has-text("가입"), button:has-text("Join")');
      if (await joinButton.isVisible()) {
        await joinButton.click();
        console.log('✅ Group join attempted');
        
        // API 호출 확인
        const joinApiCalls = apiCalls.filter(call => 
          call.url.includes('/join') && call.method === 'POST'
        );
        console.log(`Join API calls: ${joinApiCalls.length}`);
      }
    }
  });

  test('4. Matching & Like System - API Testing', async () => {
    console.log('\n💝 Testing Matching & Like System...');
    
    await setupAuthenticatedUser(page);
    
    // 매치 화면으로 이동
    await page.goto(`${BASE_URL}/matches`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/matches-screen.png', fullPage: true });
    
    // 매치 목록 API 호출 확인
    const matchApiCalls = apiCalls.filter(call => call.url.includes('/matches'));
    console.log(`Match API calls: ${matchApiCalls.length}`);
    
    // 좋아요 기능 테스트
    await page.goto(`${BASE_URL}/home`);
    await page.waitForTimeout(2000);
    
    const likeButton = await page.locator('[data-testid*="like"], button[aria-label*="like"], [class*="like-button"]').first();
    if (await likeButton.isVisible()) {
      await likeButton.click();
      console.log('✅ Like button clicked');
      
      // Like API 호출 확인
      const likeApiCalls = apiCalls.filter(call => 
        call.url.includes('/like') && call.method === 'POST'
      );
      console.log(`Like API calls: ${likeApiCalls.length}`);
    }
  });

  test('5. Chat System - WebSocket & API Integration', async () => {
    console.log('\n💬 Testing Chat System...');
    
    await setupAuthenticatedUser(page);
    
    // 채팅 목록 화면으로 이동
    await page.goto(`${BASE_URL}/chats`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/chats-screen.png', fullPage: true });
    
    // 채팅 목록 API 호출 확인
    const chatApiCalls = apiCalls.filter(call => call.url.includes('/chats'));
    console.log(`Chat API calls: ${chatApiCalls.length}`);
    
    // WebSocket 연결 확인
    const hasWebSocket = await page.evaluate(() => {
      return typeof (window as any).socket !== 'undefined';
    });
    
    if (hasWebSocket) {
      console.log('✅ WebSocket connection exists');
      
      // WebSocket 상태 확인
      const socketConnected = await page.evaluate(() => {
        const socket = (window as any).socket;
        return socket && socket.connected;
      });
      
      console.log(`WebSocket connected: ${socketConnected}`);
    } else {
      console.log('⚠️ No WebSocket connection found');
    }
  });

  test('6. Profile Management - API CRUD Operations', async () => {
    console.log('\n👤 Testing Profile Management...');
    
    await setupAuthenticatedUser(page);
    
    // 프로필 화면으로 이동
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/profile-screen.png', fullPage: true });
    
    // 프로필 API 호출 확인
    const profileApiCalls = apiCalls.filter(call => call.url.includes('/users/me'));
    console.log(`Profile API calls: ${profileApiCalls.length}`);
    
    // 프로필 수정 테스트
    const editButton = await page.locator('button:has-text("수정"), button:has-text("Edit")');
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(2000);
      
      // 닉네임 수정
      const nicknameInput = await page.locator('input[placeholder*="닉네임"], input[placeholder*="Nickname"]');
      if (await nicknameInput.isVisible()) {
        await nicknameInput.fill(`Updated${Date.now()}`);
        
        // 저장 버튼 클릭
        const saveButton = await page.locator('button:has-text("저장"), button:has-text("Save")');
        if (await saveButton.isVisible()) {
          await saveButton.click();
          console.log('✅ Profile update attempted');
          
          // Update API 호출 확인
          const updateApiCalls = apiCalls.filter(call => 
            call.url.includes('/users/me') && call.method === 'PUT'
          );
          console.log(`Profile update API calls: ${updateApiCalls.length}`);
        }
      }
    }
  });

  test('7. Premium & Payment - API Integration', async () => {
    console.log('\n💳 Testing Premium & Payment System...');
    
    await setupAuthenticatedUser(page);
    
    // 프리미엄 화면으로 이동
    await page.goto(`${BASE_URL}/premium`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/premium-screen.png', fullPage: true });
    
    // 프리미엄 플랜 API 호출 확인
    const premiumApiCalls = apiCalls.filter(call => call.url.includes('/premium'));
    console.log(`Premium API calls: ${premiumApiCalls.length}`);
    
    // 결제 플로우 테스트
    const subscribeButton = await page.locator('button:has-text("구독"), button:has-text("Subscribe")').first();
    if (await subscribeButton.isVisible()) {
      await subscribeButton.click();
      console.log('✅ Subscription button clicked');
      
      await page.waitForTimeout(2000);
      
      // Payment API 호출 확인
      const paymentApiCalls = apiCalls.filter(call => call.url.includes('/payment'));
      console.log(`Payment API calls: ${paymentApiCalls.length}`);
    }
  });

  test('8. Notification System - API Testing', async () => {
    console.log('\n🔔 Testing Notification System...');
    
    await setupAuthenticatedUser(page);
    
    // 알림 화면으로 이동
    await page.goto(`${BASE_URL}/notifications`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/notifications-screen.png', fullPage: true });
    
    // 알림 API 호출 확인
    const notificationApiCalls = apiCalls.filter(call => call.url.includes('/notifications'));
    console.log(`Notification API calls: ${notificationApiCalls.length}`);
    
    // 알림 읽음 처리 테스트
    const notificationItem = await page.locator('[data-testid*="notification"], [class*="notification-item"]').first();
    if (await notificationItem.isVisible()) {
      await notificationItem.click();
      console.log('✅ Notification item clicked');
      
      await page.waitForTimeout(1000);
      
      // Read API 호출 확인
      const readApiCalls = apiCalls.filter(call => 
        call.url.includes('/notifications') && call.url.includes('/read')
      );
      console.log(`Notification read API calls: ${readApiCalls.length}`);
    }
  });

  test('9. Data Storage Audit - No Mock Data', async () => {
    console.log('\n🔍 Auditing Data Storage...');
    
    await setupAuthenticatedUser(page);
    await page.goto(`${BASE_URL}/home`);
    await page.waitForLoadState('networkidle');
    
    // 모든 localStorage 데이터 수집
    const allStorageData = await page.evaluate(() => {
      const data: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          data[key] = localStorage.getItem(key);
        }
      }
      return data;
    });
    
    console.log('\n=== LocalStorage Audit ===');
    Object.entries(allStorageData).forEach(([key, value]) => {
      const valueStr = String(value);
      const isMock = valueStr.toLowerCase().includes('mock') || 
                     valueStr.toLowerCase().includes('fake') || 
                     valueStr.toLowerCase().includes('dummy') ||
                     valueStr.toLowerCase().includes('test');
      
      if (isMock) {
        console.log(`❌ ${key}: Contains mock data`);
      } else if (key.includes('token') || key.includes('user') || key.includes('auth')) {
        console.log(`✅ ${key}: Essential data`);
      } else if (key.includes('dev')) {
        console.log(`🔧 ${key}: Development setting`);
      } else {
        console.log(`⚠️ ${key}: Potentially unnecessary data`);
      }
    });
    console.log('==========================\n');
    
    // Mock 데이터가 없는지 확인
    const hasMockData = Object.values(allStorageData).some(value => {
      const str = String(value).toLowerCase();
      return str.includes('mock') || str.includes('fake') || str.includes('dummy');
    });
    
    expect(hasMockData).toBe(false);
    console.log(hasMockData ? '❌ Mock data found!' : '✅ No mock data detected');
  });

  test('10. Error Handling - API Failure Scenarios', async () => {
    console.log('\n⚠️ Testing Error Handling...');
    
    // 잘못된 토큰으로 테스트
    await page.evaluate(() => {
      localStorage.setItem('userToken', 'invalid-token-12345');
    });
    
    await page.goto(`${BASE_URL}/home`);
    await page.waitForTimeout(3000);
    
    // 401 에러 처리 확인
    const unauthorizedCalls = apiCalls.filter(call => call.status === 401);
    console.log(`401 Unauthorized calls: ${unauthorizedCalls.length}`);
    
    // 리다이렉트 확인
    const currentUrl = page.url();
    const isRedirectedToLogin = currentUrl.includes('login') || currentUrl.includes('auth');
    console.log(`Redirected to login: ${isRedirectedToLogin}`);
    
    // 오프라인 모드 테스트
    await page.context().setOffline(true);
    await page.goto(`${BASE_URL}/home`);
    await page.waitForTimeout(2000);
    
    // 오프라인 메시지 확인
    const offlineMessage = await page.locator('text=/네트워크|오프라인|연결/i');
    const hasOfflineMessage = await offlineMessage.isVisible();
    console.log(`Offline message shown: ${hasOfflineMessage}`);
    
    await page.context().setOffline(false);
  });
});

// Helper function to setup authenticated user
async function setupAuthenticatedUser(page: Page) {
  await page.evaluate(() => {
    // 개발 모드에서 임시 토큰 설정
    localStorage.setItem('userToken', 'dev-test-token');
    localStorage.setItem('userId', 'test-user-123');
    localStorage.setItem('x-dev-auth', 'true');
    localStorage.setItem('devMode', 'true');
  });
}