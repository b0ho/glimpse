/**
 * @module PaymentValidators
 * @description 결제 유효성 검사 모듈
 * 한국 결제 시스템의 특성을 반영하여 금액, 결제 수단, 패키지 유형 등을 검증합니다.
 */

import { PaymentType, PaymentMethod } from '@prisma/client';
import { createError } from '../../middleware/errorHandler';

/**
 * 결제 유효성 검사 클래스
 * @class PaymentValidator
 * @description 결제 관련 데이터의 유효성을 검사하는 유틸리티 클래스입니다.
 * 한국과 국제 결제 시스템의 특성을 고려하여 검증 로직을 제공합니다.
 */
export class PaymentValidator {
  /**
   * 결제 금액 유효성 검사
   * @static
   * @param {number} amount - 결제 금액
   * @param {string} currency - 통화 코드 (KRW, USD 등)
   * @throws {Error} 금액이 최소/최대 범위를 벗어날 경우
   * @description 통화별로 최소/최대 결제 금액을 검증합니다.
   */
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

  /**
   * 결제 수단 유효성 검사
   * @static
   * @param {PaymentMethod} method - 결제 수단
   * @param {string} currency - 통화 코드
   * @throws {Error} 결제 수단과 통화가 호환되지 않을 경우
   * @description 한국 결제 수단은 KRW만 지원하는 등 제약 사항을 검증합니다.
   */
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

  /**
   * 패키지 유형 유효성 검사
   * @static
   * @param {PaymentType} type - 결제 유형
   * @param {string} [packageType] - 패키지 유형
   * @throws {Error} 유효하지 않은 패키지 유형일 경우
   * @description 크레딧 구매와 프리미엄 구독의 패키지 유형을 검증합니다.
   */
  static validatePackageType(type: PaymentType, packageType?: string): void {
    if (type === 'LIKE_CREDITS') {
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

  /**
   * 패키지 금액 조회
   * @static
   * @param {string} packageType - 패키지 유형
   * @param {string} currency - 통화 코드
   * @returns {number} 패키지의 금액
   * @throws {Error} 유효하지 않은 패키지 또는 통화일 경우
   * @description 패키지 유형과 통화에 따른 정확한 금액을 반환합니다.
   */
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

  /**
   * 패키지에서 크레딧 수 조회
   * @static
   * @param {string} packageType - 크레딧 패키지 유형
   * @returns {number} 패키지에 포함된 크레딧 수
   * @description 크레딧 패키지에서 제공되는 크레딧 수를 반환합니다.
   */
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