import { PaymentService } from '../PaymentService';
import { prismaMock } from '../../__tests__/setup';
import { createMockUser } from '../../__tests__/setup';
// import { stripe } from '../../config/stripe';
import { createError } from '../../middleware/errorHandler';

// Mock stripe
const stripeMock = {
  paymentIntents: {
    create: jest.fn(),
    retrieve: jest.fn(),
  },
  checkout: {
    sessions: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
  },
};

// Mock external payment services
jest.mock('axios');

describe('PaymentService', () => {
  let paymentService: PaymentService;

  beforeEach(() => {
    paymentService = new PaymentService();
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create a payment record', async () => {
      const userId = 'user-1';
      const paymentData = {
        amount: 9900,
        type: 'PREMIUM_MONTHLY' as const,
        method: 'CARD' as const,
      };

      const mockPayment = {
        id: 'payment-1',
        userId,
        ...paymentData,
        status: 'PENDING',
        currency: 'KRW',
        createdAt: new Date(),
      };

      prismaMock.payment.create.mockResolvedValue(mockPayment as any);

      const result = await paymentService.createPayment({ userId, ...paymentData });

      expect(result).toEqual(mockPayment);
      expect(prismaMock.payment.create).toHaveBeenCalledWith({
        data: {
          userId,
          ...paymentData,
          status: 'PENDING',
          currency: 'KRW',
        },
      });
    });
  });

  describe('processStripePayment', () => {
    it('should create Stripe checkout session for premium subscription', async () => {
      const userId = 'user-1';
      const mockUser = createMockUser({ id: userId, email: 'test@example.com' });
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockSession);

      const result = await paymentService.processStripePayment(
        userId,
        'PREMIUM_MONTHLY',
        9900
      );

      expect(result).toEqual({
        sessionId: mockSession.id,
        url: mockSession.url,
      });

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer_email: mockUser.email,
        line_items: [{
          price_data: {
            currency: 'krw',
            product_data: {
              name: 'Glimpse Premium - Monthly',
              description: '매월 자동 갱신되는 프리미엄 구독',
            },
            unit_amount: 9900,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        }],
        success_url: expect.stringContaining('/payment/success'),
        cancel_url: expect.stringContaining('/payment/cancel'),
        metadata: {
          userId,
          type: 'PREMIUM_MONTHLY',
        },
      });
    });

    it('should create one-time payment session for credits', async () => {
      const userId = 'user-1';
      const mockUser = createMockUser({ id: userId });
      const mockSession = {
        id: 'cs_test_456',
        url: 'https://checkout.stripe.com/test',
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockSession);

      const result = await paymentService.processStripePayment(
        userId,
        'CREDITS_5',
        2500
      );

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'payment',
          line_items: [{
            price_data: {
              currency: 'krw',
              product_data: {
                name: 'Glimpse Credits - 5개',
                description: '5개의 좋아요 크레딧',
              },
              unit_amount: 2500,
            },
            quantity: 1,
          }],
        })
      );
    });
  });

  describe('confirmPayment', () => {
    it('should confirm successful payment and apply benefits', async () => {
      const paymentId = 'payment-1';
      const mockPayment = {
        id: paymentId,
        userId: 'user-1',
        type: 'CREDITS_10',
        amount: 4500,
        status: 'PENDING',
      };

      const mockUser = createMockUser({ credits: 5 });

      prismaMock.payment.findUnique.mockResolvedValue(mockPayment as any);
      prismaMock.payment.update.mockResolvedValue({
        ...mockPayment,
        status: 'COMPLETED',
      } as any);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        credits: 15,
      } as any);

      const result = await paymentService.confirmPayment(paymentId, {
        transactionId: 'txn_123',
      });

      expect(result.status).toBe('COMPLETED');
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { credits: { increment: 10 } },
      });
    });

    it('should handle premium subscription confirmation', async () => {
      const paymentId = 'payment-2';
      const mockPayment = {
        id: paymentId,
        userId: 'user-1',
        type: 'PREMIUM_MONTHLY',
        amount: 9900,
        status: 'PENDING',
      };

      const mockUser = createMockUser({ isPremium: false });
      const premiumUntil = new Date();
      premiumUntil.setMonth(premiumUntil.getMonth() + 1);

      prismaMock.payment.findUnique.mockResolvedValue(mockPayment as any);
      prismaMock.payment.update.mockResolvedValue({
        ...mockPayment,
        status: 'COMPLETED',
      } as any);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        isPremium: true,
        premiumUntil,
      } as any);

      await paymentService.confirmPayment(paymentId, {
        transactionId: 'sub_123',
      });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          isPremium: true,
          premiumUntil: expect.any(Date),
        },
      });
    });

    it('should throw error for already completed payment', async () => {
      const mockPayment = {
        id: 'payment-1',
        status: 'COMPLETED',
      };

      prismaMock.payment.findUnique.mockResolvedValue(mockPayment as any);

      await expect(
        paymentService.confirmPayment('payment-1', { transactionId: 'txn_123' })
      ).rejects.toThrow('이미 처리된 결제입니다.');
    });
  });

  describe('cancelPayment', () => {
    it('should cancel pending payment', async () => {
      const paymentId = 'payment-1';
      const mockPayment = {
        id: paymentId,
        status: 'PENDING',
      };

      prismaMock.payment.findUnique.mockResolvedValue(mockPayment as any);
      prismaMock.payment.update.mockResolvedValue({
        ...mockPayment,
        status: 'CANCELLED',
      } as any);

      const result = await paymentService.cancelPayment(paymentId, 'User cancelled');

      expect(result.status).toBe('CANCELLED');
      expect(prismaMock.payment.update).toHaveBeenCalledWith({
        where: { id: paymentId },
        data: {
          status: 'CANCELLED',
          metadata: expect.objectContaining({
            cancelReason: 'User cancelled',
          }),
        },
      });
    });

    it('should throw error for completed payment', async () => {
      const mockPayment = {
        id: 'payment-1',
        status: 'COMPLETED',
      };

      prismaMock.payment.findUnique.mockResolvedValue(mockPayment as any);

      await expect(
        paymentService.cancelPayment('payment-1', 'Too late')
      ).rejects.toThrow('완료된 결제는 취소할 수 없습니다.');
    });
  });

  describe('getUserPayments', () => {
    it('should return user payment history', async () => {
      const userId = 'user-1';
      const mockPayments = [
        {
          id: 'payment-1',
          userId,
          type: 'CREDITS_10',
          amount: 4500,
          status: 'COMPLETED',
          createdAt: new Date(),
        },
        {
          id: 'payment-2',
          userId,
          type: 'PREMIUM_MONTHLY',
          amount: 9900,
          status: 'COMPLETED',
          createdAt: new Date(),
        },
      ];

      prismaMock.payment.findMany.mockResolvedValue(mockPayments as any);

      const result = await paymentService.getUserPayments(userId, 1, 10);

      expect(result).toEqual(mockPayments);
      expect(prismaMock.payment.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('refundPayment', () => {
    it('should process refund for completed payment', async () => {
      const paymentId = 'payment-1';
      const mockPayment = {
        id: paymentId,
        userId: 'user-1',
        type: 'CREDITS_10',
        amount: 4500,
        status: 'COMPLETED',
        stripePaymentId: 'pi_123',
      };

      const mockRefund = {
        id: 'refund-1',
        paymentId,
        amount: 4500,
        status: 'PENDING',
      };

      prismaMock.payment.findUnique.mockResolvedValue(mockPayment as any);
      prismaMock.refund.create.mockResolvedValue(mockRefund as any);
      prismaMock.user.update.mockResolvedValue({} as any);
      prismaMock.payment.update.mockResolvedValue({
        ...mockPayment,
        status: 'REFUNDED',
      } as any);

      const result = await paymentService.refundPayment(paymentId, 'Customer request');

      expect(result).toEqual(mockRefund);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { credits: { decrement: 10 } },
      });
    });

    it('should handle premium subscription refund', async () => {
      const mockPayment = {
        id: 'payment-1',
        userId: 'user-1',
        type: 'PREMIUM_MONTHLY',
        amount: 9900,
        status: 'COMPLETED',
      };

      prismaMock.payment.findUnique.mockResolvedValue(mockPayment as any);
      prismaMock.refund.create.mockResolvedValue({} as any);
      prismaMock.user.update.mockResolvedValue({} as any);
      prismaMock.payment.update.mockResolvedValue({} as any);

      await paymentService.refundPayment('payment-1', 'Cancel subscription');

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          isPremium: false,
          premiumUntil: null,
        },
      });
    });
  });

  describe('handleWebhook', () => {
    it('should handle Stripe webhook for successful payment', async () => {
      const event = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            payment_status: 'paid',
            metadata: {
              userId: 'user-1',
              type: 'CREDITS_5',
            },
            amount_total: 2500,
          },
        },
      };

      const mockPayment = {
        id: 'payment-1',
        userId: 'user-1',
        type: 'CREDITS_5',
        status: 'PENDING',
      };

      prismaMock.payment.findFirst.mockResolvedValue(mockPayment as any);
      prismaMock.payment.update.mockResolvedValue({} as any);
      prismaMock.user.update.mockResolvedValue({} as any);

      const result = await paymentService.handleStripeWebhook(event as any);

      expect(result).toEqual({ received: true });
      expect(prismaMock.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
        data: {
          status: 'COMPLETED',
          stripePaymentId: 'cs_test_123',
        },
      });
    });
  });
});