/**
 * 프리미엄 구독 및 결제 서비스
 * Clerk + Stripe 통합
 */

import * as SecureStore from 'expo-secure-store';

// React Native global fetch
declare const fetch: typeof globalThis.fetch;

// 프리미엄 플랜 타입
export enum PremiumPlan {
  FREE = 'free',
  PREMIUM_MONTHLY = 'premium_monthly',
  PREMIUM_YEARLY = 'premium_yearly',
}

// 좋아요 패키지 타입
export enum LikePackage {
  SMALL = 'likes_5',    // 5개 좋아요 - 2,500원
  MEDIUM = 'likes_10',  // 10개 좋아요 - 4,500원
  LARGE = 'likes_20',   // 20개 좋아요 - 8,000원
  EXTRA = 'likes_50',   // 50개 좋아요 - 19,000원
}

// 프리미엄 기능 타입
export interface PremiumFeatures {
  unlimitedLikes: boolean;
  seeWhoLikesYou: boolean;
  priorityMatching: boolean;
  rewindLikes: boolean;
  superLikes: boolean;
  readReceipts: boolean;
  onlineStatus: boolean;
  premiumBadge: boolean;
}

// 구독 정보
export interface SubscriptionInfo {
  plan: PremiumPlan;
  isActive: boolean;
  expiresAt?: Date;
  cancelAtPeriodEnd?: boolean;
  features: PremiumFeatures;
  dailyLikesRemaining: number;
  totalPurchasedLikes: number;
}

// 결제 상품 정보
export interface PaymentProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  type: 'subscription' | 'one_time';
  benefits: string[];
}

class PremiumService {
  private static instance: PremiumService;

  public static getInstance(): PremiumService {
    if (!PremiumService.instance) {
      PremiumService.instance = new PremiumService();
    }
    return PremiumService.instance;
  }

