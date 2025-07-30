import axios from 'axios';
import { Payment, PaymentStatus } from '@prisma/client';
import { PaymentProvider, ProcessPaymentRequest } from '../types';
import { createError } from '../../../middleware/errorHandler';
import { logger } from '../../../utils/logger';

export class KakaoPayProvider implements PaymentProvider {
  private readonly apiUrl = 'https://kapi.kakao.com/v1/payment';
  private readonly adminKey: string;
  private readonly cid: string; // 가맹점 ID

  constructor() {
    this.adminKey = process.env.KAKAO_ADMIN_KEY || '';
    this.cid = process.env.KAKAO_CID || 'TC0ONETIME'; // 테스트용 CID
    
    if (!this.adminKey) {
      throw new Error('KakaoPay credentials not configured');
    }
  }

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