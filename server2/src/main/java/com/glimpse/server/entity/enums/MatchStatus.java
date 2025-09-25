package com.glimpse.server.entity.enums;

/**
 * 매칭 상태 Enum
 */
public enum MatchStatus {
    PENDING,     // 대기 중 (한쪽만 좋아요)
    MATCHED,     // 매칭됨 (양쪽 좋아요)
    UNMATCHED,   // 매칭 해제됨
    BLOCKED,     // 차단됨
    EXPIRED      // 만료됨
}