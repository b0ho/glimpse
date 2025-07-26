import request from 'supertest';
import express from 'express';
import { paymentController } from '../controllers/PaymentController';
import { prisma } from '../config/database';
import { createMockUser } from './setup';
import { errorHandler } from '../middleware/errorHandler';

// Mock auth middleware
const mockAuth = (req: any, res: any, next: any) => {
  req.auth = { userId: 'test-user-id' };
  next();
};

const app = express();
app.use(express.json());

// Mount payment routes with mocked auth
app.post('/payment/credits/purchase', mockAuth, paymentController.purchaseCredits);
app.post('/payment/premium/subscribe', mockAuth, paymentController.subscribePremium);
app.post('/payment/premium/cancel', mockAuth, paymentController.cancelPremium);
app.get('/payment/history', mockAuth, paymentController.getPaymentHistory);
app.get('/payment/subscription/status', mockAuth, paymentController.getSubscriptionStatus);
app.post('/payment/webhook/stripe', paymentController.handleStripeWebhook);
app.post('/payment/webhook/toss', paymentController.handleTossPayWebhook);
app.post('/payment/webhook/kakao', paymentController.handleKakaoPayWebhook);

// Add error handler
app.use(errorHandler);

// Mock external services
jest.mock('../services/PaymentService');
jest.mock('../services/NotificationService');

