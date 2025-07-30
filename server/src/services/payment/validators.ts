import { PaymentType, PaymentMethod } from '@prisma/client';
import { createError } from '../../middleware/errorHandler';

export class PaymentValidator {
  static validateAmount(amount: number, currency: string): void {
    const minAmount = currency === 'KRW' ? 100 : 1;
    if (amount < minAmount) {
      throw createError(400, `최소 결제 금액은 ${minAmount}${currency}입니다.`);
    }

    const maxAmount = currency === 'KRW' ? 10000000 : 10000;
    if (amount > maxAmount) {
      throw createError(400, `최대 결제 금액은 ${maxAmount}${currency}입니다.`);
    }
  }

  static validatePaymentMethod(method: PaymentMethod, currency: string): void {
    // Korean payment methods only support KRW
    if ((method === 'TOSS_PAY' || method === 'KAKAO_PAY' || method === 'NAVER_PAY') && currency !== 'KRW') {
      throw createError(400, '한국 결제 수단은 KRW만 지원합니다.');
    }

    // International payment methods
    if (method === 'CARD' && !['KRW', 'USD', 'EUR'].includes(currency)) {
      throw createError(400, '지원하지 않는 통화입니다.');
    }
  }

  static validatePackageType(type: PaymentType, packageType?: string): void {
    if (type === 'CREDIT_PURCHASE') {
      const validPackages = ['5_credits', '10_credits', '20_credits', '50_credits', '100_credits'];
      if (!packageType || !validPackages.includes(packageType)) {
        throw createError(400, '유효하지 않은 크레딧 패키지입니다.');
      }
    }

    if (type === 'PREMIUM_SUBSCRIPTION') {
      const validSubscriptions = ['monthly', 'quarterly', 'yearly'];
      if (!packageType || !validSubscriptions.includes(packageType)) {
        throw createError(400, '유효하지 않은 구독 유형입니다.');
      }
    }
  }

  static getPackageAmount(packageType: string, currency: string): number {
    const packages: Record<string, Record<string, number>> = {
      // Credit packages
      '5_credits': { KRW: 2500, USD: 2 },
      '10_credits': { KRW: 4900, USD: 4 },
      '20_credits': { KRW: 9000, USD: 7 },
      '50_credits': { KRW: 19000, USD: 15 },
      '100_credits': { KRW: 35000, USD: 28 },
      
      // Subscription packages
      'monthly': { KRW: 9900, USD: 8 },
      'quarterly': { KRW: 26700, USD: 21 },
      'yearly': { KRW: 99000, USD: 79 }
    };

    const packagePrices = packages[packageType];
    if (!packagePrices || !packagePrices[currency]) {
      throw createError(400, '유효하지 않은 패키지 또는 통화입니다.');
    }

    return packagePrices[currency];
  }

  static getCreditsFromPackage(packageType: string): number {
    const creditMap: Record<string, number> = {
      '5_credits': 5,
      '10_credits': 10,
      '20_credits': 20,
      '50_credits': 50,
      '100_credits': 100
    };

    return creditMap[packageType] || 0;
  }
}