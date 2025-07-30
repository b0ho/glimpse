import Stripe from 'stripe';
import { Payment, PaymentStatus } from '@prisma/client';
import { PaymentProvider, ProcessPaymentRequest } from '../types';
import { createError } from '../../../middleware/errorHandler';
import { logger } from '../../../utils/logger';

export class StripeProvider implements PaymentProvider {
  private stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('Stripe secret key not configured');
    }
    
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16'
    });
  }

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

  async refundPayment(payment: Payment, amount?: number): Promise<{
    success: boolean;
    refundId?: string;
    errorMessage?: string;
  }> {
    try {
      const transactionId = payment.transactionId;
      
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
        paymentId = session.metadata!.paymentId;
        status = 'COMPLETED';
        transactionId = session.payment_intent as string;
        break;
        
      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object as Stripe.PaymentIntent;
        paymentId = failedIntent.metadata!.paymentId;
        status = 'FAILED';
        break;
        
      case 'charge.refunded':
        const refundedCharge = event.data.object as Stripe.Charge;
        paymentId = refundedCharge.metadata!.paymentId;
        status = refundedCharge.amount_refunded === refundedCharge.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
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

  private getProductName(payment: Payment): string {
    const packageType = (payment.metadata as any)?.packageType;
    
    switch (payment.type) {
      case 'CREDIT_PURCHASE':
        return `Glimpse Credits ${packageType || ''}`;
      case 'PREMIUM_SUBSCRIPTION':
        return `Glimpse Premium ${packageType || 'Subscription'}`;
      default:
        return 'Glimpse Payment';
    }
  }

  private getProductDescription(payment: Payment): string {
    switch (payment.type) {
      case 'CREDIT_PURCHASE':
        return '좋아요를 보낼 수 있는 크레딧';
      case 'PREMIUM_SUBSCRIPTION':
        return '무제한 좋아요 및 프리미엄 기능';
      default:
        return 'Glimpse 서비스 이용료';
    }
  }
}