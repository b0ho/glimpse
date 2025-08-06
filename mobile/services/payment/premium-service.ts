/**
 * 프리미엄 구독 및 결제 서비스
 * @module premium-service
 * @description Clerk + Stripe 통합을 통한 프리미엄 기능 및 결제 관리
 */

import * as SecureStore from 'expo-secure-store';

// React Native global fetch
declare const fetch: typeof globalThis.fetch;

/**
 * 프리미엄 플랜 열거형
 * @enum {string} PremiumPlan
 * @description 사용 가능한 프리미엄 구독 플랜
 */
export enum PremiumPlan {
  /** 무료 플랜 */
  FREE = 'free',
  /** 월간 프리미엄 플랜 */
  PREMIUM_MONTHLY = 'premium_monthly',
  /** 연간 프리미엄 플랜 */
  PREMIUM_YEARLY = 'premium_yearly',
}

/**
 * 좋아요 패키지 열거형
 * @enum {string} LikePackage
 * @description 일회성 좋아요 구매 패키지
 */
export enum LikePackage {
  /** 5개 좋아요 - 2,500원 */
  SMALL = 'likes_5',
  /** 10개 좋아요 - 4,500원 */
  MEDIUM = 'likes_10',
  /** 20개 좋아요 - 8,000원 */
  LARGE = 'likes_20',
  /** 50개 좋아요 - 19,000원 */
  EXTRA = 'likes_50',
}

/**
 * 프리미엄 기능 인터페이스
 * @interface PremiumFeatures
 * @description 프리미엄 구독자가 사용할 수 있는 기능 목록
 */
export interface PremiumFeatures {
  /** 무제한 좋아요 */
  unlimitedLikes: boolean;
  /** 나를 좋아한 사람 보기 */
  seeWhoLikesYou: boolean;
  /** 우선 매칭 */
  priorityMatching: boolean;
  /** 좋아요 되돌리기 */
  rewindLikes: boolean;
  /** 슈퍼 좋아요 */
  superLikes: boolean;
  /** 읽음 표시 */
  readReceipts: boolean;
  /** 온라인 상태 표시 */
  onlineStatus: boolean;
  /** 프리미엄 배지 */
  premiumBadge: boolean;
}

/**
 * 구독 정보 인터페이스
 * @interface SubscriptionInfo
 * @description 사용자의 현재 구독 상태 및 정보
 */
export interface SubscriptionInfo {
  /** 현재 플랜 */
  plan: PremiumPlan;
  /** 구독 활성화 여부 */
  isActive: boolean;
  /** 구독 만료일 */
  expiresAt?: Date;
  /** 기간 종료 시 취소 여부 */
  cancelAtPeriodEnd?: boolean;
  /** 사용 가능한 기능 */
  features: PremiumFeatures;
  /** 오늘 남은 무료 좋아요 수 */
  dailyLikesRemaining: number;
  /** 구매한 총 좋아요 수 */
  totalPurchasedLikes: number;
}

/**
 * 결제 상품 정보 인터페이스
 * @interface PaymentProduct
 * @description 구매 가능한 상품 정보
 */
export interface PaymentProduct {
  /** 상품 ID */
  id: string;
  /** 상품명 */
  name: string;
  /** 상품 설명 */
  description: string;
  /** 가격 */
  price: number;
  /** 통화 */
  currency: string;
  /** 상품 유형 */
  type: 'subscription' | 'one_time';
  /** 혜택 목록 */
  benefits: string[];
}

/**
 * 프리미엄 서비스 클래스
 * @class PremiumService
 * @description 프리미엄 구독, 결제, 좋아요 관리 기능 제공
 */
class PremiumService {
  /** 싱글톤 인스턴스 */
  private static instance: PremiumService;

  /**
   * 싱글톤 인스턴스 가져오기
   * @static
   * @returns {PremiumService} 프리미엄 서비스 인스턴스
   */
  public static getInstance(): PremiumService {
    if (!PremiumService.instance) {
      PremiumService.instance = new PremiumService();
    }
    return PremiumService.instance;
  }

