/**
 * 결제 관련 타입 정의
 */

/**
 * 결제 상태
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

/**
 * 결제 수단
 */
export enum PaymentMethod {
  CARD = 'CARD',
  KAKAO_PAY = 'KAKAO_PAY',
  TOSS_PAY = 'TOSS_PAY',
  NAVER_PAY = 'NAVER_PAY'
}

/**
 * 결제
 */
export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  productId: string;
  type: 'PREMIUM_SUBSCRIPTION' | 'LIKE_CREDITS';
  status: PaymentStatus;
  method: PaymentMethod;
  stripePaymentId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}