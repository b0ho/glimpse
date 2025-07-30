import { PaymentStatus, PaymentMethod, PaymentType, Payment } from '@prisma/client';

export interface CreatePaymentRequest {
  userId: string;
  type: PaymentType;
  packageType?: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
}

export interface ProcessPaymentRequest {
  paymentToken?: string;
  paymentKey?: string;
}

export interface PaymentProvider {
  createPayment(payment: Payment): Promise<{
    paymentUrl: string;
    paymentData: any;
  }>;
  verifyPayment(payment: Payment, data: ProcessPaymentRequest): Promise<{
    success: boolean;
    transactionId?: string;
    errorMessage?: string;
  }>;
  refundPayment(payment: Payment, amount?: number): Promise<{
    success: boolean;
    refundId?: string;
    errorMessage?: string;
  }>;
  handleWebhook(data: any): Promise<{
    paymentId: string;
    status: PaymentStatus;
    transactionId?: string;
  }>;
}

export interface PaymentResult {
  id: string;
  externalId: string;
  amount: number;
  currency: string;
  paymentUrl?: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  createdAt: Date;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number;
  reason: string;
}