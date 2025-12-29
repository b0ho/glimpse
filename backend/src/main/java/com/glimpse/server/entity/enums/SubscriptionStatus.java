package com.glimpse.server.entity.enums;

/**
 * 구독 상태 Enum
 *
 * <p>사용자 구독의 현재 상태를 나타내는 열거형입니다.
 * 구독 생명주기 전반에 걸친 상태 관리 및 자동 갱신 처리에 사용됩니다.</p>
 *
 * <p>사용처:</p>
 * <ul>
 *   <li>Subscription 엔티티 - status 필드</li>
 *   <li>구독 갱신 - 자동 결제 및 상태 업데이트</li>
 *   <li>기능 접근 제어 - 활성 구독 여부 확인</li>
 *   <li>알림 시스템 - 구독 상태 변경 알림</li>
 *   <li>구독 관리 - 사용자 구독 내역 조회</li>
 * </ul>
 *
 * <p>상태 전환:</p>
 * <ul>
 *   <li>TRIALING → ACTIVE (체험 기간 종료 후 정상 결제)</li>
 *   <li>ACTIVE → PAUSED (사용자가 일시 중지 요청)</li>
 *   <li>PAUSED → ACTIVE (일시 중지 해제)</li>
 *   <li>ACTIVE → CANCELLED (사용자가 구독 취소)</li>
 *   <li>ACTIVE → PAST_DUE (갱신 결제 실패)</li>
 *   <li>PAST_DUE → ACTIVE (연체 해결 후 복구)</li>
 *   <li>PAST_DUE → EXPIRED (일정 기간 연체 후 만료)</li>
 *   <li>CANCELLED/ACTIVE → EXPIRED (구독 기간 종료)</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
public enum SubscriptionStatus {
    /** 활성 - 구독이 정상 작동 중이며 모든 프리미엄 기능 이용 가능 */
    ACTIVE,

    /** 일시 중지 - 사용자 요청으로 구독이 일시 중지됨 (최대 3개월, 기능 이용 불가) */
    PAUSED,

    /** 취소됨 - 구독이 취소되었으나 기간 종료까지는 기능 이용 가능 */
    CANCELLED,

    /** 만료됨 - 구독 기간이 종료되어 프리미엄 기능 이용 불가 */
    EXPIRED,

    /** 연체 - 갱신 결제 실패로 연체 상태 (7일 내 결제 시 복구, 이후 만료) */
    PAST_DUE,

    /** 체험 중 - 신규 사용자 무료 체험 기간 (일반적으로 7일, 모든 기능 이용 가능) */
    TRIALING
}