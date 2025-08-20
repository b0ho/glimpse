/**
 * 구독 티어 타입 정의
 */

export enum SubscriptionTier {
  BASIC = 'BASIC',         // 무료 일반 사용자
  ADVANCED = 'ADVANCED',    // 고급 구독자
  PREMIUM = 'PREMIUM'       // 프리미엄 구독자
}

export interface SubscriptionFeatures {
  // 관심상대 찾기 관련
  interestSearchLimit: number | 'unlimited';  // 관심상대 등록 개수 제한
  interestSearchTypes: number | 'unlimited';  // 사용 가능한 유형 수
  interestSearchDuration: number;             // 검색 유효 기간 (일 단위)
  canSendInterestFirst: boolean;              // 먼저 관심있어요 보내기 가능 여부
  
  // 근처 사용자 관련
  dailyLikeLimit: number | 'unlimited';       // 일일 좋아요 제한
  
  // 페르소나 관련
  personaTopPlacement: boolean;               // 페르소나 상단 배치
  
  // 기타 혜택
  noAds: boolean;                            // 광고 제거
  priorityMatching: boolean;                  // 우선 매칭
  seeWhoLikedYou: boolean;                   // 누가 좋아요 했는지 확인
  readReceipts: boolean;                     // 읽음 표시
  unlimitedRewind: boolean;                  // 무제한 되돌리기
}

export const SUBSCRIPTION_FEATURES: Record<SubscriptionTier, SubscriptionFeatures> = {
  [SubscriptionTier.BASIC]: {
    interestSearchLimit: 3,           // 최대 3개 (유형별 1개씩)
    interestSearchTypes: 3,            // 3개 유형만 사용 가능
    interestSearchDuration: 3,         // 3일
    canSendInterestFirst: false,
    dailyLikeLimit: 1,                // 1일 1회
    personaTopPlacement: false,
    noAds: false,
    priorityMatching: false,
    seeWhoLikedYou: false,
    readReceipts: false,
    unlimitedRewind: false,
  },
  [SubscriptionTier.ADVANCED]: {
    interestSearchLimit: 10,          // 모든 유형 1개씩 (총 10개)
    interestSearchTypes: 10,           // 모든 유형 사용 가능
    interestSearchDuration: 14,        // 2주
    canSendInterestFirst: true,
    dailyLikeLimit: 3,                 // 1일 3회
    personaTopPlacement: false,
    noAds: true,
    priorityMatching: false,
    seeWhoLikedYou: false,
    readReceipts: true,
    unlimitedRewind: false,
  },
  [SubscriptionTier.PREMIUM]: {
    interestSearchLimit: 'unlimited',  // 무제한
    interestSearchTypes: 'unlimited',  // 모든 유형 무제한
    interestSearchDuration: 365,       // 사실상 무제한 (1년)
    canSendInterestFirst: true,
    dailyLikeLimit: 'unlimited',       // 무제한
    personaTopPlacement: true,
    noAds: true,
    priorityMatching: true,
    seeWhoLikedYou: true,
    readReceipts: true,
    unlimitedRewind: true,
  },
};

export interface SubscriptionPricing {
  tier: SubscriptionTier;
  monthly: number;        // 월간 가격 (원)
  yearly: number;         // 연간 가격 (원)
  yearlyMonthly: number;  // 연간 구독 시 월 가격
  discount?: number;      // 연간 할인율 (%)
  popular?: boolean;      // 인기 플랜 표시
}

export const SUBSCRIPTION_PRICING: SubscriptionPricing[] = [
  {
    tier: SubscriptionTier.BASIC,
    monthly: 0,
    yearly: 0,
    yearlyMonthly: 0,
  },
  {
    tier: SubscriptionTier.ADVANCED,
    monthly: 9900,
    yearly: 99000,
    yearlyMonthly: 8250,
    discount: 17,
    popular: true,
  },
  {
    tier: SubscriptionTier.PREMIUM,
    monthly: 19900,
    yearly: 199000,
    yearlyMonthly: 16583,
    discount: 17,
  },
];

export interface UserSubscription {
  userId: string;
  tier: SubscriptionTier;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  billingCycle: 'monthly' | 'yearly';
  autoRenew: boolean;
  paymentMethod?: string;
}