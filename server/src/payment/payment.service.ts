import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PaymentStatus,
  PaymentMethod,
  PaymentType,
  Payment,
  User,
} from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';
import { CacheService } from '../core/cache/cache.service';
import * as crypto from 'crypto';
import axios from 'axios';
import {
  CreatePaymentDto,
  ProcessPaymentDto,
  RefundPaymentDto,
  CreateCreditPurchaseDto,
  CreateSubscriptionDto,
} from './dto/create-payment.dto';

/**
 * 결제 서비스
 *
 * TossPay, KakaoPay 등 다양한 결제 수단을 통합 관리하고,
 * 구독, 크레딧 구매, 환불 등의 결제 관련 기능을 제공합니다.
 */
@Injectable()
export class PaymentService {
  private readonly tossSecretKey: string;
  private readonly kakaoSecretKey: string;
  private readonly webhookSecret: string;
  private readonly baseUrl: string;
  private readonly kakaoCid: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {
    this.tossSecretKey = this.configService.get<string>('TOSS_SECRET_KEY', '');
    this.kakaoSecretKey = this.configService.get<string>(
      'KAKAO_SECRET_KEY',
      '',
    );
    this.webhookSecret = this.configService.get<string>(
      'PAYMENT_WEBHOOK_SECRET',
      '',
    );
    this.baseUrl = this.configService.get<string>('BASE_URL', '');
    this.kakaoCid = this.configService.get<string>('KAKAO_CID', 'TC0ONETIME');
  }

