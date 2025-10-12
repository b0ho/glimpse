package com.glimpse.server.entity.enums;

/**
 * 결제 방법 Enum
 *
 * <p>사용자가 선택할 수 있는 결제 수단을 정의하는 열거형입니다.
 * 한국 시장에 최적화된 다양한 간편결제 및 전통적인 결제 방식을 지원합니다.</p>
 *
 * <p>사용처:</p>
 * <ul>
 *   <li>Payment 엔티티 - paymentMethod 필드</li>
 *   <li>결제 화면 - 결제 수단 선택 UI</li>
 *   <li>결제 게이트웨이 연동 - 방법별 API 호출</li>
 *   <li>환불 처리 - 원결제 수단으로 환불</li>
 *   <li>결제 통계 - 결제 수단별 분석</li>
 * </ul>
 *
 * <p>지원 결제 게이트웨이:</p>
 * <ul>
 *   <li>국제: Stripe</li>
 *   <li>한국: 토스페이먼츠, 카카오페이, 네이버페이</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
public enum PaymentMethod {
    /** Stripe 카드 결제 - 국제 신용/체크카드 (Visa, Mastercard, AMEX 등) */
    STRIPE_CARD,

    /** 토스페이 - 토스 앱 연동 간편결제 (한국 시장 점유율 1위) */
    TOSS_PAY,

    /** 카카오페이 - 카카오톡 연동 간편결제 (높은 사용자 기반) */
    KAKAO_PAY,

    /** 네이버페이 - 네이버 계정 연동 간편결제 */
    NAVER_PAY,

    /** 삼성페이 - 삼성 갤럭시 기기 전용 간편결제 */
    SAMSUNG_PAY,

    /** 애플페이 - iOS 기기 전용 간편결제 (iPhone, iPad, Mac) */
    APPLE_PAY,

    /** 구글페이 - Android 기기 전용 간편결제 */
    GOOGLE_PAY,

    /** 계좌 이체 - 실시간 계좌 이체 (금융기관 직접 연동) */
    BANK_TRANSFER,

    /** 가상 계좌 - 전용 가상계좌 발급 후 입금 확인 (24-48시간 유효) */
    VIRTUAL_ACCOUNT,

    /** 휴대폰 결제 - 통신사 요금과 함께 청구 (SKT, KT, LG U+) */
    PHONE_BILL
}