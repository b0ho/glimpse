package com.glimpse.server.entity.enums;

/**
 * 프리미엄 레벨 Enum
 *
 * <p>사용자의 구독 등급을 나타내는 열거형입니다.
 * 등급에 따라 이용 가능한 기능과 제한 사항이 달라집니다.</p>
 *
 * <p>사용처:</p>
 * <ul>
 *   <li>User 엔티티 - premiumLevel 필드</li>
 *   <li>기능 접근 제어 - 등급별 권한 체크</li>
 *   <li>UI 표시 - 프리미엄 배지 및 혜택 안내</li>
 *   <li>좋아요 시스템 - 등급별 일일 좋아요 제한</li>
 *   <li>매칭 알고리즘 - 프리미엄 사용자 우선 노출</li>
 * </ul>
 *
 * <p>등급별 주요 혜택:</p>
 * <ul>
 *   <li>FREE: 1 daily like, 기본 매칭</li>
 *   <li>BASIC: 크레딧 구매로 추가 좋아요</li>
 *   <li>PREMIUM: 무제한 좋아요, 좋아요 받은 사람 확인, 읽음 표시</li>
 *   <li>VIP: PREMIUM 혜택 + 우선 매칭, 슈퍼 좋아요, 프로필 강조</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
public enum PremiumLevel {
    /** 무료 - 기본 기능만 이용 가능 (일일 1회 좋아요) */
    FREE,

    /** 베이직 - 크레딧 구매로 추가 기능 이용 (좋아요 추가 구매) */
    BASIC,

    /** 프리미엄 - 월/연 구독 회원 (무제한 좋아요, 고급 기능) */
    PREMIUM,

    /** VIP - 최상위 구독 회원 (모든 기능 + 독점 혜택) */
    VIP
}