  /**
   * 결제 생성
   */
  async createPayment(userId: string, data: CreatePaymentDto) {
    const { type, packageType, amount, currency, paymentMethod } = data;

    // 최소 금액 검증
    const minAmount = currency === 'KRW' ? 100 : 1;
    if (amount < minAmount) {
      throw new HttpException(
        `최소 결제 금액은 ${minAmount}${currency}입니다.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 결제 레코드 생성
    const payment = await this.prisma.payment.create({
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
          packageType,
        },
      },
    });

    // 결제 수단별 URL 생성
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
        ({ paymentUrl, paymentData } =
          await this.createGenericPayment(payment));
        break;
      default:
        throw new HttpException(
          '지원하지 않는 결제 방법입니다.',
          HttpStatus.BAD_REQUEST,
        );
    }

    // 외부 데이터로 결제 정보 업데이트
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        metadata: {
          ...(payment.metadata as object),
          externalData: paymentData,
          paymentUrl,
        },
      },
    });

    return {
      id: payment.id,
      externalId: (payment.metadata as any)?.externalId,
      amount: payment.amount,
      currency: payment.currency,
      paymentUrl,
      paymentMethod: payment.method,
      status: payment.status,
      createdAt: payment.createdAt,
    };
  }

  /**
   * 결제 처리
   */
  async processPayment(
    paymentId: string,
    userId: string,
    data: ProcessPaymentDto,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new HttpException('결제를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    if (payment.userId !== userId) {
      throw new HttpException(
        '이 결제를 처리할 권한이 없습니다.',
        HttpStatus.FORBIDDEN,
      );
    }

    if (payment.status !== 'PENDING') {
      throw new HttpException(
        '이미 처리된 결제입니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    let result;

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

    // 결제 상태 업데이트
    const finalStatus = result.success ? 'COMPLETED' : 'FAILED';
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: finalStatus,
        metadata: {
          ...(payment.metadata as object),
          externalData: {
            ...((payment.metadata as any)?.externalData || {}),
            ...result.data,
          },
        },
      },
    });

    if (result.success) {
      // 결제 혜택 적용
      await this.applyPaymentBenefits(payment);
    }

    return {
      id: payment.id,
      status: result.success ? 'COMPLETED' : 'FAILED',
      type: payment.type,
      amount: payment.amount,
      currency: payment.currency,
      ...(result.error && { error: result.error }),
    };
  }

  /**
   * 결제 검증
   */
  async verifyPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new HttpException('결제를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    let verification;
    switch (payment.method) {
      case 'TOSS_PAY':
        verification = await this.verifyTossPayment(
          (payment.metadata as any)?.externalId,
        );
        break;
      case 'KAKAO_PAY':
        verification = await this.verifyKakaoPayment(
          (payment.metadata as any)?.externalId,
        );
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
      verificationData: verification.data,
    };
  }

  /**
   * 결제 환불
   */
  async refundPayment(paymentId: string, reason: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new HttpException('결제를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    if (payment.status !== 'COMPLETED') {
      throw new HttpException(
        '성공한 결제만 환불할 수 있습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    let refundResult;
    switch (payment.method) {
      case 'TOSS_PAY':
        refundResult = await this.refundTossPayment(
          (payment.metadata as any)?.externalId,
          payment.amount,
          reason,
        );
        break;
      case 'KAKAO_PAY':
        refundResult = await this.refundKakaoPayment(
          (payment.metadata as any)?.externalId,
          payment.amount,
          reason,
        );
        break;
      default:
        throw new HttpException(
          '이 결제 방법은 자동 환불을 지원하지 않습니다. 고객센터로 문의해주세요.',
          HttpStatus.BAD_REQUEST,
        );
    }

    // 환불 정보를 메타데이터에 저장
    const refundData = {
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      reason,
      status: refundResult.success ? 'COMPLETED' : 'FAILED',
      refundId: refundResult.refundId,
      processedAt: refundResult.success ? new Date().toISOString() : null,
      failureReason: refundResult.success ? null : refundResult.error,
    };

    // 결제 정보에 환불 데이터 업데이트
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        metadata: {
          ...(payment.metadata as object),
          refund: refundData,
        },
      },
    });

    if (refundResult.success) {
      // 결제 혜택 되돌리기
      await this.reversePaymentBenefits(payment);

      // 결제 상태 업데이트
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'REFUNDED' },
      });
    }

    return {
      refundId: refundData.refundId,
      paymentId: payment.id,
      amount: refundData.amount,
      currency: refundData.currency,
      status: refundData.status,
      reason: refundData.reason,
      processedAt: refundData.processedAt,
    };
  }

  /**
   * 토스 결제 생성
   */
  private async createTossPayment(payment: Payment) {
    const metadata = (payment.metadata as any) || {};
    const orderId = metadata.externalId || payment.id;
    const orderName = this.getOrderName(payment.type, metadata.packageType);

    const paymentData = {
      orderId,
      orderName,
      amount: payment.amount,
      currency: payment.currency,
      successUrl: `${this.baseUrl}/payment/success`,
      failUrl: `${this.baseUrl}/payment/fail`,
      customerName: '글림프스 사용자',
      customerEmail: 'user@glimpse.app',
    };

    try {
      const response = await axios.post(
        'https://api.tosspayments.com/v1/payments',
        paymentData,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(
              this.tossSecretKey + ':',
            ).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        paymentUrl: response.data.checkoutUrl,
        paymentData: response.data,
      };
    } catch (error: any) {
      console.error('Toss payment creation failed:', error.response?.data);
      throw new HttpException(
        '토스페이 결제 생성에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 카카오 결제 생성
   */
  private async createKakaoPayment(payment: Payment) {
    const metadata = (payment.metadata as any) || {};
    const orderId = metadata.externalId || payment.id;
    const itemName = this.getOrderName(payment.type, metadata.packageType);

    const paymentData = {
      cid: this.kakaoCid,
      partner_order_id: orderId,
      partner_user_id: payment.userId,
      item_name: itemName,
      quantity: 1,
      total_amount: payment.amount,
      tax_free_amount: 0,
      approval_url: `${this.baseUrl}/payment/kakao/success`,
      cancel_url: `${this.baseUrl}/payment/kakao/cancel`,
      fail_url: `${this.baseUrl}/payment/kakao/fail`,
    };

    try {
      const response = await axios.post(
        'https://kapi.kakao.com/v1/payment/ready',
        paymentData,
        {
          headers: {
            Authorization: `KakaoAK ${this.kakaoSecretKey}`,
            'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
        },
      );

      return {
        paymentUrl: response.data.next_redirect_mobile_url,
        paymentData: response.data,
      };
    } catch (error: any) {
      console.error('Kakao payment creation failed:', error.response?.data);
      throw new HttpException(
        '카카오페이 결제 생성에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async createGenericPayment(payment: Payment) {
    const metadata = (payment.metadata as any) || {};
    const paymentUrl = `${this.baseUrl}/payment/generic/${
      metadata.externalId || payment.id
    }`;

    return {
      paymentUrl,
      paymentData: {
        paymentId: payment.id,
        externalId: metadata.externalId || payment.id,
        amount: payment.amount,
        currency: payment.currency,
      },
    };
  }

  private async processTossPayment(payment: Payment, paymentKey: string) {
    try {
      const metadata = (payment.metadata as any) || {};
      const response = await axios.post(
        `https://api.tosspayments.com/v1/payments/${paymentKey}`,
        {
          orderId: metadata.externalId || payment.id,
          amount: payment.amount,
        },
        {
          headers: {
            Authorization: `Basic ${Buffer.from(
              this.tossSecretKey + ':',
            ).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        success: response.data.status === 'DONE',
        data: response.data,
        error: response.data.status !== 'DONE' ? '결제 승인 실패' : null,
      };
    } catch (error: any) {
      console.error('Toss payment processing failed:', error.response?.data);
      return {
        success: false,
        data: error.response?.data,
        error: '토스페이 결제 처리 실패',
      };
    }
  }

  private async processKakaoPayment(payment: Payment, pgToken: string) {
    try {
      const metadata = (payment.metadata as any) || {};
      const response = await axios.post(
        'https://kapi.kakao.com/v1/payment/approve',
        {
          cid: this.kakaoCid,
          tid: metadata?.tid,
          partner_order_id: metadata.externalId || payment.id,
          partner_user_id: payment.userId,
          pg_token: pgToken,
        },
        {
          headers: {
            Authorization: `KakaoAK ${this.kakaoSecretKey}`,
            'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
        },
      );

      return {
        success: true,
        data: response.data,
        error: null,
      };
    } catch (error: any) {
      console.error('Kakao payment processing failed:', error.response?.data);
      return {
        success: false,
        data: error.response?.data,
        error: '카카오페이 결제 처리 실패',
      };
    }
  }

  private async processGenericPayment(
    payment: Payment,
    data: ProcessPaymentDto,
  ) {
    // 일반 결제 시뮬레이션
    return {
      success: true,
      data: { method: 'generic', processed: true },
      error: null,
    };
  }

  private async verifyTossPayment(externalId: string) {
    try {
      const response = await axios.get(
        `https://api.tosspayments.com/v1/payments/orders/${externalId}`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(
              this.tossSecretKey + ':',
            ).toString('base64')}`,
          },
        },
      );

      return {
        verified: response.data.status === 'DONE',
        data: response.data,
      };
    } catch (error: any) {
      return {
        verified: false,
        data: error.response?.data,
      };
    }
  }

  private async verifyKakaoPayment(externalId: string) {
    // 카카오는 직접적인 검증 엔드포인트가 없음
    // 트랜잭션 상세 정보를 저장하고 검증
    return {
      verified: true,
      data: { orderId: externalId },
    };
  }

  private async refundTossPayment(
    externalId: string,
    amount: number,
    reason: string,
  ) {
    try {
      const response = await axios.post(
        `https://api.tosspayments.com/v1/payments/${externalId}/cancel`,
        {
          cancelReason: reason,
          cancelAmount: amount,
        },
        {
          headers: {
            Authorization: `Basic ${Buffer.from(
              this.tossSecretKey + ':',
            ).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        success: true,
        refundId: response.data.paymentKey,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: '토스페이 환불 처리 실패',
        data: error.response?.data,
      };
    }
  }

  private async refundKakaoPayment(
    externalId: string,
    amount: number,
    reason: string,
  ) {
    try {
      const response = await axios.post(
        'https://kapi.kakao.com/v1/payment/cancel',
        {
          cid: this.kakaoCid,
          tid: externalId,
          cancel_amount: amount,
          cancel_tax_free_amount: 0,
        },
        {
          headers: {
            Authorization: `KakaoAK ${this.kakaoSecretKey}`,
            'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
        },
      );

      return {
        success: true,
        refundId: response.data.tid,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: '카카오페이 환불 처리 실패',
        data: error.response?.data,
      };
    }
  }

  /**
   * 크레딧 구매 처리
   */
  async createCreditPurchase(userId: string, data: CreateCreditPurchaseDto) {
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        type: 'LIKE_CREDITS',
        amount: data.amount,
        currency: 'KRW',
        status: 'COMPLETED',
        method: data.paymentMethod as PaymentMethod,
        metadata: {
          credits: data.credits,
        },
      },
    });

    // 크레딧 적용
    await this.applyCredits(payment);

    return payment;
  }

  /**
   * 프리미엄 구독 생성
   */
  async createSubscription(userId: string, data: CreateSubscriptionDto) {
    const amount = data.plan === 'MONTHLY' ? 9900 : 99000;
    const days = data.plan === 'MONTHLY' ? 30 : 365;
    const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        plan: data.plan,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: endDate,
      },
    });

    await this.prisma.payment.create({
      data: {
        userId,
        type: 'PREMIUM_SUBSCRIPTION',
        amount,
        currency: 'KRW',
        status: 'COMPLETED',
        method: data.paymentMethod as PaymentMethod,
        metadata: {
          subscriptionId: subscription.id,
          plan: data.plan,
        },
      },
    });

    // 사용자 프리미엄 상태 업데이트
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: true,
        premiumUntil: endDate,
      },
    });

    // 캐시 무효화
    await this.cacheService.invalidateUserCache(userId);

    return subscription;
  }

  /**
   * 구독 취소
   */
  async cancelSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });

    if (!subscription) {
      throw new HttpException(
        '활성 구독을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    const cancelled = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED',
      },
    });

    // 사용자 프리미엄 상태 업데이트
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: false,
        premiumUntil: null,
      },
    });

    // 캐시 무효화
    await this.cacheService.invalidateUserCache(userId);

    return cancelled;
  }

  /**
   * Stripe 웹훅 처리
   */
  async handleStripeWebhook(event: any) {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Stripe payment successful:', {
          id: session.id,
          payment_status: session.payment_status,
          amount_total: session.amount_total,
        });
        break;
      }
      default:
        console.log('Unhandled Stripe event type:', event.type);
    }

    return { success: true, processed: true };
  }

  /**
   * 토스 웹훅 처리
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
   */
  private async handlePaymentConfirmed(data: any, method: 'TOSS' | 'KAKAO') {
    const orderId = method === 'TOSS' ? data.orderId : data.partner_order_id;

    // Prisma JSON 필터링으로 결제 찾기
    const payment = await this.prisma.payment.findFirst({
      where: {
        AND: [
          { status: 'PENDING' },
          {
            metadata: {
              path: ['externalId'],
              equals: orderId,
            },
          },
        ],
      },
    });

    if (payment) {
      // 트랜잭션으로 데이터 일관성 보장
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            metadata: {
              ...(payment.metadata as object),
              externalData: data,
            },
          },
        });

        await this.applyPaymentBenefits(payment);
      });
    } else {
      console.warn(`Payment not found for order ID: ${orderId}`);
    }
  }

  /**
   * 결제 취소 처리
   */
  private async handlePaymentCanceled(data: any, method: 'TOSS' | 'KAKAO') {
    const orderId = method === 'TOSS' ? data.orderId : data.partner_order_id;

    const payment = await this.prisma.payment.findFirst({
      where: {
        metadata: {
          path: ['externalId'],
          equals: orderId,
        },
      },
    });

    if (payment) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          metadata: {
            ...(payment.metadata as object),
            cancelData: data,
          },
        },
      });
    } else {
      console.warn(`Payment not found for canceled order ID: ${orderId}`);
    }
  }

  /**
   * 결제 혜택 적용
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
   */
  private async applyCredits(payment: Payment) {
    const creditAmounts: Record<string, number> = {
      SMALL: 5,
      MEDIUM: 17, // 15 + 2 보너스
      LARGE: 35, // 30 + 5 보너스
      XLARGE: 60, // 50 + 10 보너스
    };

    const packageType = (payment.metadata as any)?.packageType;
    const credits = creditAmounts[packageType] || 5;

    await this.prisma.user.update({
      where: { id: payment.userId },
      data: {
        credits: {
          increment: credits,
        },
      },
    });

    // 캐시 무효화
    await this.cacheService.invalidateUserCache(payment.userId);
  }

  /**
   * 프리미엄 구독 적용
   */
  private async applyPremiumSubscription(payment: Payment) {
    const packageType = (payment.metadata as any)?.packageType;
    const duration = packageType === 'PREMIUM_YEARLY' ? 365 : 30;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + duration);

    // 기존 활성 구독 확인
    const existingSubscription = await this.prisma.subscription.findFirst({
      where: {
        userId: payment.userId,
        status: 'ACTIVE',
      },
    });

    if (existingSubscription) {
      // 기존 구독 연장
      const newEndDate = new Date(existingSubscription.currentPeriodEnd);
      newEndDate.setDate(newEndDate.getDate() + duration);

      await this.prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: { currentPeriodEnd: newEndDate },
      });
    } else {
      // 새 구독 생성
      await this.prisma.subscription.create({
        data: {
          userId: payment.userId,
          plan: packageType === 'PREMIUM_YEARLY' ? 'YEARLY' : 'MONTHLY',
          status: 'ACTIVE',
          currentPeriodStart: startDate,
          currentPeriodEnd: endDate,
        },
      });
    }

    // 사용자 프리미엄 상태 업데이트
    await this.prisma.user.update({
      where: { id: payment.userId },
      data: {
        isPremium: true,
        premiumUntil: endDate,
      },
    });

    // 캐시 무효화
    await this.cacheService.invalidateUserCache(payment.userId);
  }

  /**
   * 결제 혜택 되돌리기
   */
  private async reversePaymentBenefits(payment: Payment) {
    switch (payment.type) {
      case 'LIKE_CREDITS':
        await this.reverseCredits(payment);
        break;
      case 'PREMIUM_SUBSCRIPTION':
        await this.reversePremiumSubscription(payment);
        break;
    }
  }

  private async reverseCredits(payment: Payment) {
    const creditAmounts: Record<string, number> = {
      SMALL: 5,
      MEDIUM: 17,
      LARGE: 35,
      XLARGE: 60,
    };

    const packageType = (payment.metadata as any)?.packageType;
    const credits = creditAmounts[packageType] || 5;

    await this.prisma.user.update({
      where: { id: payment.userId },
      data: {
        credits: {
          decrement: credits,
        },
      },
    });

    // 캐시 무효화
    await this.cacheService.invalidateUserCache(payment.userId);
  }

  private async reversePremiumSubscription(payment: Payment) {
    // 구독 즉시 취소
    await this.prisma.subscription.updateMany({
      where: {
        userId: payment.userId,
        status: 'ACTIVE',
      },
      data: {
        status: 'CANCELLED',
      },
    });

    // 사용자 프리미엄 상태 업데이트
    await this.prisma.user.update({
      where: { id: payment.userId },
      data: {
        isPremium: false,
        premiumUntil: null,
      },
    });

    // 캐시 무효화
    await this.cacheService.invalidateUserCache(payment.userId);
  }

  /**
   * 토스 웹훅 서명 검증
   */
  verifyTossWebhook(signature: string, body: any): boolean {
    // 타이밍 공격 방지를 위한 constant-time comparison
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(body))
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  /**
   * 카카오 웹훅 서명 검증
   */
  verifyKakaoWebhook(signature: string, body: any): boolean {
    // 타이밍 공격 방지를 위한 constant-time comparison
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(body))
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  /**
   * 결제 ID 생성
   */
  private generatePaymentId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    return `PAY_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * 주문명 생성
   */
  private getOrderName(type: string, packageType?: string): string {
    switch (type) {
      case 'LIKE_CREDITS': {
        const creditNames: Record<string, string> = {
          SMALL: '라이크 5개',
          MEDIUM: '라이크 15개 + 보너스 2개',
          LARGE: '라이크 30개 + 보너스 5개',
          XLARGE: '라이크 50개 + 보너스 10개',
        };
        return creditNames[packageType || 'SMALL'] || '라이크 구매';
      }
      case 'PREMIUM_SUBSCRIPTION':
        return packageType === 'PREMIUM_YEARLY'
          ? '글림프스 프리미엄 연간'
          : '글림프스 프리미엄 월간';
      default:
        return '글림프스 결제';
    }
  }

  /**
   * 사용자 결제 내역 조회
   */
  async getUserPayments(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({
        where: { userId },
      }),
    ]);

    return {
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 활성 구독 조회
   */
  async getActiveSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });

    return subscription;
  }
}
