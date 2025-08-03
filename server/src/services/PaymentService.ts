import { PaymentStatus, PaymentMethod, PaymentType, Payment } from '@prisma/client';
import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import axios from 'axios';
import * as crypto from 'crypto';
import { metrics } from '../utils/monitoring';



/**
 * 결제 생성 요청 인터페이스
 * @interface CreatePaymentRequest
 */
interface CreatePaymentRequest {
  /** 사용자 ID */
  userId: string;
  /** 결제 타입 */
  type: PaymentType;
  /** 패키지 타입 */
  packageType?: string;
  /** 결제 금액 */
  amount: number;
  /** 통화 */
  currency: string;
  /** 결제 수단 */
  paymentMethod: PaymentMethod;
}

/**
 * 결제 처리 요청 인터페이스
 * @interface ProcessPaymentRequest
 */
interface ProcessPaymentRequest {
  /** 결제 토큰 */
  paymentToken?: string;
  /** 결제 키 */
  paymentKey?: string;
}

/**
 * 결제 서비스 - 결제 처리, 환불, 구독 관리
 * @class PaymentService
 */
export class PaymentService {
  /** 토스 시크릿 키 */
  private readonly tossSecretKey = process.env.TOSS_SECRET_KEY || '';
  /** 카카오 시크릿 키 */
  private readonly kakaoSecretKey = process.env.KAKAO_SECRET_KEY || '';
  /** 웹훅 시크릿 */
  private readonly webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || '';

