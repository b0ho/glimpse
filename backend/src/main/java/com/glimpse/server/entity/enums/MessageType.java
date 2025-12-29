package com.glimpse.server.entity.enums;

/**
 * 메시지 타입 Enum
 *
 * <p>채팅 메시지의 콘텐츠 유형을 구분하는 열거형입니다.
 * 각 타입에 따라 메시지 렌더링, 저장, 처리 방식이 달라집니다.</p>
 *
 * <p>사용처:</p>
 * <ul>
 *   <li>Message 엔티티 - type 필드</li>
 *   <li>채팅 UI - 타입별 메시지 렌더링</li>
 *   <li>파일 업로드 - 미디어 파일 처리</li>
 *   <li>알림 시스템 - 메시지 타입별 알림 형식</li>
 *   <li>메시지 검색 - 타입별 필터링</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
public enum MessageType {
    /** 텍스트 메시지 - 일반 텍스트 콘텐츠 (가장 기본적인 메시지 형식) */
    TEXT,

    /** 이미지 - 사진 또는 이미지 파일 (JPG, PNG, GIF 등 지원) */
    IMAGE,

    /** 비디오 - 동영상 파일 (MP4, MOV 등 지원) */
    VIDEO,

    /** 음성 - 음성 메시지 또는 오디오 파일 (MP3, M4A 등 지원) */
    AUDIO,

    /** 파일 - 기타 문서 및 파일 (PDF, DOC 등 지원) */
    FILE,

    /** 스티커 - 이모티콘 스티커 (프리미엄 스티커 팩 포함) */
    STICKER,

    /** 위치 - 지도 위치 정보 (Kakao Maps 연동) */
    LOCATION,

    /** 시스템 메시지 - 자동 생성된 알림 메시지 (매칭 성사, 사용자 입장/퇴장 등) */
    SYSTEM
}