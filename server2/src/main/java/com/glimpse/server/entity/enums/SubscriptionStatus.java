package com.glimpse.server.entity.enums;

/**
 * 구독 상태 Enum
 */
public enum SubscriptionStatus {
    ACTIVE,      // 활성
    PAUSED,      // 일시 중지
    CANCELLED,   // 취소됨
    EXPIRED,     // 만료됨
    PAST_DUE,    // 연체
    TRIALING     // 체험 중
}