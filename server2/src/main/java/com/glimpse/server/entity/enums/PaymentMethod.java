package com.glimpse.server.entity.enums;

/**
 * 결제 방법 Enum
 */
public enum PaymentMethod {
    STRIPE_CARD,      // Stripe 카드 결제
    TOSS_PAY,         // 토스페이
    KAKAO_PAY,        // 카카오페이
    NAVER_PAY,        // 네이버페이
    SAMSUNG_PAY,      // 삼성페이
    APPLE_PAY,        // 애플페이
    GOOGLE_PAY,       // 구글페이
    BANK_TRANSFER,    // 계좌 이체
    VIRTUAL_ACCOUNT,  // 가상 계좌
    PHONE_BILL        // 휴대폰 결제
}