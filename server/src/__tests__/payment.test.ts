import request from 'supertest';
import express from 'express';
import { paymentController } from '../controllers/PaymentController';
import { paymentService } from '../services/PaymentService';
import { prisma } from '../config/database';
import { createMockUser } from './setup';

// Mock services
jest.mock('../services/PaymentService');

// Mock auth middleware
const mockAuth = (req: any, res: any, next: any) => {
  req.auth = { userId: 'test-user-id' };
  next();
};

const app = express();
app.use(express.json());

// Mount payment routes with mocked auth
app.get('/payments/products', paymentController.getProducts);
app.post('/payments/credits/purchase', mockAuth, paymentController.purchaseCredits);
app.post('/payments/premium/subscribe', mockAuth, paymentController.subscribePremium);
app.post('/payments/premium/cancel', mockAuth, paymentController.cancelPremium);
app.get('/payments/history', mockAuth, paymentController.getPaymentHistory);
app.post('/payments/webhook/stripe', paymentController.handleStripeWebhook);
app.post('/payments/webhook/toss', paymentController.handleTossWebhook);
app.post('/payments/webhook/kakao', paymentController.handleKakaoWebhook);

describe('Payment API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /payments/products', () => {
    it('should return available products', async () => {
      const mockProducts = {
        credits: [
          { id: 'credit-5', name: '5 크레딧', amount: 5, price: 2500 },
          { id: 'credit-10', name: '10 크레딧', amount: 10, price: 4500 },
          { id: 'credit-30', name: '30 크레딧', amount: 30, price: 12000 },
          { id: 'credit-50', name: '50 크레딧', amount: 50, price: 19000 },
        ],
        premium: [
          { 
            id: 'premium-month', 
            name: '프리미엄 월간', 
            duration: 'month', 
            price: 9900,
            features: ['무제한 좋아요', '좋아요 받은 사람 확인', '우선 매칭']
          },
          { 
            id: 'premium-year', 
            name: '프리미엄 연간', 
            duration: 'year', 
            price: 99000,
            originalPrice: 118800,
            discount: 17,
            features: ['무제한 좋아요', '좋아요 받은 사람 확인', '우선 매칭', '2개월 무료']
          },
        ],
      };
      
      (paymentService.getProducts as jest.Mock).mockResolvedValue(mockProducts);

      const response = await request(app)
        .get('/payments/products')
        .expect(200);

      expect(response.body).toEqual(mockProducts);
    });
  });

  describe('POST /payments/credits/purchase', () => {
    const purchaseData = {
      productId: 'credit-10',
      paymentMethod: 'TOSS',
    };

    it('should initiate credit purchase successfully', async () => {
      const mockUser = createMockUser();
      const mockPayment = {
        id: 'payment-id',
        orderId: 'order-123456',
        status: 'PENDING',
        paymentUrl: 'https://pay.toss.im/checkout/123456',
      };
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (paymentService.createCreditPurchase as jest.Mock).mockResolvedValue(mockPayment);

      const response = await request(app)
        .post('/payments/credits/purchase')
        .send(purchaseData)
        .expect(200);

      expect(response.body).toEqual({
        orderId: mockPayment.orderId,
        paymentUrl: mockPayment.paymentUrl,
        status: 'PENDING',
      });
    });

    it('should validate payment method', async () => {
      const response = await request(app)
        .post('/payments/credits/purchase')
        .send({ ...purchaseData, paymentMethod: 'INVALID' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should validate product exists', async () => {
      const mockUser = createMockUser();
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (paymentService.createCreditPurchase as jest.Mock).mockRejectedValue(
        new Error('상품을 찾을 수 없습니다')
      );

      const response = await request(app)
        .post('/payments/credits/purchase')
        .send({ ...purchaseData, productId: 'invalid-product' })
        .expect(400);

      expect(response.body.error).toBe('상품을 찾을 수 없습니다');
    });
  });

  describe('POST /payments/premium/subscribe', () => {
    const subscribeData = {
      planId: 'premium-month',
      paymentMethod: 'KAKAO',
    };

    it('should initiate premium subscription', async () => {
      const mockUser = createMockUser({ isPremium: false });
      const mockSubscription = {
        id: 'subscription-id',
        orderId: 'sub-123456',
        status: 'PENDING',
        paymentUrl: 'https://pay.kakao.com/checkout/123456',
        plan: {
          id: 'premium-month',
          name: '프리미엄 월간',
          price: 9900,
        },
      };
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (paymentService.createPremiumSubscription as jest.Mock).mockResolvedValue(mockSubscription);

      const response = await request(app)
        .post('/payments/premium/subscribe')
        .send(subscribeData)
        .expect(200);

      expect(response.body).toEqual({
        subscriptionId: mockSubscription.id,
        orderId: mockSubscription.orderId,
        paymentUrl: mockSubscription.paymentUrl,
        plan: mockSubscription.plan,
      });
    });

    it('should prevent duplicate subscription', async () => {
      const mockUser = createMockUser({ 
        isPremium: true,
        premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/payments/premium/subscribe')
        .send(subscribeData)
        .expect(400);

      expect(response.body.error).toBe('이미 프리미엄 구독 중입니다');
    });

    it('should allow resubscription when expiring soon', async () => {
      const mockUser = createMockUser({ 
        isPremium: true,
        premiumUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days left
      });
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (paymentService.createPremiumSubscription as jest.Mock).mockResolvedValue({
        id: 'subscription-id',
        orderId: 'sub-123456',
        status: 'PENDING',
        paymentUrl: 'https://pay.kakao.com/checkout/123456',
      });

      const response = await request(app)
        .post('/payments/premium/subscribe')
        .send(subscribeData)
        .expect(200);

      expect(response.body.orderId).toBeDefined();
    });
  });

  describe('POST /payments/premium/cancel', () => {
    it('should cancel premium subscription', async () => {
      const mockUser = createMockUser({ 
        isPremium: true,
        premiumUntil: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      });
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (paymentService.cancelPremiumSubscription as jest.Mock).mockResolvedValue({
        cancelledAt: new Date(),
        expiresAt: mockUser.premiumUntil,
      });

      const response = await request(app)
        .post('/payments/premium/cancel')
        .send({ reason: '더 이상 필요하지 않음' })
        .expect(200);

      expect(response.body).toEqual({
        message: '프리미엄 구독이 해지되었습니다',
        expiresAt: mockUser.premiumUntil.toISOString(),
      });
    });

    it('should require cancellation reason', async () => {
      const response = await request(app)
        .post('/payments/premium/cancel')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should prevent cancellation for non-premium users', async () => {
      const mockUser = createMockUser({ isPremium: false });
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/payments/premium/cancel')
        .send({ reason: 'test' })
        .expect(400);

      expect(response.body.error).toBe('프리미엄 구독 중이 아닙니다');
    });
  });

  describe('GET /payments/history', () => {
    it('should return payment history', async () => {
      const mockPayments = [
        {
          id: 'payment-1',
          type: 'CREDIT_PURCHASE',
          amount: 4500,
          status: 'COMPLETED',
          productName: '10 크레딧',
          paymentMethod: 'TOSS',
          createdAt: new Date(),
        },
        {
          id: 'payment-2',
          type: 'PREMIUM_SUBSCRIPTION',
          amount: 9900,
          status: 'COMPLETED',
          productName: '프리미엄 월간',
          paymentMethod: 'KAKAO',
          createdAt: new Date(),
        },
      ];
      
      (paymentService.getPaymentHistory as jest.Mock).mockResolvedValue({
        payments: mockPayments,
        total: 2,
      });

      const response = await request(app)
        .get('/payments/history')
        .query({ page: 1, limit: 20 })
        .expect(200);

      expect(response.body).toEqual({
        payments: expect.arrayContaining([
          expect.objectContaining({
            id: 'payment-1',
            type: 'CREDIT_PURCHASE',
            amount: 4500,
          }),
        ]),
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      });
    });

    it('should filter by payment type', async () => {
      (paymentService.getPaymentHistory as jest.Mock).mockResolvedValue({
        payments: [],
        total: 0,
      });

      await request(app)
        .get('/payments/history')
        .query({ type: 'CREDIT_PURCHASE' })
        .expect(200);

      expect(paymentService.getPaymentHistory).toHaveBeenCalledWith(
        'test-user-id',
        expect.objectContaining({ type: 'CREDIT_PURCHASE' })
      );
    });
  });

  describe('Webhook Endpoints', () => {
    describe('POST /payments/webhook/stripe', () => {
      it('should process Stripe webhook', async () => {
        const webhookData = {
          type: 'payment_intent.succeeded',
          data: {
            object: {
              id: 'pi_123456',
              metadata: {
                orderId: 'order-123456',
                userId: 'user-id',
              },
            },
          },
        };
        
        (paymentService.processStripeWebhook as jest.Mock).mockResolvedValue({
          success: true,
          orderId: 'order-123456',
        });

        const response = await request(app)
          .post('/payments/webhook/stripe')
          .set('stripe-signature', 'test-signature')
          .send(webhookData)
          .expect(200);

        expect(response.body).toEqual({ received: true });
      });

      it('should validate webhook signature', async () => {
        const response = await request(app)
          .post('/payments/webhook/stripe')
          .send({})
          .expect(400);

        expect(response.body.error).toBe('No Stripe signature found');
      });
    });

    describe('POST /payments/webhook/toss', () => {
      it('should process Toss webhook', async () => {
        const webhookData = {
          status: 'DONE',
          orderId: 'order-123456',
          paymentKey: 'toss-payment-key',
          amount: 4500,
        };
        
        (paymentService.processTossWebhook as jest.Mock).mockResolvedValue({
          success: true,
          orderId: 'order-123456',
        });

        const response = await request(app)
          .post('/payments/webhook/toss')
          .send(webhookData)
          .expect(200);

        expect(response.body).toEqual({ success: true });
      });

      it('should handle payment failure', async () => {
        const webhookData = {
          status: 'FAILED',
          orderId: 'order-123456',
          failureCode: 'CARD_DECLINED',
          failureMessage: '카드가 거절되었습니다',
        };
        
        (paymentService.processTossWebhook as jest.Mock).mockResolvedValue({
          success: false,
          orderId: 'order-123456',
        });

        const response = await request(app)
          .post('/payments/webhook/toss')
          .send(webhookData)
          .expect(200);

        expect(response.body).toEqual({ success: false });
      });
    });

    describe('POST /payments/webhook/kakao', () => {
      it('should process Kakao webhook', async () => {
        const webhookData = {
          payment_status: 'SUCCESS',
          partner_order_id: 'order-123456',
          partner_user_id: 'user-id',
          tid: 'kakao-transaction-id',
          amount: {
            total: 9900,
          },
        };
        
        (paymentService.processKakaoWebhook as jest.Mock).mockResolvedValue({
          success: true,
          orderId: 'order-123456',
        });

        const response = await request(app)
          .post('/payments/webhook/kakao')
          .send(webhookData)
          .expect(200);

        expect(response.body).toEqual({ success: true });
      });

      it('should handle cancellation', async () => {
        const webhookData = {
          payment_status: 'CANCEL',
          partner_order_id: 'order-123456',
          cancel_amount: 9900,
        };
        
        (paymentService.processKakaoWebhook as jest.Mock).mockResolvedValue({
          success: true,
          orderId: 'order-123456',
          cancelled: true,
        });

        const response = await request(app)
          .post('/payments/webhook/kakao')
          .send(webhookData)
          .expect(200);

        expect(response.body).toEqual({ success: true });
      });
    });
  });
});