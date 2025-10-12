package com.glimpse.server.entity.enums;

/**
 * 결제 상태 Enum
 *
 * <p>결제 트랜잭션의 현재 상태를 나타내는 열거형입니다.
 * 결제 요청부터 완료, 실패, 환불까지의 전체 생명주기를 관리합니다.</p>
 *
 * <p>사용처:</p>
 * <ul>
 *   <li>Payment 엔티티 - status 필드</li>
 *   <li>결제 프로세스 - 상태별 로직 처리</li>
 *   <li>결제 이력 조회 - 사용자 결제 내역</li>
 *   <li>환불 처리 - 환불 가능 여부 확인</li>
 *   <li>매출 통계 - 성공/실패 결제 분석</li>
 * </ul>
 *
 * <p>상태 전환:</p>
 * <ul>
 *   <li>PENDING → PROCESSING (결제 시작)</li>
 *   <li>PROCESSING → PAID (결제 성공)</li>
 *   <li>PROCESSING → FAILED (결제 실패)</li>
 *   <li>PENDING/PROCESSING → CANCELLED (사용자 취소)</li>
 *   <li>PAID → REFUNDED (전액 환불)</li>
 *   <li>PAID → PARTIAL_REFUNDED (부분 환불)</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
public enum PaymentStatus {
    /** 대기 중 - 결제가 생성되었으나 아직 처리 시작 전 */
    PENDING,

    /** 처리 중 - 결제 게이트웨이에서 결제를 처리하는 중 (일반적으로 수 초 소요) */
    PROCESSING,

    /** 결제 완료 - 결제가 성공적으로 완료되어 서비스 이용 가능 */
    PAID,

    /** 결제 실패 - 카드 한도 초과, 잔액 부족 등으로 결제 실패 */
    FAILED,

    /** 취소됨 - 사용자 또는 시스템에 의해 결제가 취소됨 (결제 완료 전) */
    CANCELLED,

    /** 환불됨 - 결제 완료 후 전액 환불 처리됨 (원결제 수단으로 환불) */
    REFUNDED,

    /** 부분 환불 - 결제 금액의 일부만 환불됨 (구독 중도 해지 등) */
    PARTIAL_REFUNDED
}