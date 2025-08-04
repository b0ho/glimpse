import { Page } from '@playwright/test';

export class AuthPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  async enterPhoneNumber(phoneNumber: string) {
    await this.page.fill('[data-testid="phone-input"]', phoneNumber);
  }

  async clickSendCode() {
    await this.page.click('[data-testid="send-code-button"]');
  }

  async enterVerificationCode(code: string) {
    await this.page.fill('[data-testid="verification-code-input"]', code);
  }

  async clickVerify() {
    await this.page.click('[data-testid="verify-button"]');
  }

  async enterNickname(nickname: string) {
    await this.page.fill('[data-testid="nickname-input"]', nickname);
  }

  async selectAge(age: string) {
    await this.page.selectOption('[data-testid="age-select"]', age);
  }

  async selectGender(gender: string) {
    await this.page.click(`[data-testid="gender-${gender}"]`);
  }

  async clickComplete() {
    await this.page.click('[data-testid="complete-signup-button"]');
  }

  async isLoggedIn() {
    return await this.page.isVisible('[data-testid="user-profile"]');
  }
}