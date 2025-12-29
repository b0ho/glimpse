package com.glimpse.server.entity.enums;

/**
 * 알림 타입 Enum
 *
 * <p>사용자에게 전송되는 알림의 종류를 구분하는 열거형입니다.
 * 각 알림 타입에 따라 표시 형식, 우선순위, 사용자 설정이 달라집니다.</p>
 *
 * <p>사용처:</p>
 * <ul>
 *   <li>Notification 엔티티 - type 필드</li>
 *   <li>푸시 알림 시스템 - Firebase FCM 전송</li>
 *   <li>알림 설정 - 타입별 알림 켜기/끄기</li>
 *   <li>인앱 알림 - 타입별 아이콘 및 액션</li>
 *   <li>알림 필터링 - 타입별 정렬 및 분류</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
public enum NotificationType {
    /** 매칭 알림 - 양방향 좋아요로 매칭이 성사된 경우 (높은 우선순위) */
    MATCH,

    /** 좋아요 받음 - 다른 사용자가 나에게 좋아요를 보낸 경우 (프리미엄 기능) */
    LIKE_RECEIVED,

    /** 메시지 - 새로운 채팅 메시지 수신 (실시간 알림) */
    MESSAGE,

    /** 그룹 초대 - 그룹 가입 초대를 받은 경우 */
    GROUP_INVITE,

    /** 인증 - 공식 그룹 인증 요청의 승인/거부 결과 */
    VERIFICATION,

    /** 결제 - 결제 완료, 구독 갱신, 환불 등 결제 관련 알림 */
    PAYMENT,

    /** 시스템 - 서비스 점검, 정책 변경 등 시스템 관련 중요 공지 */
    SYSTEM,

    /** 프로모션 - 이벤트, 할인, 신규 기능 등 마케팅 알림 (사용자 설정 가능) */
    PROMOTION,

    /** 업데이트 - 앱 버전 업데이트 안내 */
    UPDATE
}