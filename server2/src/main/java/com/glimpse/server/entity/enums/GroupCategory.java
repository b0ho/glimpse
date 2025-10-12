package com.glimpse.server.entity.enums;

/**
 * 그룹 카테고리 Enum
 *
 * <p>그룹의 주제와 성격을 구분하는 카테고리 열거형입니다.
 * 사용자들이 관심사에 따라 그룹을 검색하고 필터링하는 데 사용됩니다.</p>
 *
 * <p>사용처:</p>
 * <ul>
 *   <li>Group 엔티티 - category 필드</li>
 *   <li>그룹 검색 - 카테고리별 필터링</li>
 *   <li>그룹 추천 - 사용자 관심사 기반 매칭</li>
 *   <li>그룹 생성 - 카테고리 선택</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
public enum GroupCategory {
    /** 회사 - 직장 동료들의 그룹 */
    COMPANY,

    /** 대학교 - 대학생 및 졸업생 그룹 */
    UNIVERSITY,

    /** 취미 - 공통 취미 활동 그룹 */
    HOBBY,

    /** 스포츠 - 운동 및 스포츠 활동 그룹 */
    SPORTS,

    /** 스터디 - 학습 및 자기계발 그룹 */
    STUDY,

    /** 소셜 - 친목 및 사교 활동 그룹 */
    SOCIAL,

    /** 게임 - 게임 플레이 및 e스포츠 그룹 */
    GAMING,

    /** 여행 - 여행 계획 및 경험 공유 그룹 */
    TRAVEL,

    /** 음식 - 맛집 탐방 및 요리 그룹 */
    FOOD,

    /** 음악 - 음악 감상 및 연주 그룹 */
    MUSIC,

    /** 예술 - 미술, 문학 등 예술 활동 그룹 */
    ART,

    /** 기술 - IT 기술 및 개발 관련 그룹 */
    TECH,

    /** 기타 - 위 카테고리에 속하지 않는 그룹 */
    OTHER
}