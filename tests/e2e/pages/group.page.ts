import { Page } from '@playwright/test';

export class GroupPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/groups');
  }

  async searchGroup(query: string) {
    await this.page.fill('[data-testid="group-search-input"]', query);
    await this.page.press('[data-testid="group-search-input"]', 'Enter');
  }

  async selectGroupType(type: 'OFFICIAL' | 'CREATED' | 'INSTANCE' | 'LOCATION') {
    await this.page.click(`[data-testid="group-type-${type}"]`);
  }

  async joinGroup(groupId: string) {
    await this.page.click(`[data-testid="join-group-${groupId}"]`);
  }

  async createGroup(groupData: {
    name: string;
    description: string;
    type: string;
  }) {
    await this.page.click('[data-testid="create-group-button"]');
    await this.page.fill('[data-testid="group-name-input"]', groupData.name);
    await this.page.fill('[data-testid="group-description-input"]', groupData.description);
    await this.page.selectOption('[data-testid="group-type-select"]', groupData.type);
    await this.page.click('[data-testid="create-group-submit"]');
  }

  async verifyCompanyEmail(email: string) {
    await this.page.fill('[data-testid="company-email-input"]', email);
    await this.page.click('[data-testid="verify-email-button"]');
  }

  async enterEmailVerificationCode(code: string) {
    await this.page.fill('[data-testid="email-verification-code"]', code);
    await this.page.click('[data-testid="verify-email-code-button"]');
  }

  async isInGroup(groupName: string) {
    return await this.page.isVisible(`[data-testid="member-of-${groupName}"]`);
  }
}