  /**
   * 사용자의 현재 구독 상태 가져오기
   */
  async getCurrentSubscription(userId: string): Promise<SubscriptionInfo> {
    try {
      // Clerk User Metadata에서 구독 정보 조회
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/subscription/${userId}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }

      const data = await response.json();
      
      return {
        plan: data.plan || PremiumPlan.FREE,
        isActive: data.isActive || false,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
        features: this.getPlanFeatures(data.plan || PremiumPlan.FREE),
        dailyLikesRemaining: data.dailyLikesRemaining || 1,
        totalPurchasedLikes: data.totalPurchasedLikes || 0,
      };
    } catch (error) {
      console.error('Error fetching subscription:', error);
      
      // 기본값 반환
      return {
        plan: PremiumPlan.FREE,
        isActive: false,
        features: this.getPlanFeatures(PremiumPlan.FREE),
        dailyLikesRemaining: 1,
        totalPurchasedLikes: 0,
      };
    }
  }

  /**
   * 플랜별 기능 정의
   */
  private getPlanFeatures(plan: PremiumPlan): PremiumFeatures {
    const baseFeatures: PremiumFeatures = {
      unlimitedLikes: false,
      seeWhoLikesYou: false,
      priorityMatching: false,
      rewindLikes: false,
      superLikes: false,
      readReceipts: false,
      onlineStatus: false,
      premiumBadge: false,
    };

    switch (plan) {
      case PremiumPlan.PREMIUM_MONTHLY:
      case PremiumPlan.PREMIUM_YEARLY:
        return {
          ...baseFeatures,
          unlimitedLikes: true,
          seeWhoLikesYou: true,
          priorityMatching: true,
          rewindLikes: true,
          superLikes: true,
          readReceipts: true,
          onlineStatus: true,
          premiumBadge: true,
        };
      
      default:
        return baseFeatures;
    }
  }

  /**
   * 결제 상품 목록 가져오기
   */
  getPaymentProducts(): PaymentProduct[] {
    return [
      // 구독 상품
      {
        id: PremiumPlan.PREMIUM_MONTHLY,
        name: 'Glimpse Premium',
        description: '월간 프리미엄 구독',
        price: 9900,
        currency: 'KRW',
        type: 'subscription',
        benefits: [
          '무제한 좋아요',
          '나에게 좋아요를 보낸 사람 확인',
          '우선 매칭',
          '좋아요 되돌리기',
          '슈퍼 좋아요 5개/일',
          '읽음 표시',
          '온라인 상태 표시',
          '프리미엄 배지',
        ],
      },
      {
        id: PremiumPlan.PREMIUM_YEARLY,
        name: 'Glimpse Premium 연간',
        description: '연간 프리미엄 구독 (2개월 무료)',
        price: 99000,
        currency: 'KRW',
        type: 'subscription',
        benefits: [
          '월간 대비 17% 할인',
          '무제한 좋아요',
          '나에게 좋아요를 보낸 사람 확인',
          '우선 매칭',
          '좋아요 되돌리기',
          '슈퍼 좋아요 5개/일',
          '읽음 표시',
          '온라인 상태 표시',
          '프리미엄 배지',
        ],
      },
      
      // 좋아요 패키지
      {
        id: LikePackage.SMALL,
        name: '좋아요 5개',
        description: '추가 좋아요 5개',
        price: 2500,
        currency: 'KRW',
        type: 'one_time',
        benefits: ['좋아요 5개 즉시 추가'],
      },
      {
        id: LikePackage.MEDIUM,
        name: '좋아요 10개',
        description: '추가 좋아요 10개 (10% 할인)',
        price: 4500,
        currency: 'KRW',
        type: 'one_time',
        benefits: ['좋아요 10개 즉시 추가', '10% 할인 적용'],
      },
      {
        id: LikePackage.LARGE,
        name: '좋아요 20개',
        description: '추가 좋아요 20개 (20% 할인)',
        price: 8000,
        currency: 'KRW',
        type: 'one_time',
        benefits: ['좋아요 20개 즉시 추가', '20% 할인 적용'],
      },
      {
        id: LikePackage.EXTRA,
        name: '좋아요 50개',
        description: '추가 좋아요 50개 (24% 할인)',
        price: 19000,
        currency: 'KRW',
        type: 'one_time',
        benefits: ['좋아요 50개 즉시 추가', '24% 할인 적용', '최고 가성비'],
      },
    ];
  }

  /**
   * Stripe Payment Intent 생성
   */
  async createPaymentIntent(productId: string, userId: string): Promise<{clientSecret: string}> {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/payment/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          productId,
          userId,
          platform: 'mobile',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      return { clientSecret: data.clientSecret };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * 구독 생성
   */
  async createSubscription(planId: string, userId: string): Promise<{clientSecret: string}> {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/subscription/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          planId,
          userId,
          platform: 'mobile',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const data = await response.json();
      return { clientSecret: data.clientSecret };
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * 구독 취소
   */
  async cancelSubscription(userId: string): Promise<void> {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/subscription/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * 좋아요 사용
   */
  async useLike(userId: string): Promise<{success: boolean; remainingLikes: number}> {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/likes/use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to use like');
      }

      return await response.json();
    } catch (error) {
      console.error('Error using like:', error);
      throw error;
    }
  }

  /**
   * 일일 무료 좋아요 리셋 확인
   */
  async checkDailyReset(userId: string): Promise<void> {
    try {
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/likes/daily-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({ userId }),
      });
    } catch (error) {
      console.error('Error checking daily reset:', error);
    }
  }

  /**
   * 프리미엄 기능 사용 가능 여부 확인
   */
  async canUseFeature(userId: string, feature: keyof PremiumFeatures): Promise<boolean> {
    try {
      const subscription = await this.getCurrentSubscription(userId);
      return subscription.features[feature];
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  }

  /**
   * 인증 토큰 가져오기
   */
  private async getAuthToken(): Promise<string> {
    try {
      const token = await SecureStore.getItemAsync('clerk_token');
      if (!token) {
        throw new Error('No auth token found');
      }
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      throw error;
    }
  }

  /**
   * 가격 포맷팅
   */
  formatPrice(price: number, currency: string = 'KRW'): string {
    if (currency === 'KRW') {
      return `${price.toLocaleString('ko-KR')}원`;
    }
    return `${currency} ${price}`;
  }

  /**
   * 할인율 계산
   */
  calculateDiscount(originalPrice: number, discountedPrice: number): number {
    return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
  }
}

export const premiumService = PremiumService.getInstance();