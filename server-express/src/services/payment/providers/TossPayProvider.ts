/**
 * @module TossPayProvider
 * @description 토스페이먼츠 API를 이용한 결제 제공자 모듈
 * 한국의 대표적인 결제 서비스인 토스페이먼츠와의 연동을 담당합니다.
 * 카드 결제, 계좌이체, 문화상품권 등 다양한 결제 수단을 지원합니다.
 */

import axios from 'axios';
import { Payment, PaymentStatus } from '@prisma/client';
import { PaymentProvider, ProcessPaymentRequest } from '../types';
import { createError } from '../../../middleware/errorHandler';
import { logger } from '../../../utils/logger';

/**
 * 토스페이먼츠 결제 제공자 클래스
 * @class TossPayProvider
 * @implements {PaymentProvider}
 * @description 토스페이먼츠 API를 이용한 결제 처리를 담당합니다.
 * 한국 시장에 특화된 결제 서비스로, 간편한 결제 경험과 높은 보안성을 제공합니다.
 */
export class TossPayProvider implements PaymentProvider {
  /** 토스페이먼츠 API 기본 URL */
  private readonly apiUrl = 'https://api.tosspayments.com/v1';
  /** 토스페이먼츠 비밀 키 */
  private readonly secretKey: string;
  /** 토스페이먼츠 클라이언트 키 */
  private readonly clientKey: string;

  /**
   * TossPayProvider 생성자
   * @constructor
   * @throws {Error} 토스페이먼츠 인증 정보가 설정되지 않았을 경우
   * @description 토스페이먼츠 API 인증 정보를 초기화합니다.
   */
  constructor() {
    this.secretKey = process.env.TOSS_SECRET_KEY || '';
    this.clientKey = process.env.TOSS_CLIENT_KEY || '';
    
    if (!this.secretKey || !this.clientKey) {
      throw new Error('TossPay credentials not configured');
    }
  }

