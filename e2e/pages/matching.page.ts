import { Page } from '@playwright/test';

export class MatchingPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/matching');
  }

  async viewUserProfile(userId: string) {
    await this.page.click(`[data-testid="user-card-${userId}"]`);
  }

  async sendLike(userId: string) {
    await this.page.click(`[data-testid="like-button-${userId}"]`);
  }

  async passUser(userId: string) {
    await this.page.click(`[data-testid="pass-button-${userId}"]`);
  }

  async swipeRight() {
    const card = await this.page.locator('[data-testid="user-card"]').first();
    await card.dragTo(this.page.locator('[data-testid="swipe-container"]'), {
      targetPosition: { x: 300, y: 0 }
    });
  }

  async swipeLeft() {
    const card = await this.page.locator('[data-testid="user-card"]').first();
    await card.dragTo(this.page.locator('[data-testid="swipe-container"]'), {
      targetPosition: { x: -300, y: 0 }
    });
  }

  async viewMatches() {
    await this.page.click('[data-testid="matches-tab"]');
  }

  async hasMatch(matchId: string) {
    return await this.page.isVisible(`[data-testid="match-${matchId}"]`);
  }

  async getRemainingLikes() {
    const text = await this.page.textContent('[data-testid="remaining-likes"]');
    return parseInt(text || '0');
  }

  async buyCredits(packageId: string) {
    await this.page.click('[data-testid="buy-credits-button"]');
    await this.page.click(`[data-testid="credit-package-${packageId}"]`);
    await this.page.click('[data-testid="purchase-credits-button"]');
  }
}