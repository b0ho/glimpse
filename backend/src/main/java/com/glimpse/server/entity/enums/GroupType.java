package com.glimpse.server.entity.enums;

/**
 * 그룹 타입 Enum
 *
 * <p>그룹의 생성 방식과 성격에 따른 분류를 나타내는 열거형입니다.
 * 각 타입에 따라 인증 요구사항, 지속성, 공개 범위가 달라집니다.</p>
 *
 * <p>사용처:</p>
 * <ul>
 *   <li>Group 엔티티 - type 필드</li>
 *   <li>그룹 생성 - 타입별 생성 프로세스</li>
 *   <li>인증 시스템 - 공식 그룹 인증 요구</li>
 *   <li>그룹 검색 - 타입별 필터링</li>
 *   <li>매칭 알고리즘 - 그룹 기반 매칭</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
public enum GroupType {
    /** 공식 그룹 - 회사나 대학교 등 공식 기관 그룹 (이메일 또는 문서 인증 필수) */
    OFFICIAL,

    /** 사용자 생성 그룹 - 일반 사용자가 생성한 영구 그룹 (관심사 기반, 제한 없음) */
    CREATED,

    /** 인스턴스 그룹 - 특정 이벤트나 기간을 위한 임시 그룹 (자동 만료 설정 가능) */
    INSTANCE,

    /** 위치 기반 그룹 - 특정 지역이나 장소를 중심으로 한 그룹 (GPS 위치 기반 가입) */
    LOCATION
}