  /**
   * 결제 생성
   * @param {CreatePaymentRequest} data - 결제 생성 데이터
   * @returns {Promise<Object>} 생성된 결제 정보
   * @throws {Error} 최소 금액 미달 또는 지원하지 않는 결제 수단
   */
  async createPayment(data: CreatePaymentRequest) {
    const { userId, type, packageType, amount, currency, paymentMethod } = data;

    // Validate payment amount
    const minAmount = currency === 'KRW' ? 100 : 1;
    if (amount < minAmount) {
      throw createError(400, `최소 결제 금액은 ${minAmount}${currency}입니다.`);
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        type,
        amount,
        currency,
        status: 'PENDING',
        method: paymentMethod,
        metadata: {
          userAgent: 'mobile-app',
          platform: 'glimpse',
          externalId: this.generatePaymentId(),
          packageType
        }
      }
    });

    // Generate payment URL based on method
    let paymentUrl = '';
    let paymentData = {};

    switch (paymentMethod) {
      case 'TOSS_PAY':
        ({ paymentUrl, paymentData } = await this.createTossPayment(payment));
        break;
      case 'KAKAO_PAY':
        ({ paymentUrl, paymentData } = await this.createKakaoPayment(payment));
        break;
      case 'CARD':
      case 'NAVER_PAY':
        ({ paymentUrl, paymentData } = await this.createGenericPayment(payment));
        break;
      default:
        throw createError(400, '지원하지 않는 결제 방법입니다.');
    }

    // Update payment with external data
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        metadata: {
          ...payment.metadata as object,
          externalData: paymentData,
          paymentUrl
        }
      }
    });

    return {
      id: payment.id,
      externalId: (payment.metadata as any)?.externalId,
      amount: payment.amount,
      currency: payment.currency,
      paymentUrl,
      paymentMethod: payment.method,
      status: payment.status,
      createdAt: payment.createdAt
    };
  }

  /**
   * 결제 처리
   * @param {string} paymentId - 결제 ID
   * @param {string} userId - 사용자 ID
   * @param {ProcessPaymentRequest} data - 처리 데이터
   * @returns {Promise<Object>} 처리 결과
   * @throws {Error} 결제를 찾을 수 없거나 권한이 없을 때
   */
  async processPayment(paymentId: string, userId: string, data: ProcessPaymentRequest) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    });

    if (!payment) {
      throw createError(404, '결제를 찾을 수 없습니다.');
    }

    if (payment.userId !== userId) {
      throw createError(403, '이 결제를 처리할 권한이 없습니다.');
    }

    if (payment.status !== 'PENDING') {
      throw createError(400, '이미 처리된 결제입니다.');
    }

    let result;
    
    // Track payment attempt
    metrics.paymentAttemptsTotal.labels(payment.method, 'processing').inc();
    
    try {
      switch (payment.method) {
        case 'TOSS_PAY':
          result = await this.processTossPayment(payment, data.paymentKey!);
          break;
        case 'KAKAO_PAY':
          result = await this.processKakaoPayment(payment, data.paymentToken!);
          break;
        default:
          result = await this.processGenericPayment(payment, data);
      }
    } catch (error) {
      metrics.paymentFailuresTotal.labels(payment.method, 'processing_error').inc();
      throw error;
    }

    // Update payment status
    const finalStatus = result.success ? 'COMPLETED' : 'FAILED';
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: finalStatus,
        metadata: {
          ...payment.metadata as object,
          externalData: {
            ...(payment.metadata as any)?.externalData,
            ...result.data
          }
        },
      }
    });
    
    // Track payment result
    metrics.paymentAttemptsTotal.labels(payment.method, finalStatus.toLowerCase()).inc();
    if (!result.success) {
      metrics.paymentFailuresTotal.labels(payment.method, result.data?.errorCode || 'unknown').inc();
    }

    if (result.success) {
      // Apply payment benefits
      await this.applyPaymentBenefits(payment);
    }

    return {
      id: payment.id,
      status: result.success ? 'COMPLETED' : 'FAILED',
      type: payment.type,
      amount: payment.amount,
      currency: payment.currency,
      ...(result.error && { error: result.error })
    };
  }

  /**
   * 결제 검증
   * @param {string} paymentId - 결제 ID
   * @returns {Promise<Object>} 검증 결과
   * @throws {Error} 결제를 찾을 수 없을 때
   */
  async verifyPayment(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    });

    if (!payment) {
      throw createError(404, '결제를 찾을 수 없습니다.');
    }

    let verification;
    switch (payment.method) {
      case 'TOSS_PAY':
        verification = await this.verifyTossPayment((payment.metadata as any)?.externalId);
        break;
      case 'KAKAO_PAY':
        verification = await this.verifyKakaoPayment((payment.metadata as any)?.externalId);
        break;
      default:
        verification = { verified: payment.status === 'COMPLETED' };
    }

    return {
      paymentId: payment.id,
      externalId: (payment.metadata as any)?.externalId,
      status: payment.status,
      verified: verification.verified,
      amount: payment.amount,
      currency: payment.currency,
      verificationData: verification.data
    };
  }

  /**
   * 결제 환불
   * @param {string} paymentId - 결제 ID
   * @param {string} reason - 환불 사유
   * @returns {Promise<Object>} 환불 결과
   * @throws {Error} 결제를 찾을 수 없거나 환불 불가능한 상태
   */
  async refundPayment(paymentId: string, reason: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    });

    if (!payment) {
      throw createError(404, '결제를 찾을 수 없습니다.');
    }

    if (payment.status !== 'COMPLETED') {
      throw createError(400, '성공한 결제만 환불할 수 있습니다.');
    }

    let refundResult;
    switch (payment.method) {
      case 'TOSS_PAY':
        refundResult = await this.refundTossPayment((payment.metadata as any)?.externalId, payment.amount, reason);
        break;
      case 'KAKAO_PAY':
        refundResult = await this.refundKakaoPayment((payment.metadata as any)?.externalId, payment.amount, reason);
        break;
      default:
        throw createError(400, '이 결제 방법은 자동 환불을 지원하지 않습니다. 고객센터로 문의해주세요.');
    }

    // Create refund record in payment metadata
    const refundData = {
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      reason,
      status: refundResult.success ? 'COMPLETED' : 'FAILED',
      refundId: refundResult.refundId,
      processedAt: refundResult.success ? new Date().toISOString() : null,
      failureReason: refundResult.success ? null : refundResult.error
    };

    // Update payment with refund information
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        metadata: {
          ...payment.metadata as object,
          refund: refundData
        }
      }
    });

    if (refundResult.success) {
      // Reverse payment benefits
      await this.reversePaymentBenefits(payment);

      // Update payment status
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'REFUNDED' }
      });
    }

    return {
      refundId: refundData.refundId,
      paymentId: payment.id,
      amount: refundData.amount,
      currency: refundData.currency,
      status: refundData.status,
      reason: refundData.reason,
      processedAt: refundData.processedAt
    };
  }

  /**
   * 토스 결제 생성
   * @private
   * @param {Payment} payment - 결제 엔티티
   * @returns {Promise<Object>} 결제 URL과 데이터
   * @throws {Error} 토스페이 결제 생성 실패 시
   */
  private async createTossPayment(payment: Payment) {
    const metadata = payment.metadata as any || {};
    const orderId = metadata.externalId || payment.id;
    const orderName = this.getOrderName(payment.type, metadata.packageType);
    
    const paymentData = {
      orderId,
      orderName,
      amount: payment.amount,
      currency: payment.currency,
      successUrl: `${process.env.BASE_URL}/payment/success`,
      failUrl: `${process.env.BASE_URL}/payment/fail`,
      customerName: '글림프스 사용자',
      customerEmail: 'user@glimpse.app'
    };

    try {
      const response = await axios.post('https://api.tosspayments.com/v1/payments', paymentData, {
        headers: {
          'Authorization': `Basic ${Buffer.from(this.tossSecretKey + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        paymentUrl: response.data.checkoutUrl,
        paymentData: response.data
      };
    } catch (error: any) {
      console.error('Toss payment creation failed:', error.response?.data);
      throw createError(500, '토스페이 결제 생성에 실패했습니다.');
    }
  }

  /**
   * 카카오 결제 생성
   * @private
   * @param {Payment} payment - 결제 엔티티
   * @returns {Promise<Object>} 결제 URL과 데이터
   * @throws {Error} 카카오페이 결제 생성 실패 시
   */
  private async createKakaoPayment(payment: Payment) {
    const metadata = payment.metadata as any || {};
    const orderId = metadata.externalId || payment.id;
    const itemName = this.getOrderName(payment.type, metadata.packageType);
    
    const paymentData = {
      cid: process.env.KAKAO_CID || 'TC0ONETIME',
      partner_order_id: orderId,
      partner_user_id: payment.userId,
      item_name: itemName,
      quantity: 1,
      total_amount: payment.amount,
      tax_free_amount: 0,
      approval_url: `${process.env.BASE_URL}/payment/kakao/success`,
      cancel_url: `${process.env.BASE_URL}/payment/kakao/cancel`,
      fail_url: `${process.env.BASE_URL}/payment/kakao/fail`
    };

    try {
      const response = await axios.post('https://kapi.kakao.com/v1/payment/ready', paymentData, {
        headers: {
          'Authorization': `KakaoAK ${this.kakaoSecretKey}`,
          'Content-type': 'application/x-www-form-urlencoded;charset=utf-8'
        }
      });

      return {
        paymentUrl: response.data.next_redirect_mobile_url,
        paymentData: response.data
      };
    } catch (error: any) {
      console.error('Kakao payment creation failed:', error.response?.data);
      throw createError(500, '카카오페이 결제 생성에 실패했습니다.');
    }
  }

  private async createGenericPayment(payment: Payment) {
    // For card/bank payments, create a generic payment URL
    const metadata = payment.metadata as any || {};
    const paymentUrl = `${process.env.BASE_URL}/payment/generic/${metadata.externalId || payment.id}`;
    
    return {
      paymentUrl,
      paymentData: {
        paymentId: payment.id,
        externalId: metadata.externalId || payment.id,
        amount: payment.amount,
        currency: payment.currency
      }
    };
  }

  private async processTossPayment(payment: Payment, paymentKey: string) {
    try {
      const metadata = payment.metadata as any || {};
      const response = await axios.post(`https://api.tosspayments.com/v1/payments/${paymentKey}`, {
        orderId: metadata.externalId || payment.id,
        amount: payment.amount
      }, {
        headers: {
          'Authorization': `Basic ${Buffer.from(this.tossSecretKey + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: response.data.status === 'DONE',
        data: response.data,
        error: response.data.status !== 'DONE' ? '결제 승인 실패' : null
      };
    } catch (error: any) {
      console.error('Toss payment processing failed:', error.response?.data);
      return {
        success: false,
        data: error.response?.data,
        error: '토스페이 결제 처리 실패'
      };
    }
  }

  private async processKakaoPayment(payment: Payment, pgToken: string) {
    try {
      const metadata = payment.metadata as any || {};
      const response = await axios.post('https://kapi.kakao.com/v1/payment/approve', {
        cid: process.env.KAKAO_CID || 'TC0ONETIME',
        tid: metadata?.tid,
        partner_order_id: metadata.externalId || payment.id,
        partner_user_id: payment.userId,
        pg_token: pgToken
      }, {
        headers: {
          'Authorization': `KakaoAK ${this.kakaoSecretKey}`,
          'Content-type': 'application/x-www-form-urlencoded;charset=utf-8'
        }
      });

      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error: any) {
      console.error('Kakao payment processing failed:', error.response?.data);
      return {
        success: false,
        data: error.response?.data,
        error: '카카오페이 결제 처리 실패'
      };
    }
  }

  private async processGenericPayment(payment: Payment, data: ProcessPaymentRequest) {
    // For generic payments, simulate processing
    // In production, you'd integrate with actual payment processors
    return {
      success: true,
      data: { method: 'generic', processed: true },
      error: null
    };
  }

  private async verifyTossPayment(externalId: string) {
    try {
      const response = await axios.get(`https://api.tosspayments.com/v1/payments/orders/${externalId}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(this.tossSecretKey + ':').toString('base64')}`
        }
      });

      return {
        verified: response.data.status === 'DONE',
        data: response.data
      };
    } catch (error: any) {
      return {
        verified: false,
        data: error.response?.data
      };
    }
  }

  private async verifyKakaoPayment(externalId: string) {
    // Kakao doesn't have a direct verification endpoint
    // You'd typically store the transaction details and verify against them
    return {
      verified: true,
      data: { orderId: externalId }
    };
  }

  private async refundTossPayment(externalId: string, amount: number, reason: string) {
    try {
      const response = await axios.post(`https://api.tosspayments.com/v1/payments/${externalId}/cancel`, {
        cancelReason: reason,
        cancelAmount: amount
      }, {
        headers: {
          'Authorization': `Basic ${Buffer.from(this.tossSecretKey + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        refundId: response.data.paymentKey,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: '토스페이 환불 처리 실패',
        data: error.response?.data
      };
    }
  }

  private async refundKakaoPayment(externalId: string, amount: number, reason: string) {
    try {
      const response = await axios.post('https://kapi.kakao.com/v1/payment/cancel', {
        cid: process.env.KAKAO_CID || 'TC0ONETIME',
        tid: externalId,
        cancel_amount: amount,
        cancel_tax_free_amount: 0
      }, {
        headers: {
          'Authorization': `KakaoAK ${this.kakaoSecretKey}`,
          'Content-type': 'application/x-www-form-urlencoded;charset=utf-8'
        }
      });

      return {
        success: true,
        refundId: response.data.tid,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: '카카오페이 환불 처리 실패',
        data: error.response?.data
      };
    }
  }

  /**
   * 크레딧 구매 처리
   * @param {Object} data - 구매 데이터
   * @param {string} data.userId - 사용자 ID
   * @param {number} data.amount - 결제 금액
   * @param {number} data.credits - 크레딧 수
   * @param {string} data.paymentMethod - 결제 수단
   * @returns {Promise<Payment>} 생성된 결제
   */
  async createCreditPurchase(data: { userId: string; amount: number; credits: number; paymentMethod: string }) {
    const payment = await prisma.payment.create({
      data: {
        userId: data.userId,
        type: 'LIKE_CREDITS',
        amount: data.amount,
        currency: 'KRW',
        status: 'COMPLETED',
        method: data.paymentMethod as PaymentMethod,
        metadata: {
          credits: data.credits
        }
      }
    });

    return payment;
  }

  /**
   * 프리미엄 구독 생성
   * @param {Object} data - 구독 데이터
   * @param {string} data.userId - 사용자 ID
   * @param {string} data.plan - 구독 플랜
   * @param {string} data.paymentMethod - 결제 수단
   * @returns {Promise<Object>} 생성된 구독
   */
  async createSubscription(data: { userId: string; plan: string; paymentMethod: string }) {
    const amount = data.plan === 'MONTHLY' ? 9900 : 99000;
    const days = data.plan === 'MONTHLY' ? 30 : 365;
    const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const subscription = await prisma.subscription.create({
      data: {
        userId: data.userId,
        plan: data.plan as 'MONTHLY' | 'YEARLY',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: endDate
      }
    });

    await prisma.payment.create({
      data: {
        userId: data.userId,
        type: 'PREMIUM_SUBSCRIPTION',
        amount,
        currency: 'KRW',
        status: 'COMPLETED',
        method: data.paymentMethod as PaymentMethod,
        metadata: {
          subscriptionId: subscription.id,
          plan: data.plan
        }
      }
    });

    return subscription;
  }

  /**
   * 구독 취소
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 취소된 구독
   * @throws {Error} 활성 구독을 찾을 수 없을 때
   */
  async cancelSubscription(userId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE'
      }
    });

    if (!subscription) {
      throw createError(404, '활성 구독을 찾을 수 없습니다.');
    }

    const cancelled = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED'
      }
    });

    return cancelled;
  }

  /**
   * Stripe 웹훅 처리
   * @param {Object} event - Stripe 웹훅 이벤트
   * @returns {Promise<Object>} 처리 결과
   */
  async handleStripeWebhook(event: any) {
    // Handle Stripe webhook events
    switch (event.type) {
      case 'checkout.session.completed':
        // Process the successful payment
        const session = event.data.object;
        console.log('Stripe payment successful:', {
        id: session.id,
        payment_status: session.payment_status,
        amount_total: session.amount_total
      });
        break;
      default:
        console.log('Unhandled Stripe event type:', event.type);
    }

    return { success: true, processed: true };
  }

  /**
   * 토스 웹훅 처리
   * @param {Object} data - 토스 웹훅 데이터
   * @returns {Promise<void>}
   */
  async handleTossWebhook(data: any) {
    const { eventType, data: eventData } = data;

    switch (eventType) {
      case 'PAYMENT_CONFIRMED':
        await this.handlePaymentConfirmed(eventData, 'TOSS');
        break;
      case 'PAYMENT_CANCELED':
        await this.handlePaymentCanceled(eventData, 'TOSS');
        break;
      default:
        console.log('Unhandled Toss webhook event:', eventType);
    }
  }

  /**
   * 카카오 웹훅 처리
   * @param {Object} data - 카카오 웹훅 데이터
   * @returns {Promise<void>}
   */
  async handleKakaoWebhook(data: any) {
    const { eventType, data: eventData } = data;

    switch (eventType) {
      case 'PAYMENT_APPROVED':
        await this.handlePaymentConfirmed(eventData, 'KAKAO');
        break;
      case 'PAYMENT_CANCELED':
        await this.handlePaymentCanceled(eventData, 'KAKAO');
        break;
      default:
        console.log('Unhandled Kakao webhook event:', eventType);
    }
  }

  /**
   * 결제 확인 처리
   * @private
   * @param {Object} data - 결제 데이터
   * @param {'TOSS' | 'KAKAO'} method - 결제 수단
   * @returns {Promise<void>}
   */
  private async handlePaymentConfirmed(data: any, method: 'TOSS' | 'KAKAO') {
    const orderId = method === 'TOSS' ? data.orderId : data.partner_order_id;
    
    // Find payment by external ID in metadata using Prisma's JSON filtering
    const payment = await prisma.payment.findFirst({
      where: {
        AND: [
          { status: 'PENDING' },
          {
            metadata: {
              path: ['externalId'],
              equals: orderId
            }
          }
        ]
      }
    });

    if (payment) {
      // Use transaction to ensure data consistency
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            metadata: {
              ...payment.metadata as object,
              externalData: data
            }
          }
        });

        await this.applyPaymentBenefits(payment);
      });
    } else {
      console.warn(`Payment not found for order ID: ${orderId}`);
    }
  }

  /**
   * 결제 취소 처리
   * @private
   * @param {Object} data - 취소 데이터
   * @param {'TOSS' | 'KAKAO'} method - 결제 수단
   * @returns {Promise<void>}
   */
  private async handlePaymentCanceled(data: any, method: 'TOSS' | 'KAKAO') {
    const orderId = method === 'TOSS' ? data.orderId : data.partner_order_id;
    
    // Find payment by external ID in metadata using Prisma's JSON filtering
    const payment = await prisma.payment.findFirst({
      where: {
        metadata: {
          path: ['externalId'],
          equals: orderId
        }
      }
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          metadata: {
            ...payment.metadata as object,
            cancelData: data
          }
        }
      });
    } else {
      console.warn(`Payment not found for canceled order ID: ${orderId}`);
    }
  }

  /**
   * 결제 혜택 적용
   * @private
   * @param {Payment} payment - 결제 엔티티
   * @returns {Promise<void>}
   */
  private async applyPaymentBenefits(payment: Payment) {
    switch (payment.type) {
      case 'LIKE_CREDITS':
        await this.applyCredits(payment);
        break;
      case 'PREMIUM_SUBSCRIPTION':
        await this.applyPremiumSubscription(payment);
        break;
    }
  }

  /**
   * 크레딧 적용
   * @private
   * @param {Payment} payment - 결제 엔티티
   * @returns {Promise<void>}
   */
  private async applyCredits(payment: Payment) {
    const creditAmounts: Record<string, number> = {
      SMALL: 5,
      MEDIUM: 17, // 15 + 2 bonus
      LARGE: 35,  // 30 + 5 bonus
      XLARGE: 60  // 50 + 10 bonus
    };

    const packageType = (payment.metadata as any)?.packageType;
    const credits = creditAmounts[packageType] || 5;

    await prisma.user.update({
      where: { id: payment.userId },
      data: {
        credits: {
          increment: credits
        }
      }
    });
  }

  /**
   * 프리미엄 구독 적용
   * @private
   * @param {Payment} payment - 결제 엔티티
   * @returns {Promise<void>}
   */
  private async applyPremiumSubscription(payment: Payment) {
    const packageType = (payment.metadata as any)?.packageType;
    const duration = packageType === 'PREMIUM_YEARLY' ? 365 : 30;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + duration);

    // Check for existing active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: payment.userId,
        status: 'ACTIVE'
      }
    });

    if (existingSubscription) {
      // Extend existing subscription
      const newEndDate = new Date(existingSubscription.currentPeriodEnd);
      newEndDate.setDate(newEndDate.getDate() + duration);

      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: { currentPeriodEnd: newEndDate }
      });
    } else {
      // Create new subscription
      await prisma.subscription.create({
        data: {
          userId: payment.userId,
          plan: packageType === 'PREMIUM_YEARLY' ? 'YEARLY' : 'MONTHLY',
          status: 'ACTIVE',
          currentPeriodStart: startDate,
          currentPeriodEnd: endDate
        }
      });
    }

    // Update user premium status
    await prisma.user.update({
      where: { id: payment.userId },
      data: {
        isPremium: true,
        premiumUntil: endDate
      }
    });
  }

  private async reversePaymentBenefits(payment: any) {
    switch (payment.type) {
      case 'LIKE_CREDITS':
        await this.reverseCredits(payment);
        break;
      case 'PREMIUM_SUBSCRIPTION':
        await this.reversePremiumSubscription(payment);
        break;
    }
  }

  private async reverseCredits(payment: any) {
    const creditAmounts: Record<string, number> = {
      SMALL: 5,
      MEDIUM: 17,
      LARGE: 35,
      XLARGE: 60
    };

    const packageType = (payment.metadata as any)?.packageType;
    const credits = creditAmounts[packageType] || 5;

    await prisma.user.update({
      where: { id: payment.userId },
      data: {
        credits: {
          decrement: credits
        }
      }
    });
  }

  private async reversePremiumSubscription(payment: any) {
    // Cancel the subscription immediately
    await prisma.subscription.updateMany({
      where: {
        userId: payment.userId,
        status: 'ACTIVE'
      },
      data: {
        status: 'CANCELLED'
      }
    });

    // Update user premium status
    await prisma.user.update({
      where: { id: payment.userId },
      data: {
        isPremium: false,
        premiumUntil: null
      }
    });
  }

  /**
   * 토스 웹훅 서명 검증
   * @param {string} signature - 서명
   * @param {Object} body - 웹훅 바디
   * @returns {boolean} 검증 결과
   */
  verifyTossWebhook(signature: string, body: any): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(body))
      .digest('base64');
    
    return signature === expectedSignature;
  }

  /**
   * 카카오 웹훅 서명 검증
   * @param {string} signature - 서명
   * @param {Object} body - 웹훅 바디
   * @returns {boolean} 검증 결과
   */
  verifyKakaoWebhook(signature: string, body: any): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(body))
      .digest('base64');
    
    return signature === expectedSignature;
  }

  /**
   * 결제 ID 생성
   * @private
   * @returns {string} 결제 ID
   */
  private generatePaymentId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    return `PAY_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * 주문명 생성
   * @private
   * @param {string} type - 결제 타입
   * @param {string} [packageType] - 패키지 타입
   * @returns {string} 주문명
   */
  private getOrderName(type: string, packageType?: string): string {
    switch (type) {
      case 'LIKE_CREDITS':
        const creditNames: Record<string, string> = {
          SMALL: '라이크 5개',
          MEDIUM: '라이크 15개 + 보너스 2개',
          LARGE: '라이크 30개 + 보너스 5개',
          XLARGE: '라이크 50개 + 보너스 10개'
        };
        return creditNames[packageType || 'SMALL'] || '라이크 구매';
      case 'PREMIUM_SUBSCRIPTION':
        return packageType === 'PREMIUM_YEARLY' ? '글림프스 프리미엄 연간' : '글림프스 프리미엄 월간';
      default:
        return '글림프스 결제';
    }
  }
}

export const paymentService = new PaymentService();
