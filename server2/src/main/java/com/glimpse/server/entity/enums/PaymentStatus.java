package com.glimpse.server.entity.enums;

/**
 * 결제 상태 Enum
 */
public enum PaymentStatus {
    PENDING,     // 대기 중
    PROCESSING,  // 처리 중
    PAID,        // 결제 완료
    FAILED,      // 결제 실패
    CANCELLED,   // 취소됨
    REFUNDED,    // 환불됨
    PARTIAL_REFUNDED // 부분 환불
}