describe('Payment API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /payment/credits/purchase', () => {
    const purchaseData = {
      package: 'SMALL',
      paymentMethod: 'CARD'
    };

    it('should purchase credits successfully', async () => {
      const mockUser = createMockUser();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      
      const paymentService = require('../services/PaymentService').paymentService;
      jest.spyOn(paymentService, 'createCreditPurchase').mockResolvedValue({
        id: 'payment-id',
        userId: 'test-user-id',
        amount: 2500,
        credits: 5,
        status: 'COMPLETED',
        createdAt: new Date()
      });
      
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        credits: mockUser.credits + 5
      });
      
      const notificationService = require('../services/NotificationService').notificationService;
      jest.spyOn(notificationService, 'sendPurchaseNotification').mockResolvedValue(undefined);

      const response = await request(app)
        .post('/payment/credits/purchase')
        .send(purchaseData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          paymentId: 'payment-id',
          newCreditBalance: mockUser.credits + 5,
          message: '크레딧 구매가 완료되었습니다.'
        }
      });
    });

    it('should validate credit package', async () => {
      const response = await request(app)
        .post('/payment/credits/purchase')
        .send({ package: 'INVALID', paymentMethod: 'CARD' })
        .expect(400);

      expect(response.body.error.message).toBeDefined();
    });

    it('should handle payment failure', async () => {
      const mockUser = createMockUser();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      
      const paymentService = require('../services/PaymentService').paymentService;
      jest.spyOn(paymentService, 'createCreditPurchase').mockRejectedValue(
        new Error('결제 처리 중 오류가 발생했습니다.')
      );

      const response = await request(app)
        .post('/payment/credits/purchase')
        .send(purchaseData)
        .expect(500);

      expect(response.body.error.message).toBe('결제 처리 중 오류가 발생했습니다.');
    });
  });


  describe('POST /payment/premium/subscribe', () => {
    const subscriptionData = {
      plan: 'MONTHLY',
      paymentMethod: 'CARD'
    };

    it('should subscribe to premium successfully', async () => {
      const mockUser = createMockUser({ isPremium: false });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      
      const paymentService = require('../services/PaymentService').paymentService;
      jest.spyOn(paymentService, 'createSubscription').mockResolvedValue({
        id: 'subscription-id',
        userId: 'test-user-id',
        plan: 'MONTHLY',
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date()
      });
      
      const premiumUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        isPremium: true,
        premiumUntil
      });

      const response = await request(app)
        .post('/payment/premium/subscribe')
        .send(subscriptionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subscriptionId).toBe('subscription-id');
      expect(response.body.data.message).toBe('프리미엄 구독이 시작되었습니다.');
    });

    it('should prevent duplicate subscription', async () => {
      const mockUser = createMockUser({ isPremium: true });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/payment/premium/subscribe')
        .send(subscriptionData)
        .expect(400);

      expect(response.body.error.message).toBe('이미 프리미엄 구독 중입니다.');
    });

    it('should validate subscription plan', async () => {
      const response = await request(app)
        .post('/payment/premium/subscribe')
        .send({ plan: 'INVALID', paymentMethod: 'CARD' })
        .expect(400);

      expect(response.body.error.message).toBeDefined();
    });
  });

  describe('POST /payment/premium/cancel', () => {
    it('should cancel premium subscription', async () => {
      const mockUser = createMockUser({ isPremium: true });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      
      const paymentService = require('../services/PaymentService').paymentService;
      jest.spyOn(paymentService, 'cancelSubscription').mockResolvedValue({
        id: 'subscription-id',
        status: 'CANCELLED',
        cancelledAt: new Date()
      });

      const response = await request(app)
        .post('/payment/premium/cancel')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          message: '프리미엄 구독이 취소되었습니다.'
        }
      });
    });

    it('should handle non-premium user cancellation', async () => {
      const mockUser = createMockUser({ isPremium: false });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/payment/premium/cancel')
        .expect(400);

      expect(response.body.error.message).toBe('프리미엄 구독 중이 아닙니다.');
    });
  });

  describe('GET /payment/history', () => {
    it('should return payment history', async () => {
      const mockPayments = [
        {
          id: 'payment-1',
          type: 'CREDIT_PURCHASE',
          amount: 2500,
          credits: 5,
          status: 'COMPLETED',
          createdAt: new Date()
        },
        {
          id: 'payment-2',
          type: 'PREMIUM_SUBSCRIPTION',
          amount: 9900,
          plan: 'MONTHLY',
          status: 'COMPLETED',
          createdAt: new Date()
        }
      ];
      
      (prisma.payment.findMany as jest.Mock).mockResolvedValue(mockPayments);
      (prisma.payment.count as jest.Mock).mockResolvedValue(2);

      const response = await request(app)
        .get('/payment/history')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payments).toHaveLength(2);
    });
  });

  describe('GET /payment/subscription/status', () => {
    it('should return active subscription status', async () => {
      const mockUser = createMockUser({ 
        isPremium: true,
        premiumUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      
      const mockSubscription = {
        id: 'subscription-id',
        plan: 'MONTHLY',
        status: 'ACTIVE',
        currentPeriodEnd: mockUser.premiumUntil,
        nextBillingDate: mockUser.premiumUntil
      };
      
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(mockSubscription);

      const response = await request(app)
        .get('/payment/subscription/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(true);
      expect(response.body.data.subscription.plan).toBe('MONTHLY');
    });

    it('should handle no subscription', async () => {
      const mockUser = createMockUser({ isPremium: false });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/payment/subscription/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(false);
      expect(response.body.data.subscription).toBeNull();
    });
  });

  describe('Webhook endpoints', () => {
    describe('POST /payment/webhook/stripe', () => {
      it('should handle stripe webhook', async () => {
        const mockEvent = {
          type: 'checkout.session.completed',
          data: {
            object: {
              metadata: {
                userId: 'test-user-id',
                type: 'CREDIT_PURCHASE',
                package: 'SMALL'
              }
            }
          }
        };

        const paymentService = require('../services/PaymentService').paymentService;
        jest.spyOn(paymentService, 'handleStripeWebhook').mockResolvedValue({
          success: true,
          processed: true
        });

        const response = await request(app)
          .post('/payment/webhook/stripe')
          .send(mockEvent)
          .set('stripe-signature', 'test-signature')
          .expect(200);

        expect(response.body).toEqual({ received: true });
      });
    });

    describe('POST /payment/webhook/toss', () => {
      it('should handle toss webhook', async () => {
        const mockData = {
          paymentKey: 'test-payment-key',
          orderId: 'test-order-id',
          status: 'DONE'
        };

        const paymentService = require('../services/PaymentService').paymentService;
        jest.spyOn(paymentService, 'handleTossWebhook').mockResolvedValue({
          success: true,
          processed: true
        });

        const response = await request(app)
          .post('/payment/webhook/toss')
          .send(mockData)
          .expect(200);

        expect(response.body).toEqual({ success: true });
      });
    });

    describe('POST /payment/webhook/kakao', () => {
      it('should handle kakao webhook', async () => {
        const mockData = {
          tid: 'test-transaction-id',
          partner_order_id: 'test-order-id',
          payment_method_type: 'CARD'
        };

        const paymentService = require('../services/PaymentService').paymentService;
        jest.spyOn(paymentService, 'handleKakaoWebhook').mockResolvedValue({
          success: true,
          processed: true
        });

        const response = await request(app)
          .post('/payment/webhook/kakao')
          .send(mockData)
          .expect(200);

        expect(response.body).toEqual({ success: true });
      });
    });
  });
});