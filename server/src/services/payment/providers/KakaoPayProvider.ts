/**
 * @module KakaoPayProvider
 * @description 카카오페이 API를 이용한 결제 제공자 모듈
 * 카카오의 간편결제 서비스로, 카카오톡 사용자들이 익숙한 결제 경험을 제공합니다.
 * 모바일과 PC 환경 모두를 지원하며, 카카오월렛 연동이 가능합니다.
 */

import axios from 'axios';
import { Payment, PaymentStatus } from '@prisma/client';
import { PaymentProvider, ProcessPaymentRequest } from '../types';
import { createError } from '../../../middleware/errorHandler';
import { logger } from '../../../utils/logger';

/**
 * 카카오페이 결제 제공자 클래스
 * @class KakaoPayProvider
 * @implements {PaymentProvider}
 * @description 카카오페이 API를 이용한 결제 처리를 담당합니다.
 * 카카오 사용자들에게 친숙한 결제 인터페이스와 빠른 결제 경험을 제공합니다.
 */
export class KakaoPayProvider implements PaymentProvider {
  /** 카카오페이 API 기본 URL */
  private readonly apiUrl = 'https://kapi.kakao.com/v1/payment';
  /** 카카오페이 관리자 키 */
  private readonly adminKey: string;
  /** 가맹점 ID (테스트용 CID 기본 사용) */
  private readonly cid: string;

  /**
   * KakaoPayProvider 생성자
   * @constructor
   * @throws {Error} 카카오페이 인증 정보가 설정되지 않았을 경우
   * @description 카카오페이 API 인증 정보를 초기화합니다.
   */
  constructor() {
    this.adminKey = process.env.KAKAO_ADMIN_KEY || '';
    this.cid = process.env.KAKAO_CID || 'TC0ONETIME'; // 테스트용 CID
    
    if (!this.adminKey) {
      throw new Error('KakaoPay credentials not configured');
    }
  }

