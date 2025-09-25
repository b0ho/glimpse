package com.glimpse.server.entity.enums;

/**
 * 알림 타입 Enum
 */
public enum NotificationType {
    MATCH,           // 매칭 알림
    LIKE_RECEIVED,   // 좋아요 받음
    MESSAGE,         // 메시지
    GROUP_INVITE,    // 그룹 초대
    VERIFICATION,    // 인증
    PAYMENT,         // 결제
    SYSTEM,          // 시스템
    PROMOTION,       // 프로모션
    UPDATE           // 업데이트
}