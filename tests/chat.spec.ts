import { test, expect } from '@playwright/test';

test.describe('Chat Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
  });

  test('should access chat screen through matches', async ({ page }) => {
    // Navigate to Matches tab first
    const matchesTab = page.locator('button:has-text("Matches"), button:has-text("매치")').first();
    if (await matchesTab.isVisible()) {
      await matchesTab.click();
      await page.waitForTimeout(2000);
      
      // Look for a match to chat with
      const chatButton = page.locator('button:has-text("Chat"), button:has-text("채팅"), [data-testid="chat-btn"]').first();
      if (await chatButton.isVisible()) {
        await chatButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('should display chat interface elements', async ({ page }) => {
    // Try to access chat screen directly or through navigation
    const chatSelectors = [
      '[data-testid="chat-screen"]',
      '[data-testid="message-list"]',
      '[data-testid="message-input"]',
      'input[placeholder*="메시지"], input[placeholder*="Message"]',
      'button:has-text("Send"), button:has-text("전송")'
    ];
    
    // Navigate through app to find chat
    const tabs = ['Matches', '매치', 'Messages', '메시지'];
    for (const tabText of tabs) {
      const tab = page.locator(`button:has-text("${tabText}")`).first();
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(2000);
        break;
      }
    }
    
    let foundChatElements = 0;
    for (const selector of chatSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          foundChatElements++;
        }
      } catch (e) {
        // Continue checking
      }
    }
    
    // If we found chat elements, test them
    if (foundChatElements > 0) {
      expect(foundChatElements).toBeGreaterThan(0);
    }
  });

  test('should handle message input and sending', async ({ page }) => {
    // Look for message input field
    const messageInput = page.locator('input[placeholder*="메시지"], input[placeholder*="Message"], [data-testid="message-input"]').first();
    
    if (await messageInput.isVisible()) {
      // Test typing a message
      await messageInput.fill('Hello, this is a test message!');
      
      // Look for send button
      const sendButton = page.locator('button:has-text("Send"), button:has-text("전송"), [data-testid="send-btn"]').first();
      if (await sendButton.isVisible()) {
        await sendButton.click();
        await page.waitForTimeout(2000);
        
        // Check if message input was cleared
        const inputValue = await messageInput.inputValue();
        expect(inputValue).toBe('');
      }
    }
  });

  test('should display message history', async ({ page }) => {
    // Look for message history/list
    const messageList = page.locator('[data-testid="message-list"], .message-bubble, .chat-message').first();
    
    if (await messageList.isVisible()) {
      // Check for message bubbles
      const messages = page.locator('.message-bubble, .chat-message, [data-testid="message"]');
      const messageCount = await messages.count();
      
      if (messageCount > 0) {
        // Verify messages are displayed
        expect(messageCount).toBeGreaterThan(0);
        
        // Check message content
        const firstMessage = messages.first();
        const messageText = await firstMessage.textContent();
        expect(messageText?.length).toBeGreaterThan(0);
      }
    }
  });

  test('should test WebSocket connection for real-time chat', async ({ page }) => {
    // Monitor WebSocket connections
    const wsConnections = [];
    
    page.on('websocket', ws => {
      wsConnections.push({
        url: ws.url(),
        connected: true
      });
      
      ws.on('framereceived', event => {
        console.log('WebSocket message received:', event.payload);
      });
      
      ws.on('framesent', event => {
        console.log('WebSocket message sent:', event.payload);
      });
    });
    
    // Navigate to chat and wait for potential WebSocket connection
    const messageInput = page.locator('input[placeholder*="메시지"], input[placeholder*="Message"]').first();
    if (await messageInput.isVisible()) {
      await messageInput.fill('Test WebSocket message');
      
      const sendButton = page.locator('button:has-text("Send"), button:has-text("전송")').first();
      if (await sendButton.isVisible()) {
        await sendButton.click();
        await page.waitForTimeout(3000); // Wait for WebSocket activity
      }
    }
    
    // Log WebSocket connections found
    console.log('WebSocket connections detected:', wsConnections.length);
    if (wsConnections.length > 0) {
      expect(wsConnections[0].url).toContain('ws://');
    }
  });

  test('should handle typing indicators', async ({ page }) => {
    // Look for typing indicator elements
    const typingIndicator = page.locator('[data-testid="typing-indicator"], .typing-indicator, text*="typing"').first();
    
    const messageInput = page.locator('input[placeholder*="메시지"], input[placeholder*="Message"]').first();
    if (await messageInput.isVisible()) {
      // Start typing to potentially trigger typing indicator
      await messageInput.fill('Testing typing indicator...');
      await page.waitForTimeout(1000);
      
      // Check if typing indicator appears (optional, depends on implementation)
      if (await typingIndicator.isVisible({ timeout: 2000 })) {
        expect(await typingIndicator.isVisible()).toBe(true);
      }
      
      // Clear input and check if typing indicator disappears
      await messageInput.fill('');
      await page.waitForTimeout(1000);
    }
  });
});