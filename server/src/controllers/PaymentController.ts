import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { PaymentService } from '../services/PaymentService';
import { NotificationService } from '../services/NotificationService';

const prisma = new PrismaClient();
const paymentService = new PaymentService();
const notificationService = new NotificationService();

export class PaymentController {
  async createPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { type, packageType, amount, currency = 'KRW', paymentMethod = 'TOSS' } = req.body;

      if (!type || !amount) {
        throw createError(400, '결제 유형과 금액이 필요합니다.');
      }

      const validTypes = ['CREDITS', 'PREMIUM_MONTHLY', 'PREMIUM_YEARLY'];
      if (!validTypes.includes(type)) {
        throw createError(400, '유효하지 않은 결제 유형입니다.');
      }

      const payment = await paymentService.createPayment({
        userId,
        type,
        packageType,
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

  async processPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.params;
      const { paymentToken, paymentKey } = req.body;
      const userId = req.user!.id;

      if (!paymentToken && !paymentKey) {
        throw createError(400, '결제 토큰 또는 결제 키가 필요합니다.');
      }

      const result = await paymentService.processPayment(paymentId, userId, {
        paymentToken,
        paymentKey
      });

      // Send success notification
      await notificationService.sendPaymentSuccessNotification(userId, result.type, result.amount);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 20, type } = req.query;

      const payments = await prisma.payment.findMany({
        where: {
          userId,
          ...(type && { type: type as string })
        },
        select: {
          id: true,
          type: true,
          packageType: true,
          amount: true,
          currency: true,
          status: true,
          paymentMethod: true,
          createdAt: true,
          processedAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string)
      });

      const totalPayments = await prisma.payment.count({
        where: {
          userId,
          ...(type && { type: type as string })
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

  async getCurrentSubscription(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE'
        },
        select: {
          id: true,
          type: true,
          status: true,
          startDate: true,
          endDate: true,
          autoRenew: true,
          price: true,
          currency: true
        }
      });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          credits: true,
          isPremium: true,
          premiumExpiresAt: true
        }
      });

      res.json({
        success: true,
        data: {
          subscription,
          credits: user?.credits || 0,
          isPremium: user?.isPremium || false,
          premiumExpiresAt: user?.premiumExpiresAt
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelSubscription(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

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
          autoRenew: false,
          cancelledAt: new Date()
        }
      });

      // Send cancellation notification
      await notificationService.sendSubscriptionCancelledNotification(userId, subscription.endDate);

      res.json({
        success: true,
        data: {
          message: '구독이 취소되었습니다. 구독 만료일까지 프리미엄 혜택을 이용할 수 있습니다.',
          expiresAt: subscription.endDate
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.params;
      const userId = req.user!.id;

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

  async refundPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.params;
      const { reason } = req.body;
      const userId = req.user!.id;

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

      if (payment.status !== 'SUCCESS') {
        throw createError(400, '성공한 결제만 환불할 수 있습니다.');
      }

      // Check refund eligibility (within 7 days for digital goods)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      if (payment.processedAt && payment.processedAt < sevenDaysAgo) {
        throw createError(400, '결제 후 7일이 지난 건은 환불할 수 없습니다.');
      }

      const refund = await paymentService.refundPayment(paymentId, reason);

      // Send refund notification
      await notificationService.sendRefundNotification(userId, refund.amount, refund.currency);

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

  async getPaymentMethods(req: AuthRequest, res: Response, next: NextFunction) {
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

  async getPricingPackages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const packages = [
        // Credit packages
        {
          type: 'CREDITS',
          packageType: 'SMALL',
          name: '라이크 5개',
          description: '5번의 좋아요 기회',
          price: 2500,
          currency: 'KRW',
          credits: 5,
          bonus: 0,
          popular: false
        },
        {
          type: 'CREDITS',
          packageType: 'MEDIUM',
          name: '라이크 15개',
          description: '15번의 좋아요 + 보너스 2개',
          price: 6900,
          currency: 'KRW',
          credits: 15,
          bonus: 2,
          popular: true
        },
        {
          type: 'CREDITS',
          packageType: 'LARGE',
          name: '라이크 30개',
          description: '30번의 좋아요 + 보너스 5개',
          price: 12900,
          currency: 'KRW',
          credits: 30,
          bonus: 5,
          popular: false
        },
        {
          type: 'CREDITS',
          packageType: 'XLARGE',
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
          type: 'PREMIUM_MONTHLY',
          packageType: 'MONTHLY',
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
          type: 'PREMIUM_YEARLY',
          packageType: 'YEARLY',
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