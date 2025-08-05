import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaymentType, PaymentMethod } from '@prisma/client';

/**
 * 결제 생성 DTO
 */
export class CreatePaymentDto {
  @IsEnum(PaymentType)
  type: PaymentType;

  @IsOptional()
  @IsString()
  packageType?: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  currency: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}

/**
 * 결제 처리 DTO
 */
export class ProcessPaymentDto {
  @IsOptional()
  @IsString()
  paymentToken?: string;

  @IsOptional()
  @IsString()
  paymentKey?: string;
}

/**
 * 환불 요청 DTO
 */
export class RefundPaymentDto {
  @IsString()
  reason: string;
}

/**
 * 크레딧 구매 DTO
 */
export class CreateCreditPurchaseDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsNumber()
  @Min(1)
  credits: number;

  @IsString()
  paymentMethod: string;
}

/**
 * 구독 생성 DTO
 */
export class CreateSubscriptionDto {
  @IsEnum(['MONTHLY', 'YEARLY'])
  plan: 'MONTHLY' | 'YEARLY';

  @IsString()
  paymentMethod: string;
}
