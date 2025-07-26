import { Response, NextFunction } from 'express';
import { PaymentType, PaymentStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { ClerkAuthRequest } from '../middleware/clerkAuth';
import { createError } from '../middleware/errorHandler';
import { paymentService } from '../services/PaymentService';
import { notificationService } from '../services/NotificationService';

export class PaymentController {
  async purchaseCredits(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const userId = req.auth.userId;
      const { package: creditPackage, paymentMethod } = req.body;

      if (!creditPackage || !paymentMethod) {
        throw createError(400, '크레딧 패키지와 결제 방법이 필요합니다.');
      }

      const packages: Record<string, { credits: number; amount: number }> = {
        SMALL: { credits: 5, amount: 2500 },
        MEDIUM: { credits: 17, amount: 6900 },
        LARGE: { credits: 35, amount: 12900 },
        XLARGE: { credits: 60, amount: 19000 }
      };

      if (!packages[creditPackage]) {
        throw createError(400, '유효하지 않은 크레딧 패키지입니다.');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw createError(404, '사용자를 찾을 수 없습니다.');
      }

      const { credits, amount } = packages[creditPackage];
      
      const payment = await paymentService.createCreditPurchase({
        userId,
        amount,
        credits,
        paymentMethod
      });

      await prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: credits } }
      });

      await notificationService.sendPurchaseNotification(userId, credits, amount);

      res.json({
        success: true,
        data: {
          paymentId: payment.id,
          newCreditBalance: user.credits + credits,
          message: '크레딧 구매가 완료되었습니다.'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async subscribePremium(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const userId = req.auth.userId;
      const { plan, paymentMethod } = req.body;

      if (!plan || !paymentMethod) {
        throw createError(400, '구독 플랜과 결제 방법이 필요합니다.');
      }

      if (!['MONTHLY', 'YEARLY'].includes(plan)) {
        throw createError(400, '유효하지 않은 구독 플랜입니다.');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw createError(404, '사용자를 찾을 수 없습니다.');
      }

      if (user.isPremium) {
        throw createError(400, '이미 프리미엄 구독 중입니다.');
      }

      const subscription = await paymentService.createSubscription({
        userId,
        plan,
        paymentMethod
      });

      const days = plan === 'MONTHLY' ? 30 : 365;
      const premiumUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: userId },
        data: {
          isPremium: true,
          premiumUntil
        }
      });

      await notificationService.sendSubscriptionNotification(userId, plan);

      res.json({
        success: true,
        data: {
          subscriptionId: subscription.id,
          premiumUntil,
          message: '프리미엄 구독이 시작되었습니다.'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelPremium(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const userId = req.auth.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw createError(404, '사용자를 찾을 수 없습니다.');
      }

      if (!user.isPremium) {
        throw createError(400, '프리미엄 구독 중이 아닙니다.');
      }

      await paymentService.cancelSubscription(userId);

      res.json({
        success: true,
        data: {
          message: '프리미엄 구독이 취소되었습니다.'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getSubscriptionStatus(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const userId = req.auth.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          isPremium: true,
          premiumUntil: true
        }
      });

      if (!user) {
        throw createError(404, '사용자를 찾을 수 없습니다.');
      }

      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: { in: ['ACTIVE', 'CANCELLED'] }
        },
        orderBy: { createdAt: 'desc' }
      });

      const daysRemaining = user.premiumUntil 
        ? Math.ceil((user.premiumUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;

      res.json({
        success: true,
        data: {
          isActive: user.isPremium,
          premiumUntil: user.premiumUntil,
          daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
          subscription: subscription ? {
            id: subscription.id,
            plan: subscription.plan,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            nextBillingDate: subscription.status === 'ACTIVE' ? subscription.currentPeriodEnd : null
          } : null
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async handleStripeWebhook(req: any, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['stripe-signature'];
      const event = req.body;

      await paymentService.handleStripeWebhook(event);

      res.json({ received: true });
    } catch (error) {
      next(error);
    }
  }

  async handleTossPayWebhook(req: any, res: Response, next: NextFunction) {
    try {
      const body = req.body;

      await paymentService.handleTossWebhook(body);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async handleKakaoPayWebhook(req: any, res: Response, next: NextFunction) {
    try {
      const body = req.body;

      await paymentService.handleKakaoWebhook(body);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async createPayment(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const userId = req.auth.userId;
      const { type, amount, currency = 'KRW', paymentMethod = 'TOSS' } = req.body;

      if (!type || !amount) {
        throw createError(400, '결제 유형과 금액이 필요합니다.');
      }

      const validTypes = ['LIKE_CREDITS', 'PREMIUM_SUBSCRIPTION'];
      if (!validTypes.includes(type)) {
        throw createError(400, '유효하지 않은 결제 유형입니다.');
      }

      const payment = await paymentService.createPayment({
        userId,
        type: type as PaymentType,
        amount,
        currency,
        paymentMethod
      });

      res.json({
        success: true,
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }

  async processPayment(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const { paymentId } = req.params;
      const { paymentToken, paymentKey } = req.body;
      const userId = req.auth.userId;
      
      if (!paymentId) {
        throw createError(400, '결제 ID가 필요합니다.');
      }

      if (!paymentToken && !paymentKey) {
        throw createError(400, '결제 토큰 또는 결제 키가 필요합니다.');
      }

      const result = await paymentService.processPayment(paymentId, userId, {
        paymentToken,
        paymentKey
      });

      // Send success notification
      let creditsAmount: number | undefined;
      if (result.type === PaymentType.LIKE_CREDITS) {
        // Calculate credits from amount (assuming standard pricing)
        creditsAmount = Math.floor(result.amount / 500); // Adjust based on your pricing logic
      }
      
      await notificationService.sendPaymentSuccessNotification(
        userId, 
        result.amount, 
        result.type === PaymentType.PREMIUM_SUBSCRIPTION ? 'PREMIUM' : 'CREDITS',
        creditsAmount
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentHistory(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const userId = req.auth.userId;
      const { page = 1, limit = 20, type } = req.query;

      const payments = await prisma.payment.findMany({
        where: {
          userId,
          ...(type && { type: type as PaymentType })
        },
        select: {
          id: true,
          type: true,
          amount: true,
          currency: true,
          status: true,
          method: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string)
      });

      const totalPayments = await prisma.payment.count({
        where: {
          userId,
          ...(type && { type: type as PaymentType })
        }
      });

      res.json({
        success: true,
        data: {
          payments,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: totalPayments,
            totalPages: Math.ceil(totalPayments / parseInt(limit as string))
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentSubscription(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const userId = req.auth.userId;

      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE'
        },
        select: {
          id: true,
          plan: true,
          status: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          createdAt: true
        }
      });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          credits: true,
          isPremium: true,
          premiumUntil: true
        }
      });

      res.json({
        success: true,
        data: {
          subscription,
          credits: user?.credits || 0,
          isPremium: user?.isPremium || false,
          premiumUntil: user?.premiumUntil
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelSubscription(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const userId = req.auth.userId;

      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE'
        }
      });

      if (!subscription) {
        throw createError(404, '활성 구독을 찾을 수 없습니다.');
      }

      // Cancel the subscription but keep it active until the end date
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date()
        }
      });

      // Send cancellation notification
      await notificationService.sendSubscriptionCancelledNotification(userId, subscription.currentPeriodEnd);

      res.json({
        success: true,
        data: {
          message: '구독이 취소되었습니다. 구독 만료일까지 프리미엄 혜택을 이용할 수 있습니다.',
          expiresAt: subscription.currentPeriodEnd
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyPayment(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const { paymentId } = req.params;
      const userId = req.auth.userId;
      
      if (!paymentId) {
        throw createError(400, '결제 ID가 필요합니다.');
      }

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          user: {
            select: { id: true, nickname: true }
          }
        }
      });

      if (!payment) {
        throw createError(404, '결제를 찾을 수 없습니다.');
      }

      if (payment.userId !== userId) {
        throw createError(403, '이 결제를 확인할 권한이 없습니다.');
      }

      const verification = await paymentService.verifyPayment(paymentId);

      res.json({
        success: true,
        data: verification
      });
    } catch (error) {
      next(error);
    }
  }

  async refundPayment(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw createError(401, '인증이 필요합니다.');
      }

      const { paymentId } = req.params;
      const { reason } = req.body;
      const userId = req.auth.userId;
      
      if (!paymentId) {
        throw createError(400, '결제 ID가 필요합니다.');
      }

      if (!reason) {
        throw createError(400, '환불 사유가 필요합니다.');
      }

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId }
      });

      if (!payment) {
        throw createError(404, '결제를 찾을 수 없습니다.');
      }

      if (payment.userId !== userId) {
        throw createError(403, '이 결제를 환불할 권한이 없습니다.');
      }

      if (payment.status !== PaymentStatus.COMPLETED) {
        throw createError(400, '완료된 결제만 환불할 수 있습니다.');
      }

      // Check refund eligibility (within 7 days for digital goods)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      if (payment.createdAt < sevenDaysAgo) {
        throw createError(400, '결제 후 7일이 지난 건은 환불할 수 없습니다.');
      }

      const refund = await paymentService.refundPayment(paymentId, reason);

      // Create refund notification (using a generic notification since sendRefundNotification doesn't exist)
      await prisma.notification.create({
        data: {
          userId,
          type: 'VERIFICATION_APPROVED', // Using existing enum value temporarily for refund notifications
          title: '환불 완료',
          message: `₩${refund.amount.toLocaleString()} 환불이 완료되었습니다.`,
          data: {
            amount: refund.amount,
            paymentId,
            reason
          }
        }
      });

      res.json({
        success: true,
        data: refund
      });
    } catch (error) {
      next(error);
    }
  }

  async webhookToss(req: any, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['toss-signature'] as string;
      const body = req.body;

      // Verify webhook signature
      if (!paymentService.verifyTossWebhook(signature, body)) {
        throw createError(401, '유효하지 않은 웹훅 서명입니다.');
      }

      await paymentService.handleTossWebhook(body);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async webhookKakao(req: any, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['kakao-signature'] as string;
      const body = req.body;

      // Verify webhook signature
      if (!paymentService.verifyKakaoWebhook(signature, body)) {
        throw createError(401, '유효하지 않은 웹훅 서명입니다.');
      }

      await paymentService.handleKakaoWebhook(body);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentMethods(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const paymentMethods = [
        {
          id: 'TOSS',
          name: '토스페이',
          description: '간편하고 안전한 토스페이',
          logo: '/images/toss-logo.png',
          enabled: true,
          fees: {
            credit: 2.9,
            bank: 1.0
          }
        },
        {
          id: 'KAKAO',
          name: '카카오페이',
          description: '카카오톡으로 간편 결제',
          logo: '/images/kakao-logo.png',
          enabled: true,
          fees: {
            credit: 2.9,
            bank: 1.0
          }
        },
        {
          id: 'CARD',
          name: '신용/체크카드',
          description: '모든 카드 결제 가능',
          logo: '/images/card-logo.png',
          enabled: true,
          fees: {
            credit: 3.5,
            debit: 1.5
          }
        },
        {
          id: 'BANK',
          name: '계좌이체',
          description: '실시간 계좌이체',
          logo: '/images/bank-logo.png',
          enabled: true,
          fees: {
            transfer: 500
          }
        }
      ];

      res.json({
        success: true,
        data: paymentMethods
      });
    } catch (error) {
      next(error);
    }
  }

  async getPricingPackages(req: ClerkAuthRequest, res: Response, next: NextFunction) {
    try {
      const packages = [
        // Credit packages
        {
          type: 'LIKE_CREDITS',
          name: '라이크 5개',
          description: '5번의 좋아요 기회',
          price: 2500,
          currency: 'KRW',
          credits: 5,
          bonus: 0,
          popular: false
        },
        {
          type: 'LIKE_CREDITS',
          name: '라이크 15개',
          description: '15번의 좋아요 + 보너스 2개',
          price: 6900,
          currency: 'KRW',
          credits: 15,
          bonus: 2,
          popular: true
        },
        {
          type: 'LIKE_CREDITS',
          name: '라이크 30개',
          description: '30번의 좋아요 + 보너스 5개',
          price: 12900,
          currency: 'KRW',
          credits: 30,
          bonus: 5,
          popular: false
        },
        {
          type: 'LIKE_CREDITS',
          name: '라이크 50개',
          description: '50번의 좋아요 + 보너스 10개',
          price: 19000,
          currency: 'KRW',
          credits: 50,
          bonus: 10,
          popular: false
        },
        // Premium subscriptions
        {
          type: 'PREMIUM_SUBSCRIPTION',
          name: '프리미엄 월간',
          description: '무제한 라이크 + 프리미엄 기능',
          price: 9900,
          currency: 'KRW',
          duration: 30,
          features: [
            '무제한 좋아요',
            '좋아요 받은 사람 확인',
            '우선 매칭',
            '좋아요 되돌리기',
            '슈퍼 좋아요 5개/월',
            '읽음 표시',
            '온라인 상태 표시',
            '프리미엄 배지'
          ],
          popular: false
        },
        {
          type: 'PREMIUM_SUBSCRIPTION',
          name: '프리미엄 연간',
          description: '2개월 무료! 17% 할인',
          price: 99000,
          currency: 'KRW',
          originalPrice: 118800,
          duration: 365,
          savings: 19800,
          features: [
            '무제한 좋아요',
            '좋아요 받은 사람 확인',
            '우선 매칭',
            '좋아요 되돌리기',
            '슈퍼 좋아요 10개/월',
            '읽음 표시',
            '온라인 상태 표시',
            '프리미엄 배지',
            '2개월 무료'
          ],
          popular: true
        }
      ];

      res.json({
        success: true,
        data: packages
      });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();