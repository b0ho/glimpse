import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';
import { ChatPage } from '../pages/chat.page';

test.describe('실시간 암호화 채팅 시스템', () => {
  let authPage: AuthPage;
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    chatPage = new ChatPage(page);
    
    // 로그인
    await authPage.goto();
    await authPage.enterPhoneNumber('01088888888');
    await authPage.clickSendCode();
    await authPage.enterVerificationCode('888888');
    await authPage.clickVerify();
  });

  test('실시간 메시지 전송 및 수신', async ({ page, context }) => {
    // User A 채팅방 입장
    await chatPage.goto('match-123');
    
    // User B 로그인 및 채팅방 입장
    const page2 = await context.newPage();
    const authPage2 = new AuthPage(page2);
    const chatPage2 = new ChatPage(page2);
    
    await authPage2.goto();
    await authPage2.enterPhoneNumber('01099999999');
    await authPage2.clickSendCode();
    await authPage2.enterVerificationCode('999999');
    await authPage2.clickVerify();
    
    await chatPage2.goto('match-123');
    
    // User A가 메시지 전송
    await chatPage.sendMessage('안녕하세요!');
    
    // User B가 메시지 수신 확인
    await expect(page2.locator('[data-testid="message-1"]')).toContainText('안녕하세요!');
    
    // User B가 답장
    await chatPage2.sendMessage('반갑습니다!');
    
    // User A가 답장 수신 확인
    await expect(page.locator('[data-testid="message-2"]')).toContainText('반갑습니다!');
  });

  test('타이핑 인디케이터', async ({ page, context }) => {
    await chatPage.goto('match-456');
    
    // User B 설정
    const page2 = await context.newPage();
    const chatPage2 = new ChatPage(page2);
    await page2.goto('/chat/match-456');
    
    // User A가 타이핑 시작
    await page.fill('[data-testid="message-input"]', '타이핑 중...');
    
    // User B에서 타이핑 인디케이터 확인
    await expect(chatPage2.isTypingIndicatorVisible()).resolves.toBe(true);
    
    // 메시지 전송 후 인디케이터 사라짐
    await page.press('[data-testid="message-input"]', 'Enter');
    await expect(chatPage2.isTypingIndicatorVisible()).resolves.toBe(false);
  });

  test('이미지 전송', async ({ page }) => {
    await chatPage.goto('match-789');
    
    // 이미지 파일 업로드
    await chatPage.sendImage('./test-assets/test-image.jpg');
    
    // 이미지 전송 확인
    await expect(page.locator('[data-testid="image-message-1"]')).toBeVisible();
    
    // 이미지 썸네일 표시 확인
    await expect(page.locator('[data-testid="image-thumbnail-1"]')).toHaveAttribute('src', /.*\.jpg/);
  });

  test('메시지 삭제 (5분 이내)', async ({ page }) => {
    await chatPage.goto('match-111');
    
    // 메시지 전송
    await chatPage.sendMessage('삭제할 메시지');
    
    // 메시지 삭제
    await chatPage.deleteMessage('message-1');
    
    // 삭제 확인
    await expect(page.locator('[data-testid="message-1"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="message-deleted-1"]')).toBeVisible();
  });

  test('읽음 표시 (프리미엄 기능)', async ({ page, context }) => {
    // 프리미엄 사용자로 로그인
    await page.goto('/');
    await authPage.enterPhoneNumber('01011112222'); // 프리미엄 사용자
    await authPage.clickSendCode();
    await authPage.enterVerificationCode('111222');
    await authPage.clickVerify();
    
    await chatPage.goto('match-222');
    
    // 메시지 전송
    await chatPage.sendMessage('읽음 표시 테스트');
    
    // 상대방이 메시지 읽음
    const page2 = await context.newPage();
    await page2.goto('/chat/match-222');
    await page2.waitForSelector('[data-testid="message-1"]');
    
    // 읽음 표시 확인
    await expect(chatPage.isReadReceiptVisible('message-1')).resolves.toBe(true);
  });

  test('부적절한 콘텐츠 필터링', async ({ page }) => {
    await chatPage.goto('match-333');
    
    // 부적절한 메시지 전송 시도
    await chatPage.sendMessage('욕설이 포함된 메시지 ****');
    
    // 필터링된 메시지 확인
    await expect(page.locator('[data-testid="message-1"]')).toContainText('****');
  });

  test('메시지 신고 및 차단', async ({ page }) => {
    await chatPage.goto('match-444');
    
    // 상대방 메시지가 있다고 가정
    await page.evaluate(() => {
      // 테스트용 메시지 추가
      const messageEl = document.createElement('div');
      messageEl.setAttribute('data-testid', 'message-spam');
      messageEl.textContent = '스팸 메시지';
      document.body.appendChild(messageEl);
    });
    
    // 메시지 신고
    await chatPage.reportMessage('message-spam', 'SPAM');
    
    // 신고 완료 메시지
    await expect(page.locator('[data-testid="report-submitted"]')).toBeVisible();
    
    // 사용자 차단
    await chatPage.blockUser();
    
    // 차단 확인
    await expect(page.locator('[data-testid="user-blocked-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="message-input"]')).toBeDisabled();
  });

  test('오프라인 메시지 큐잉', async ({ page, context }) => {
    await chatPage.goto('match-555');
    
    // 오프라인 모드 시뮬레이션
    await context.setOffline(true);
    
    // 메시지 전송 시도
    await chatPage.sendMessage('오프라인 메시지');
    
    // 전송 대기 상태 확인
    await expect(page.locator('[data-testid="message-pending-1"]')).toBeVisible();
    
    // 온라인 복귀
    await context.setOffline(false);
    
    // 메시지 전송 완료 확인
    await expect(page.locator('[data-testid="message-sent-1"]')).toBeVisible();
  });
});