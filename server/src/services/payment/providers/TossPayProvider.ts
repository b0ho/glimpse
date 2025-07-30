import axios from 'axios';
import { Payment, PaymentStatus } from '@prisma/client';
import { PaymentProvider, ProcessPaymentRequest } from '../types';
import { createError } from '../../../middleware/errorHandler';
import { logger } from '../../../utils/logger';

export class TossPayProvider implements PaymentProvider {
  private readonly apiUrl = 'https://api.tosspayments.com/v1';
  private readonly secretKey: string;
  private readonly clientKey: string;

  constructor() {
    this.secretKey = process.env.TOSS_SECRET_KEY || '';
    this.clientKey = process.env.TOSS_CLIENT_KEY || '';
    
    if (!this.secretKey || !this.clientKey) {
      throw new Error('TossPay credentials not configured');
    }
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.secretKey}:`).toString('base64');
    return `Basic ${credentials}`;
  }

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
        paymentStatus = 'PARTIALLY_REFUNDED';
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

  private getOrderName(payment: Payment): string {
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