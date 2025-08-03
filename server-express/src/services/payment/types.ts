/**
 * @module PaymentTypes
 * @description 결제 시스템 관련 타입 정의 모듈
 * 한국 결제 시스템(토스페이, 카카오페이)과 국제 결제 시스템(Stripe)을 지원합니다.
 */

import { PaymentStatus, PaymentMethod, PaymentType, Payment } from '@prisma/client';

/**
 * 결제 생성 요청 인터페이스
 * @interface CreatePaymentRequest
 * @description 새로운 결제를 생성할 때 필요한 정보를 정의합니다.
 */
export interface CreatePaymentRequest {
  /** 결제 요청 사용자 ID */
  userId: string;
  /** 결제 유형 (크레딧 구매, 프리미엄 구독 등) */
  type: PaymentType;
  /** 패키지 타입 (5_credits, monthly 등) */
  packageType?: string;
  /** 결제 금액 */
  amount: number;
  /** 통화 코드 (KRW, USD 등) */
  currency: string;
  /** 결제 수단 (TOSS_PAY, KAKAO_PAY, CARD 등) */
  paymentMethod: PaymentMethod;
}

/**
 * 결제 처리 요청 인터페이스
 * @interface ProcessPaymentRequest
 * @description 결제 완료 후 검증에 필요한 토큰 정보를 정의합니다.
 */
export interface ProcessPaymentRequest {
  /** 카카오페이 PG 토큰 */
  paymentToken?: string;
  /** 토스페이 결제 키 */
  paymentKey?: string;
}

/**
 * 결제 제공자 인터페이스
 * @interface PaymentProvider
 * @description 모든 결제 제공자가 구현해야 하는 공통 인터페이스입니다.
 * 토스페이, 카카오페이, Stripe 등 다양한 결제 시스템에 대한 통합 인터페이스를 제공합니다.
 */
export interface PaymentProvider {
  /**
   * 결제 생성
   * @param payment 결제 정보
   * @returns 결제 URL과 메타데이터
   */
  createPayment(payment: Payment): Promise<{
    /** 사용자가 결제를 진행할 URL */
    paymentUrl: string;
    /** 결제 제공자별 추가 데이터 */
    paymentData: any;
  }>;
  
  /**
   * 결제 검증
   * @param payment 결제 정보
   * @param data 결제 검증 데이터
   * @returns 검증 결과
   */
  verifyPayment(payment: Payment, data: ProcessPaymentRequest): Promise<{
    /** 검증 성공 여부 */
    success: boolean;
    /** 거래 ID */
    transactionId?: string;
    /** 에러 메시지 */
    errorMessage?: string;
  }>;
  
  /**
   * 결제 환불
   * @param payment 결제 정보
   * @param amount 환불 금액 (미지정시 전액 환불)
   * @returns 환불 결과
   */
  refundPayment(payment: Payment, amount?: number): Promise<{
    /** 환불 성공 여부 */
    success: boolean;
    /** 환불 ID */
    refundId?: string;
    /** 에러 메시지 */
    errorMessage?: string;
  }>;
  
  /**
   * 웹훅 처리
   * @param data 웹훅 데이터
   * @returns 결제 상태 업데이트 정보
   */
  handleWebhook(data: any): Promise<{
    /** 결제 ID */
    paymentId: string;
    /** 결제 상태 */
    status: PaymentStatus;
    /** 거래 ID */
    transactionId?: string;
  }>;
}

/**
 * 결제 결과 인터페이스
 * @interface PaymentResult
 * @description 결제 완료 후 반환되는 결과 정보를 정의합니다.
 */
export interface PaymentResult {
  /** 결제 ID */
  id: string;
  /** 외부 시스템 결제 ID */
  externalId: string;
  /** 결제 금액 */
  amount: number;
  /** 통화 코드 */
  currency: string;
  /** 결제 URL (미완료시) */
  paymentUrl?: string;
  /** 결제 수단 */
  paymentMethod: PaymentMethod;
  /** 결제 상태 */
  status: PaymentStatus;
  /** 생성 일시 */
  createdAt: Date;
}

/**
 * 환불 요청 인터페이스
 * @interface RefundRequest
 * @description 환불 요청에 필요한 정보를 정의합니다.
 */
export interface RefundRequest {
  /** 환불할 결제 ID */
  paymentId: string;
  /** 환불 금액 (미지정시 전액 환불) */
  amount?: number;
  /** 환불 사유 */
  reason: string;
}