  /**
   * 카카오페이 결제 생성
   * @async
   * @param {Payment} payment - 결제 정보
   * @returns {Promise<{paymentUrl: string, paymentData: any}>} 결제 URL과 메타데이터
   * @throws {Error} 결제 생성 실패시
   * @description 카카오페이 결제를 준비하고 사용자가 결제할 수 있는 URL을 반환합니다.
   */
  async createPayment(payment: Payment): Promise<{
    paymentUrl: string;
    paymentData: any;
  }> {
    try {
      const partnerOrderId = `GLIMPSE_${payment.id}`;
      const partnerUserId = payment.userId;
      const itemName = this.getItemName(payment);
      
      const response = await axios.post(
        `${this.apiUrl}/ready`,
        new URLSearchParams({
          cid: this.cid,
          partner_order_id: partnerOrderId,
          partner_user_id: partnerUserId,
          item_name: itemName,
          quantity: '1',
          total_amount: payment.amount.toString(),
          tax_free_amount: '0',
          approval_url: `${process.env.API_URL}/payments/kakao/success?paymentId=${payment.id}`,
          cancel_url: `${process.env.API_URL}/payments/kakao/cancel?paymentId=${payment.id}`,
          fail_url: `${process.env.API_URL}/payments/kakao/fail?paymentId=${payment.id}`
        }),
        {
          headers: {
            Authorization: `KakaoAK ${this.adminKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return {
        paymentUrl: response.data.next_redirect_mobile_url || response.data.next_redirect_pc_url,
        paymentData: {
          tid: response.data.tid,
          partnerOrderId,
          partnerUserId
        }
      };
    } catch (error: any) {
      logger.error('KakaoPay payment creation failed:', error.response?.data || error);
      throw createError(500, '카카오페이 결제 생성에 실패했습니다.');
    }
  }

  /**
   * 카카오페이 결제 검증
   * @async
   * @param {Payment} payment - 결제 정보
   * @param {ProcessPaymentRequest} data - 결제 처리 데이터 (PG 토큰 포함)
   * @returns {Promise<{success: boolean, transactionId?: string, errorMessage?: string}>} 검증 결과
   * @description 카카오페이 결제를 승인하고 검증합니다.
   */
  async verifyPayment(payment: Payment, data: ProcessPaymentRequest): Promise<{
    success: boolean;
    transactionId?: string;
    errorMessage?: string;
  }> {
    try {
      const tid = (payment.metadata as any)?.externalData?.tid;
      const pgToken = data.paymentToken;
      const partnerOrderId = (payment.metadata as any)?.externalData?.partnerOrderId;
      const partnerUserId = (payment.metadata as any)?.externalData?.partnerUserId;
      
      if (!tid || !pgToken) {
        throw new Error('Missing TID or PG token');
      }

      const response = await axios.post(
        `${this.apiUrl}/approve`,
        new URLSearchParams({
          cid: this.cid,
          tid,
          partner_order_id: partnerOrderId,
          partner_user_id: partnerUserId,
          pg_token: pgToken
        }),
        {
          headers: {
            Authorization: `KakaoAK ${this.adminKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return {
        success: true,
        transactionId: response.data.aid
      };
    } catch (error: any) {
      logger.error('KakaoPay payment verification failed:', error.response?.data || error);
      return {
        success: false,
        errorMessage: error.response?.data?.msg || '결제 검증에 실패했습니다.'
      };
    }
  }

  /**
   * 카카오페이 결제 환불
   * @async
   * @param {Payment} payment - 결제 정보
   * @param {number} [amount] - 환불 금액 (미지정시 전액 환불)
   * @returns {Promise<{success: boolean, refundId?: string, errorMessage?: string}>} 환불 결과
   * @description 카카오페이 결제를 전체 또는 부분 취소합니다.
   */
  async refundPayment(payment: Payment, amount?: number): Promise<{
    success: boolean;
    refundId?: string;
    errorMessage?: string;
  }> {
    try {
      const tid = (payment.metadata as any)?.externalData?.tid;
      
      if (!tid) {
        throw new Error('Missing TID for refund');
      }

      const response = await axios.post(
        `${this.apiUrl}/cancel`,
        new URLSearchParams({
          cid: this.cid,
          tid,
          cancel_amount: (amount || payment.amount).toString(),
          cancel_tax_free_amount: '0'
        }),
        {
          headers: {
            Authorization: `KakaoAK ${this.adminKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return {
        success: true,
        refundId: response.data.aid
      };
    } catch (error: any) {
      logger.error('KakaoPay refund failed:', error.response?.data || error);
      return {
        success: false,
        errorMessage: error.response?.data?.msg || '환불 처리에 실패했습니다.'
      };
    }
  }

  /**
   * 카카오페이 웹훅 처리
   * @async
   * @param {any} data - 웹훅 데이터
   * @returns {Promise<{paymentId: string, status: PaymentStatus, transactionId?: string}>} 결제 상태 업데이트 정보
   * @description 카카오페이는 웹훅을 지원하지 않으므로 리다이렉트 URL을 통해 처리합니다.
   */
  async handleWebhook(data: any): Promise<{
    paymentId: string;
    status: PaymentStatus;
    transactionId?: string;
  }> {
    // KakaoPay doesn't have webhooks, this is handled via redirect URLs
    const { partner_order_id, status, aid } = data;
    
    // Extract payment ID from partner_order_id (format: GLIMPSE_[paymentId])
    const paymentId = partner_order_id.split('_')[1];
    
    let paymentStatus: PaymentStatus;
    switch (status) {
      case 'SUCCESS':
        paymentStatus = 'COMPLETED';
        break;
      case 'CANCEL':
        paymentStatus = 'CANCELLED';
        break;
      case 'FAIL':
        paymentStatus = 'FAILED';
        break;
      default:
        paymentStatus = 'PENDING';
    }

    return {
      paymentId,
      status: paymentStatus,
      transactionId: aid
    };
  }

  /**
   * 결제 상품명 생성
   * @private
   * @param {Payment} payment - 결제 정보
   * @returns {string} 상품명
   * @description 결제 유형에 따라 적절한 한국어 상품명을 생성합니다.
   */
  private getItemName(payment: Payment): string {
    const packageType = (payment.metadata as any)?.packageType;
    
    switch (payment.type) {
      case 'CREDIT_PURCHASE':
        return `Glimpse 크레딧 ${packageType || ''}`;
      case 'PREMIUM_SUBSCRIPTION':
        return `Glimpse 프리미엄 ${packageType || '구독'}`;
      default:
        return 'Glimpse 결제';
    }
  }
}