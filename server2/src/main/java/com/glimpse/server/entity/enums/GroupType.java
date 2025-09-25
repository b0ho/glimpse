package com.glimpse.server.entity.enums;

/**
 * 그룹 타입 Enum
 */
public enum GroupType {
    OFFICIAL,    // 공식 그룹 (회사, 대학)
    CREATED,     // 사용자 생성 그룹
    INSTANCE,    // 인스턴스 그룹 (임시)
    LOCATION     // 위치 기반 그룹
}