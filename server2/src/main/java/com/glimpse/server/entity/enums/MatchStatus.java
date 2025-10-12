package com.glimpse.server.entity.enums;

/**
 * 매칭 상태 Enum
 *
 * <p>두 사용자 간의 매칭 관계와 상태를 나타내는 열거형입니다.
 * Glimpse 앱의 핵심인 익명 매칭 시스템의 상태를 관리합니다.</p>
 *
 * <p>사용처:</p>
 * <ul>
 *   <li>Match 엔티티 - status 필드</li>
 *   <li>Like 시스템 - 양방향 좋아요 확인</li>
 *   <li>채팅 시스템 - 매칭 성사 시 채팅방 생성</li>
 *   <li>알림 시스템 - 매칭 성사 알림</li>
 *   <li>프로필 공개 - 매칭 후 닉네임 공개</li>
 * </ul>
 *
 * <p>상태 전환:</p>
 * <ul>
 *   <li>PENDING → MATCHED (상대방도 좋아요 시)</li>
 *   <li>PENDING → EXPIRED (일정 시간 내 응답 없음, 기본 30일)</li>
 *   <li>MATCHED → UNMATCHED (한쪽이 매칭 해제)</li>
 *   <li>MATCHED/PENDING → BLOCKED (차단 시)</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
public enum MatchStatus {
    /** 대기 중 - 한쪽 사용자만 좋아요를 보낸 상태, 상대방 응답 대기 */
    PENDING,

    /** 매칭됨 - 양쪽 사용자 모두 좋아요를 보내 매칭이 성사된 상태, 채팅 가능 */
    MATCHED,

    /** 매칭 해제됨 - 매칭 성사 후 한쪽 사용자가 매칭을 해제한 상태 */
    UNMATCHED,

    /** 차단됨 - 한쪽 사용자가 상대방을 차단한 상태, 모든 상호작용 차단 */
    BLOCKED,

    /** 만료됨 - PENDING 상태에서 일정 시간(기본 30일) 동안 응답 없이 자동 만료된 상태 */
    EXPIRED
}