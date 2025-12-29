package com.glimpse.server.entity.enums;

/**
 * 초대 상태 Enum
 *
 * <p>그룹 초대의 현재 상태를 나타내는 열거형입니다.
 * 초대 생성부터 최종 처리까지의 생명주기를 관리합니다.</p>
 *
 * <p>사용처:</p>
 * <ul>
 *   <li>GroupInvite 엔티티 - status 필드</li>
 *   <li>그룹 초대 시스템 - 초대 생명주기 관리</li>
 *   <li>알림 시스템 - 초대 상태별 알림</li>
 *   <li>그룹 멤버십 관리 - 초대 수락 시 가입 처리</li>
 * </ul>
 *
 * <p>상태 전환:</p>
 * <ul>
 *   <li>PENDING → ACCEPTED (사용자가 수락)</li>
 *   <li>PENDING → DECLINED (사용자가 거절)</li>
 *   <li>PENDING → EXPIRED (유효기간 만료)</li>
 *   <li>PENDING → CANCELLED (초대자가 취소)</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
public enum InviteStatus {
    /** 대기 중 - 초대가 발송되었으나 아직 응답 없음 */
    PENDING,

    /** 수락됨 - 사용자가 초대를 수락하고 그룹에 가입함 */
    ACCEPTED,

    /** 거절됨 - 사용자가 초대를 명시적으로 거절함 */
    DECLINED,

    /** 만료됨 - 유효기간(일반적으로 7일) 내에 응답하지 않아 자동 만료됨 */
    EXPIRED,

    /** 취소됨 - 초대를 보낸 사용자 또는 그룹 관리자가 초대를 취소함 */
    CANCELLED
}