import { PaymentStatus, PaymentMethod, PaymentType, Payment } from '@prisma/client';
import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { metrics } from '../utils/monitoring';
import { logger } from '../utils/logger';
import * as crypto from 'crypto';

import {
  CreatePaymentRequest,
  ProcessPaymentRequest,
  PaymentProvider,
  PaymentResult,
  RefundRequest
} from './payment/types';

import {
  TossPayProvider,
  KakaoPayProvider,
  StripeProvider
} from './payment/providers';

import { PaymentValidator } from './payment/validators';
import { notificationService } from './NotificationService';

/**
 * 결제 서비스 - 다양한 결제 제공자를 통한 결제 처리 관리
 * @class PaymentService
 */
export class PaymentService {
  /** 결제 제공자 맵 */
  private providers: Map<PaymentMethod, PaymentProvider>;

  /**
   * PaymentService 생성자
   */
  constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  /**
   * 결제 제공자 초기화
   * @private
   * @returns {void}
   */
  private initializeProviders(): void {
    try {
      this.providers.set('TOSS_PAY', new TossPayProvider());
    } catch (error) {
      logger.warn('Failed to initialize TossPay provider', error);
    }

    try {
      this.providers.set('KAKAO_PAY', new KakaoPayProvider());
    } catch (error) {
      logger.warn('Failed to initialize KakaoPay provider', error);
    }

    try {
      const stripeProvider = new StripeProvider();
      this.providers.set('CARD', stripeProvider);
      // Stripe can handle other payment methods too
    } catch (error) {
      logger.warn('Failed to initialize Stripe provider', error);
    }
  }

