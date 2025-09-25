package com.glimpse.server.entity.enums;

/**
 * 초대 상태 Enum
 */
public enum InviteStatus {
    PENDING,     // 대기 중
    ACCEPTED,    // 수락됨
    DECLINED,    // 거절됨
    EXPIRED,     // 만료됨
    CANCELLED    // 취소됨
}