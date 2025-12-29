package com.glimpse.server.entity.enums;

/**
 * 성별 Enum
 *
 * <p>사용자의 성별을 나타내는 열거형입니다.</p>
 *
 * <p>사용처:</p>
 * <ul>
 *   <li>User 엔티티 - gender 필드</li>
 *   <li>ProfileInfo 엔티티 - gender 필드</li>
 *   <li>매칭 알고리즘 - 성별 기반 필터링</li>
 *   <li>사용자 프로필 설정 - 성별 정보 표시</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
public enum Gender {
    /** 남성 - 사용자가 남성으로 식별됨 */
    MALE,

    /** 여성 - 사용자가 여성으로 식별됨 */
    FEMALE,

    /** 기타 - 남성/여성 이외의 성별 또는 밝히지 않음 */
    OTHER
}