  /**
   * 사용자의 현재 구독 상태 가져오기
   * @async
   * @param {string} userId - 사용자 ID
   * @returns {Promise<SubscriptionInfo>} 구독 정보
   * @description 서버에서 사용자의 구독 상태를 조회하고 기본값 처리
   */
  async getCurrentSubscription(userId: string): Promise<SubscriptionInfo> {
    try {
      // Clerk User Metadata에서 구독 정보 조회
      const response = await fetch(`${'http://localhost:3001'}/api/subscription/${userId}`, {
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
   * @private
   * @param {PremiumPlan} plan - 프리미엄 플랜
   * @returns {PremiumFeatures} 플랜에 따른 기능 목록
   * @description 각 플랜에서 사용 가능한 기능을 반환
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
   * @returns {PaymentProduct[]} 구매 가능한 상품 목록
   * @description 프리미엄 구독과 좋아요 패키지 상품 정보 반환
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
   * @async
   * @param {string} productId - 상품 ID
   * @param {string} userId - 사용자 ID
   * @returns {Promise<{clientSecret: string}>} 결제 시크릿
   * @throws {Error} 결제 인텐트 생성 실패 시
   * @description Stripe 결제를 위한 Payment Intent 생성
   */
  async createPaymentIntent(productId: string, userId: string): Promise<{clientSecret: string}> {
    try {
      const response = await fetch(`${'http://localhost:3001'}/api/payment/create-intent`, {
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
   * @async
   * @param {string} planId - 플랜 ID
   * @param {string} userId - 사용자 ID
   * @returns {Promise<{clientSecret: string}>} 구독 시크릿
   * @throws {Error} 구독 생성 실패 시
   * @description 프리미엄 구독을 생성하고 결제 준비
   */
  async createSubscription(planId: string, userId: string): Promise<{clientSecret: string}> {
    try {
      const response = await fetch(`${'http://localhost:3001'}/api/subscription/create`, {
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
   * @async
   * @param {string} userId - 사용자 ID
   * @returns {Promise<void>}
   * @throws {Error} 구독 취소 실패 시
   * @description 현재 활성화된 구독을 취소 (기간 종료 시 만료)
   */
  async cancelSubscription(userId: string): Promise<void> {
    try {
      const response = await fetch(`${'http://localhost:3001'}/api/subscription/cancel`, {
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
   * @async
   * @param {string} userId - 사용자 ID
   * @returns {Promise<{success: boolean; remainingLikes: number}>} 사용 결과 및 남은 좋아요 수
   * @throws {Error} 좋아요 사용 실패 시
   * @description 일일 무료 좋아요 또는 구매한 좋아요 차감
   */
  async useLike(userId: string): Promise<{success: boolean; remainingLikes: number}> {
    try {
      const response = await fetch(`${'http://localhost:3001'}/api/likes/use`, {
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
   * @async
   * @param {string} userId - 사용자 ID
   * @returns {Promise<void>}
   * @description 매일 자정에 무료 좋아요를 1개로 리셋
   */
  async checkDailyReset(userId: string): Promise<void> {
    try {
      await fetch(`${'http://localhost:3001'}/api/likes/daily-reset`, {
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
   * @async
   * @param {string} userId - 사용자 ID
   * @param {keyof PremiumFeatures} feature - 확인할 기능
   * @returns {Promise<boolean>} 기능 사용 가능 여부
   * @description 특정 프리미엄 기능의 사용 권한 확인
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
   * @private
   * @async
   * @returns {Promise<string>} Clerk 인증 토큰
   * @throws {Error} 토큰이 없을 때
   * @description SecureStore에서 저장된 인증 토큰 조회
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
   * @param {number} price - 가격
   * @param {string} [currency='KRW'] - 통화
   * @returns {string} 포맷팅된 가격 문자열
   * @description 통화에 맞게 가격을 포맷팅하여 표시
   */
  formatPrice(price: number, currency: string = 'KRW'): string {
    if (currency === 'KRW') {
      return `${price.toLocaleString('ko-KR')}원`;
    }
    return `${currency} ${price}`;
  }

  /**
   * 할인율 계산
   * @param {number} originalPrice - 원가
   * @param {number} discountedPrice - 할인가
   * @returns {number} 할인율 (퍼센트)
   * @description 원가 대비 할인율을 계산하여 반환
   */
  calculateDiscount(originalPrice: number, discountedPrice: number): number {
    return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
  }
}

/**
 * 프리미엄 서비스 싱글톤 인스턴스
 * @constant {PremiumService}
 * @description 앱 전체에서 사용할 프리미엄 서비스 인스턴스
 */
export const premiumService = PremiumService.getInstance();