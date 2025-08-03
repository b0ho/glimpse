/**
 * @module StripeProvider
 * @description Stripe API를 이용한 국제 결제 제공자 모듈
 * 전 세계에서 사용되는 온라인 결제 서비스로, 카드 결제와 구독 결제를 지원합니다.
 * PCI DSS 준수를 통한 높은 보안성과 다양한 통화 지원이 특징입니다.
 */

import Stripe from 'stripe';
import { Payment, PaymentStatus } from '@prisma/client';
import { PaymentProvider, ProcessPaymentRequest } from '../types';
import { createError } from '../../../middleware/errorHandler';
import { logger } from '../../../utils/logger';

/**
 * Stripe 결제 제공자 클래스
 * @class StripeProvider
 * @implements {PaymentProvider}
 * @description Stripe API를 이용한 국제 결제 처리를 담당합니다.
 * 카드 결제, 각종 디지털 월렛, 구독 결제 등을 지원하며, 다양한 통화로 결제가 가능합니다.
 */
export class StripeProvider implements PaymentProvider {
  /** Stripe 클라이언트 인스턴스 */
  private stripe: Stripe;

  /**
   * StripeProvider 생성자
   * @constructor
   * @throws {Error} Stripe 비밀 키가 설정되지 않았을 경우
   * @description Stripe 클라이언트를 초기화하고 API 버전을 설정합니다.
   */
  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('Stripe secret key not configured');
    }
    
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16'
    });
  }

  /**
   * Stripe 결제 생성
   * @async
   * @param {Payment} payment - 결제 정보
   * @returns {Promise<{paymentUrl: string, paymentData: any}>} 결제 URL과 메타데이터
   * @throws {Error} 결제 생성 실패시
   * @description Stripe Checkout 세션을 생성하여 결제 또는 구독 결제를 처리합니다.
   */
  async createPayment(payment: Payment): Promise<{
    paymentUrl: string;
    paymentData: any;
  }> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: payment.currency.toLowerCase(),
              product_data: {
                name: this.getProductName(payment),
                description: this.getProductDescription(payment)
              },
              unit_amount: payment.amount * (payment.currency === 'KRW' ? 1 : 100) // Stripe uses cents for most currencies
            },
            quantity: 1
          }
        ],
        mode: payment.type === 'PREMIUM_SUBSCRIPTION' ? 'subscription' : 'payment',
        success_url: `${process.env.APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&paymentId=${payment.id}`,
        cancel_url: `${process.env.APP_URL}/payment/cancel?paymentId=${payment.id}`,
        metadata: {
          paymentId: payment.id,
          userId: payment.userId,
          type: payment.type
        }
      });

      return {
        paymentUrl: session.url!,
        paymentData: {
          sessionId: session.id
        }
      };
    } catch (error: any) {
      logger.error('Stripe payment creation failed:', error);
      throw createError(500, 'Stripe 결제 생성에 실패했습니다.');
    }
  }

  /**
   * Stripe 결제 검증
   * @async
   * @param {Payment} payment - 결제 정보
   * @param {ProcessPaymentRequest} data - 결제 처리 데이터
   * @returns {Promise<{success: boolean, transactionId?: string, errorMessage?: string}>} 검증 결과
   * @description Stripe Checkout 세션의 결제 상태를 확인하고 검증합니다.
   */
  async verifyPayment(payment: Payment, data: ProcessPaymentRequest): Promise<{
    success: boolean;
    transactionId?: string;
    errorMessage?: string;
  }> {
    try {
      const sessionId = (payment.metadata as any)?.externalData?.sessionId;
      
      if (!sessionId) {
        throw new Error('Missing session ID');
      }

      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      
      if (session.payment_status === 'paid') {
        return {
          success: true,
          transactionId: session.payment_intent as string
        };
      } else {
        return {
          success: false,
          errorMessage: '결제가 완료되지 않았습니다.'
        };
      }
    } catch (error: any) {
      logger.error('Stripe payment verification failed:', error);
      return {
        success: false,
        errorMessage: error.message || '결제 검증에 실패했습니다.'
      };
    }
  }

  /**
   * Stripe 결제 환불
   * @async
   * @param {Payment} payment - 결제 정보
   * @param {number} [amount] - 환불 금액 (미지정시 전액 환부)
   * @returns {Promise<{success: boolean, refundId?: string, errorMessage?: string}>} 환불 결과
   * @description Stripe 결제를 전체 또는 부분 환불합니다.
   */
  async refundPayment(payment: Payment, amount?: number): Promise<{
    success: boolean;
    refundId?: string;
    errorMessage?: string;
  }> {
    try {
      const transactionId = payment.stripePaymentId;
      
      if (!transactionId) {
        throw new Error('Missing transaction ID for refund');
      }

      const refund = await this.stripe.refunds.create({
        payment_intent: transactionId,
        amount: amount ? amount * (payment.currency === 'KRW' ? 1 : 100) : undefined
      });

      return {
        success: true,
        refundId: refund.id
      };
    } catch (error: any) {
      logger.error('Stripe refund failed:', error);
      return {
        success: false,
        errorMessage: error.message || '환불 처리에 실패했습니다.'
      };
    }
  }

  /**
   * Stripe 웹훅 처리
   * @async
   * @param {any} data - Stripe 웹훅 이벤트 데이터
   * @returns {Promise<{paymentId: string, status: PaymentStatus, transactionId?: string}>} 결제 상태 업데이트 정보
   * @description Stripe에서 전송되는 웹훅 이벤트를 처리하여 결제 상태를 업데이트합니다.
   */
  async handleWebhook(data: any): Promise<{
    paymentId: string;
    status: PaymentStatus;
    transactionId?: string;
  }> {
    const event = data as Stripe.Event;
    
    let paymentId: string;
    let status: PaymentStatus = 'PENDING';
    let transactionId: string | undefined;

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        paymentId = session.metadata?.paymentId || '';
        status = 'COMPLETED';
        transactionId = session.payment_intent as string;
        break;
        
      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object as Stripe.PaymentIntent;
        paymentId = failedIntent.metadata?.paymentId || '';
        status = 'FAILED';
        break;
        
      case 'charge.refunded':
        const refundedCharge = event.data.object as Stripe.Charge;
        paymentId = refundedCharge.metadata?.paymentId || '';
        status = 'REFUNDED'; // Treat all refunds as full refunds
        break;
        
      default:
        throw new Error(`Unhandled webhook event type: ${event.type}`);
    }

    return {
      paymentId,
      status,
      transactionId
    };
  }

  /**
   * 결제 상품명 생성 (영문)
   * @private
   * @param {Payment} payment - 결제 정보
   * @returns {string} 영문 상품명
   * @description 결제 유형에 따라 적절한 영문 상품명을 생성합니다.
   */
  private getProductName(payment: Payment): string {
    const packageType = (payment.metadata as any)?.packageType;
    
    switch (payment.type) {
      case 'LIKE_CREDITS':
        return `Glimpse Credits ${packageType || ''}`;
      case 'PREMIUM_SUBSCRIPTION':
        return `Glimpse Premium ${packageType || 'Subscription'}`;
      default:
        return 'Glimpse Payment';
    }
  }

  /**
   * 결제 상품 설명 생성
   * @private
   * @param {Payment} payment - 결제 정보
   * @returns {string} 한국어 상품 설명
   * @description 결제 유형에 따라 사용자에게 보여줄 한국어 상품 설명을 생성합니다.
   */
  private getProductDescription(payment: Payment): string {
    switch (payment.type) {
      case 'LIKE_CREDITS':
        return '좋아요를 보낼 수 있는 크레딧';
      case 'PREMIUM_SUBSCRIPTION':
        return '무제한 좋아요 및 프리미엄 기능';
      default:
        return 'Glimpse 서비스 이용료';
    }
  }
}