  /**
   * 결제 생성
   * @param {CreatePaymentRequest} data - 결제 생성 요청 데이터
   * @returns {Promise<PaymentResult>} 결제 결과
   * @throws {Error} 유효성 검사 실패, 지원하지 않는 결제 방법
   */
  async createPayment(data: CreatePaymentRequest): Promise<PaymentResult> {
    const { userId, type, packageType, amount, currency, paymentMethod } = data;

    // Validation
    PaymentValidator.validateAmount(amount, currency);
    PaymentValidator.validatePaymentMethod(paymentMethod, currency);
    PaymentValidator.validatePackageType(type, packageType);

    // Verify amount matches package
    if (packageType) {
      const expectedAmount = PaymentValidator.getPackageAmount(packageType, currency);
      if (amount !== expectedAmount) {
        throw createError(400, '결제 금액이 패키지 가격과 일치하지 않습니다.');
      }
    }

    // Get provider
    const provider = this.providers.get(paymentMethod);
    if (!provider) {
      throw createError(400, '지원하지 않는 결제 방법입니다.');
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

    try {
      // Create payment with provider
      const { paymentUrl, paymentData } = await provider.createPayment(payment);

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

      // Track metrics
      metrics.increment('payment.created', { 
        method: paymentMethod, 
        type: type 
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
    } catch (error) {
      // Update payment status on error
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' }
      });
      throw error;
    }
  }

  /**
   * 결제 처리
   * @param {string} paymentId - 결제 ID
   * @param {string} userId - 사용자 ID
   * @param {ProcessPaymentRequest} data - 결제 처리 요청 데이터
   * @returns {Promise<PaymentResult>} 결제 결과
   * @throws {Error} 결제 정보 없음, 권한 없음, 이미 처리됨, 처리 실패
   */
  async processPayment(paymentId: string, userId: string, data: ProcessPaymentRequest): Promise<PaymentResult> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    });

    if (!payment) {
      throw createError(404, '결제 정보를 찾을 수 없습니다.');
    }

    if (payment.userId !== userId) {
      throw createError(403, '권한이 없습니다.');
    }

    if (payment.status !== 'PENDING') {
      throw createError(400, '이미 처리된 결제입니다.');
    }

    // Get provider
    const provider = this.providers.get(payment.method);
    if (!provider) {
      throw createError(400, '지원하지 않는 결제 방법입니다.');
    }

    try {
      // Verify payment with provider
      const { success, transactionId, errorMessage } = await provider.verifyPayment(payment, data);

      if (success && transactionId) {
        // Update payment status
        const updatedPayment = await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            transactionId,
            completedAt: new Date()
          }
        });

        // Process payment completion
        await this.handlePaymentCompletion(updatedPayment);

        // Track metrics
        metrics.increment('payment.completed', { 
          method: payment.method, 
          type: payment.type 
        });

        return {
          id: updatedPayment.id,
          externalId: (updatedPayment.metadata as any)?.externalId,
          amount: updatedPayment.amount,
          currency: updatedPayment.currency,
          paymentMethod: updatedPayment.method,
          status: updatedPayment.status,
          createdAt: updatedPayment.createdAt
        };
      } else {
        // Update payment as failed
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
            failedReason: errorMessage
          }
        });

        throw createError(400, errorMessage || '결제 처리에 실패했습니다.');
      }
    } catch (error) {
      // Track metrics
      metrics.increment('payment.failed', { 
        method: payment.method, 
        type: payment.type 
      });
      throw error;
    }
  }

  /**
   * 결제 환불
   * @param {RefundRequest} data - 환불 요청 데이터
   * @returns {Promise<Object>} 환불 결과 (성공 여부, 환불 금액, 환불 ID)
   * @throws {Error} 결제 정보 없음, 완료되지 않은 결제, 환불 금액 초과
   */
  async refundPayment(data: RefundRequest): Promise<{
    success: boolean;
    refundAmount: number;
    refundId?: string;
  }> {
    const { paymentId, amount, reason } = data;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    });

    if (!payment) {
      throw createError(404, '결제 정보를 찾을 수 없습니다.');
    }

    if (payment.status !== 'COMPLETED') {
      throw createError(400, '완료된 결제만 환불할 수 있습니다.');
    }

    // Check refund amount
    const refundAmount = amount || payment.amount;
    if (refundAmount > payment.amount) {
      throw createError(400, '환불 금액이 결제 금액보다 클 수 없습니다.');
    }

    // Get provider
    const provider = this.providers.get(payment.method);
    if (!provider) {
      throw createError(400, '지원하지 않는 결제 방법입니다.');
    }

    try {
      // Process refund with provider
      const { success, refundId, errorMessage } = await provider.refundPayment(payment, refundAmount);

      if (success) {
        // Create refund record
        await prisma.refund.create({
          data: {
            paymentId,
            amount: refundAmount,
            reason,
            status: 'COMPLETED',
            refundId,
            refundedAt: new Date()
          }
        });

        // Update payment status
        const newStatus = 'REFUNDED'; // Treat all refunds as full refunds
        await prisma.payment.update({
          where: { id: paymentId },
          data: { status: newStatus }
        });

        // Handle refund completion (revert credits, subscription, etc.)
        await this.handleRefundCompletion(payment, refundAmount);

        // Track metrics
        metrics.increment('payment.refunded', { 
          method: payment.method, 
          type: payment.type,
          partial: refundAmount < payment.amount 
        });

        return {
          success: true,
          refundAmount,
          refundId
        };
      } else {
        throw createError(500, errorMessage || '환불 처리에 실패했습니다.');
      }
    } catch (error) {
      // Track metrics
      metrics.increment('payment.refund_failed', { 
        method: payment.method, 
        type: payment.type 
      });
      throw error;
    }
  }

  /**
   * 웹훅 처리
   * @param {PaymentMethod} provider - 결제 제공자
   * @param {any} data - 웹훅 데이터
   * @param {string} [signature] - 웹훅 서명
   * @returns {Promise<void>}
   * @throws {Error} 잘못된 서명, 알 수 없는 제공자
   */
  async handleWebhook(provider: PaymentMethod, data: any, signature?: string): Promise<void> {
    // Verify webhook signature if provided
    if (signature && !this.verifyWebhookSignature(provider, data, signature)) {
      throw createError(401, 'Invalid webhook signature');
    }

    const providerInstance = this.providers.get(provider);
    if (!providerInstance) {
      throw createError(400, 'Unknown payment provider');
    }

    try {
      const { paymentId, status, transactionId } = await providerInstance.handleWebhook(data);

      // Update payment status
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId }
      });

      if (!payment) {
        logger.error(`Payment not found for webhook: ${paymentId}`);
        return;
      }

      // Only update if status changed
      if (payment.status !== status) {
        const updatedPayment = await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status,
            transactionId: transactionId || payment.transactionId,
            completedAt: status === 'COMPLETED' ? new Date() : undefined,
            failedAt: status === 'FAILED' ? new Date() : undefined
          }
        });

        // Handle status changes
        if (status === 'COMPLETED') {
          await this.handlePaymentCompletion(updatedPayment);
        }
      }

      // Track metrics
      metrics.increment('payment.webhook_processed', { 
        provider, 
        status 
      });
    } catch (error) {
      logger.error('Webhook processing failed:', error);
      metrics.increment('payment.webhook_failed', { provider });
      throw error;
    }
  }

  /**
   * 결제 완료 처리
   * @private
   * @param {Payment} payment - 결제 정보
   * @returns {Promise<void>}
   */
  private async handlePaymentCompletion(payment: Payment): Promise<void> {
    switch (payment.type) {
      case 'LIKE_CREDITS':
        await this.handleCreditPurchase(payment);
        break;
      case 'PREMIUM_SUBSCRIPTION':
        await this.handlePremiumSubscription(payment);
        break;
    }

    // Send notification
    await notificationService.sendPaymentSuccessNotification(
      payment.userId,
      payment.amount,
      payment.currency
    );
  }

  /**
   * 크레딧 구매 처리
   * @private
   * @param {Payment} payment - 결제 정보
   * @returns {Promise<void>}
   */
  private async handleCreditPurchase(payment: Payment): Promise<void> {
    const packageType = (payment.metadata as any)?.packageType;
    const credits = PaymentValidator.getCreditsFromPackage(packageType);

    if (credits > 0) {
      await prisma.user.update({
        where: { id: payment.userId },
        data: {
          credits: { increment: credits }
        }
      });

      logger.info(`Added ${credits} credits to user ${payment.userId}`);
    }
  }

  /**
   * 프리미엄 구독 처리
   * @private
   * @param {Payment} payment - 결제 정보
   * @returns {Promise<void>}
   */
  private async handlePremiumSubscription(payment: Payment): Promise<void> {
    const packageType = (payment.metadata as any)?.packageType;
    let expiresAt: Date;

    switch (packageType) {
      case 'monthly':
        expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarterly':
        expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        break;
      case 'yearly':
        expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    await prisma.user.update({
      where: { id: payment.userId },
      data: {
        isPremium: true,
        premiumExpiresAt: expiresAt
      }
    });

    logger.info(`Activated premium subscription for user ${payment.userId} until ${expiresAt}`);
  }

  /**
   * 환불 완료 처리
   * @private
   * @param {Payment} payment - 결제 정보
   * @param {number} refundAmount - 환불 금액
   * @returns {Promise<void>}
   */
  private async handleRefundCompletion(payment: Payment, refundAmount: number): Promise<void> {
    // Handle based on payment type
    switch (payment.type) {
      case 'LIKE_CREDITS':
        // Calculate credits to remove (proportional to refund amount)
        const packageType = (payment.metadata as any)?.packageType;
        const totalCredits = PaymentValidator.getCreditsFromPackage(packageType);
        const creditsToRemove = Math.floor(totalCredits * (refundAmount / payment.amount));
        
        if (creditsToRemove > 0) {
          await prisma.user.update({
            where: { id: payment.userId },
            data: {
              credits: { decrement: creditsToRemove }
            }
          });
        }
        break;

      case 'PREMIUM_SUBSCRIPTION':
        // Cancel premium subscription if full refund
        if (refundAmount === payment.amount) {
          await prisma.user.update({
            where: { id: payment.userId },
            data: {
              isPremium: false,
              premiumExpiresAt: null
            }
          });
        }
        break;
    }

    // Send refund notification
    await notificationService.sendRefundNotification(
      payment.userId,
      refundAmount,
      payment.currency
    );
  }

  /**
   * 결제 ID 생성
   * @private
   * @returns {string} 생성된 결제 ID
   */
  private generatePaymentId(): string {
    return `PAY_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }

  /**
   * 웹훅 서명 검증
   * @private
   * @param {PaymentMethod} provider - 결제 제공자
   * @param {any} data - 웹훅 데이터
   * @param {string} signature - 서명
   * @returns {boolean} 검증 성공 여부
   */
  private verifyWebhookSignature(provider: PaymentMethod, data: any, signature: string): boolean {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (!secret) {
      logger.warn('Webhook secret not configured');
      return true; // Allow in development
    }

    // Different providers have different signature methods
    switch (provider) {
      case 'TOSS_PAY':
        // TossPay uses HMAC-SHA256
        const expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(JSON.stringify(data))
          .digest('hex');
        return signature === expectedSignature;

      case 'KAKAO_PAY':
        // KakaoPay doesn't use webhook signatures
        return true;

      case 'CARD':
        // Stripe webhook verification is handled by Stripe SDK
        return true;

      default:
        return false;
    }
  }

  /**
   * 사용자 결제 내역 조회
   * @param {string} userId - 사용자 ID
   * @param {number} [limit=20] - 조회 개수 제한
   * @param {number} [offset=0] - 오프셋
   * @returns {Promise<Payment[]>} 결제 내역
   */
  async getUserPaymentHistory(userId: string, limit: number = 20, offset: number = 0): Promise<Payment[]> {
    return await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
  }

  /**
   * 사용자 결제 통계 조회
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 결제 통계 (총 지출, 총 크레딧, 프리미엄 여부, 마지막 결제)
   */
  async getPaymentStatistics(userId: string): Promise<{
    totalSpent: number;
    totalCredits: number;
    isPremium: boolean;
    lastPayment?: Date;
  }> {
    const [payments, user] = await Promise.all([
      prisma.payment.findMany({
        where: {
          userId,
          status: 'COMPLETED'
        }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          credits: true,
          isPremium: true
        }
      })
    ]);

    const totalSpent = payments.reduce((sum, payment) => {
      return sum + (payment.currency === 'KRW' ? payment.amount : payment.amount * 1300);
    }, 0);

    const lastPayment = payments.length > 0 
      ? payments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
      : undefined;

    return {
      totalSpent,
      totalCredits: user?.credits || 0,
      isPremium: user?.isPremium || false,
      lastPayment
    };
  }
}

export const paymentService = new PaymentService();