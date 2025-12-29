package com.glimpse.server.entity.enums;

/**
 * 구독 플랜 Enum
 *
 * <p>사용자가 선택할 수 있는 구독 상품 플랜을 정의하는 열거형입니다.
 * 각 플랜에 따라 결제 금액, 결제 주기, 제공 기능이 달라집니다.</p>
 *
 * <p>사용처:</p>
 * <ul>
 *   <li>Subscription 엔티티 - plan 필드</li>
 *   <li>결제 화면 - 플랜별 가격 및 혜택 표시</li>
 *   <li>구독 관리 - 플랜 변경 및 갱신</li>
 *   <li>User 엔티티 - premiumLevel 자동 매핑</li>
 *   <li>매출 통계 - 플랜별 수익 분석</li>
 * </ul>
 *
 * <p>가격 정책 (한국 시장):</p>
 * <ul>
 *   <li>FREE: ₩0</li>
 *   <li>PREMIUM_MONTHLY: ₩9,900/월</li>
 *   <li>PREMIUM_YEARLY: ₩99,000/년 (17% 할인)</li>
 *   <li>VIP_MONTHLY: ₩19,900/월</li>
 *   <li>VIP_YEARLY: ₩199,000/년 (17% 할인)</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
public enum SubscriptionPlan {
    /** 무료 - 기본 플랜 (구독 없음) */
    FREE,

    /** 프리미엄 월간 - 매월 ₩9,900 자동 결제 */
    PREMIUM_MONTHLY,

    /** 프리미엄 연간 - 연 ₩99,000 자동 결제 (월 ₩8,250, 17% 할인) */
    PREMIUM_YEARLY,

    /** VIP 월간 - 매월 ₩19,900 자동 결제 */
    VIP_MONTHLY,

    /** VIP 연간 - 연 ₩199,000 자동 결제 (월 ₩16,583, 17% 할인) */
    VIP_YEARLY
}