  /**
   * 토스페이먼츠 API 인증 헤더 생성
   * @private
   * @returns {string} Basic 인증 헤더 문자열
   * @description 시크릿 키를 Base64로 인코딩하여 Basic 인증 헤더를 생성합니다.
   */
  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.secretKey}:`).toString('base64');
    return `Basic ${credentials}`;
  }

  /**
   * 토스페이먼츠 결제 생성
   * @async
   * @param {Payment} payment - 결제 정보
   * @returns {Promise<{paymentUrl: string, paymentData: any}>} 결제 URL과 메타데이터
   * @throws {Error} 결제 생성 실패시
   * @description 토스페이먼츠 결제를 생성하고 사용자가 결제할 수 있는 URL을 반환합니다.
   */
  async createPayment(payment: Payment): Promise<{
    paymentUrl: string;
    paymentData: any;
  }> {
    try {
      const orderId = `GLIMPSE_${payment.id}_${Date.now()}`;
      const orderName = this.getOrderName(payment);
      
      const response = await axios.post(
        `${this.apiUrl}/payments`,
        {
          orderId,
          orderName,
          amount: payment.amount,
          currency: payment.currency,
          successUrl: `${process.env.API_URL}/payments/success?paymentId=${payment.id}`,
          failUrl: `${process.env.API_URL}/payments/fail?paymentId=${payment.id}`,
          method: 'CARD',
          customerEmail: payment.metadata && (payment.metadata as any).email,
          customerName: payment.metadata && (payment.metadata as any).nickname
        },
        {
          headers: {
            Authorization: this.getAuthHeader(),
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        paymentUrl: response.data.checkout.url,
        paymentData: {
          orderId,
          paymentKey: response.data.paymentKey
        }
      };
    } catch (error: any) {
      logger.error('TossPay payment creation failed:', error.response?.data || error);
      throw createError(500, 'TossPay 결제 생성에 실패했습니다.');
    }
  }

  /**
   * 토스페이먼츠 결제 검증
   * @async
   * @param {Payment} payment - 결제 정보
   * @param {ProcessPaymentRequest} data - 결제 처리 데이터
   * @returns {Promise<{success: boolean, transactionId?: string, errorMessage?: string}>} 검증 결과
   * @description 토스페이먼츠 결제를 확정하고 검증합니다.
   */
  async verifyPayment(payment: Payment, data: ProcessPaymentRequest): Promise<{
    success: boolean;
    transactionId?: string;
    errorMessage?: string;
  }> {
    try {
      const paymentKey = data.paymentKey || (payment.metadata as any)?.externalData?.paymentKey;
      const orderId = (payment.metadata as any)?.externalData?.orderId;
      
      if (!paymentKey || !orderId) {
        throw new Error('Missing payment key or order ID');
      }

      const response = await axios.post(
        `${this.apiUrl}/payments/confirm`,
        {
          paymentKey,
          orderId,
          amount: payment.amount
        },
        {
          headers: {
            Authorization: this.getAuthHeader(),
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: response.data.status === 'DONE',
        transactionId: response.data.transactionKey
      };
    } catch (error: any) {
      logger.error('TossPay payment verification failed:', error.response?.data || error);
      return {
        success: false,
        errorMessage: error.response?.data?.message || '결제 검증에 실패했습니다.'
      };
    }
  }

  /**
   * 토스페이먼츠 결제 환불
   * @async
   * @param {Payment} payment - 결제 정보
   * @param {number} [amount] - 환불 금액 (미지정시 전액 환불)
   * @returns {Promise<{success: boolean, refundId?: string, errorMessage?: string}>} 환불 결과
   * @description 토스페이먼츠 결제를 전체 또는 부분 환불합니다.
   */
  async refundPayment(payment: Payment, amount?: number): Promise<{
    success: boolean;
    refundId?: string;
    errorMessage?: string;
  }> {
    try {
      const paymentKey = (payment.metadata as any)?.externalData?.paymentKey;
      
      if (!paymentKey) {
        throw new Error('Missing payment key for refund');
      }

      const response = await axios.post(
        `${this.apiUrl}/payments/${paymentKey}/cancel`,
        {
          cancelReason: '사용자 요청',
          cancelAmount: amount || payment.amount
        },
        {
          headers: {
            Authorization: this.getAuthHeader(),
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        refundId: response.data.cancels?.[0]?.transactionKey
      };
    } catch (error: any) {
      logger.error('TossPay refund failed:', error.response?.data || error);
      return {
        success: false,
        errorMessage: error.response?.data?.message || '환불 처리에 실패했습니다.'
      };
    }
  }

  /**
   * 토스페이먼츠 웹훅 처리
   * @async
   * @param {any} data - 웹훅 데이터
   * @returns {Promise<{paymentId: string, status: PaymentStatus, transactionId?: string}>} 결제 상태 업데이트 정보
   * @description 토스페이먼츠에서 전송되는 웹훅을 처리하여 결제 상태를 업데이트합니다.
   */
  async handleWebhook(data: any): Promise<{
    paymentId: string;
    status: PaymentStatus;
    transactionId?: string;
  }> {
    // TossPay webhook data structure
    const { orderId, status, transactionKey } = data;
    
    // Extract payment ID from orderId (format: GLIMPSE_[paymentId]_[timestamp])
    const paymentId = orderId.split('_')[1];
    
    let paymentStatus: PaymentStatus;
    switch (status) {
      case 'DONE':
        paymentStatus = 'COMPLETED';
        break;
      case 'CANCELED':
        paymentStatus = 'REFUNDED';
        break;
      case 'PARTIAL_CANCELED':
        paymentStatus = 'REFUNDED'; // Treat partial refunds as full refunds
        break;
      case 'EXPIRED':
      case 'ABORTED':
        paymentStatus = 'FAILED';
        break;
      default:
        paymentStatus = 'PENDING';
    }

    return {
      paymentId,
      status: paymentStatus,
      transactionId: transactionKey
    };
  }

  /**
   * 결제 주문명 생성
   * @private
   * @param {Payment} payment - 결제 정보
   * @returns {string} 주문명
   * @description 결제 유형에 따라 적절한 한국어 주문명을 생성합니다.
   */
  private getOrderName(payment: Payment): string {
    const packageType = (payment.metadata as any)?.packageType;
    
    switch (payment.type) {
      case 'LIKE_CREDITS':
        return `Glimpse 크레딧 ${packageType || ''}`;
      case 'PREMIUM_SUBSCRIPTION':
        return `Glimpse 프리미엄 ${packageType || '구독'}`;
      default:
        return 'Glimpse 결제';
    }
  }
}