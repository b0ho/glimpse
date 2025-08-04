import { Page } from '@playwright/test';

export class ChatPage {
  constructor(private page: Page) {}

  async goto(matchId: string) {
    await this.page.goto(`/chat/${matchId}`);
  }

  async sendMessage(message: string) {
    await this.page.fill('[data-testid="message-input"]', message);
    await this.page.press('[data-testid="message-input"]', 'Enter');
  }

  async sendImage(filePath: string) {
    await this.page.setInputFiles('[data-testid="image-upload"]', filePath);
  }

  async getMessage(messageId: string) {
    return await this.page.textContent(`[data-testid="message-${messageId}"]`);
  }

  async isTypingIndicatorVisible() {
    return await this.page.isVisible('[data-testid="typing-indicator"]');
  }

  async isReadReceiptVisible(messageId: string) {
    return await this.page.isVisible(`[data-testid="read-receipt-${messageId}"]`);
  }

  async deleteMessage(messageId: string) {
    await this.page.click(`[data-testid="message-${messageId}"]`, { button: 'right' });
    await this.page.click('[data-testid="delete-message-option"]');
    await this.page.click('[data-testid="confirm-delete"]');
  }

  async blockUser() {
    await this.page.click('[data-testid="chat-options"]');
    await this.page.click('[data-testid="block-user-option"]');
    await this.page.click('[data-testid="confirm-block"]');
  }

  async reportMessage(messageId: string, reason: string) {
    await this.page.click(`[data-testid="message-${messageId}"]`, { button: 'right' });
    await this.page.click('[data-testid="report-message-option"]');
    await this.page.selectOption('[data-testid="report-reason-select"]', reason);
    await this.page.click('[data-testid="submit-report"]');
  }
}