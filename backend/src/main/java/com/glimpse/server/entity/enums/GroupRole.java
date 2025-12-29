package com.glimpse.server.entity.enums;

/**
 * 그룹 내 역할 Enum
 *
 * <p>그룹 내에서 사용자의 역할과 권한 레벨을 정의하는 열거형입니다.
 * 역할에 따라 그룹 설정 변경, 멤버 관리, 콘텐츠 중재 등의 권한이 달라집니다.</p>
 *
 * <p>사용처:</p>
 * <ul>
 *   <li>GroupMember 엔티티 - role 필드</li>
 *   <li>그룹 권한 관리 - 역할별 접근 제어</li>
 *   <li>그룹 관리 기능 - 멤버 승격/강등</li>
 *   <li>콘텐츠 중재 - 역할별 중재 권한</li>
 * </ul>
 *
 * <p>권한 계층: OWNER > ADMIN > MODERATOR > MEMBER</p>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
public enum GroupRole {
    /** 그룹 소유자 - 그룹을 생성한 사용자, 모든 권한 보유 (그룹 삭제, 소유권 이전 가능) */
    OWNER,

    /** 관리자 - 그룹 설정 변경 및 멤버 관리 권한 보유 (멤버 추방, 중재자 지정 가능) */
    ADMIN,

    /** 중재자 - 콘텐츠 중재 및 부분적인 멤버 관리 권한 보유 (게시물 삭제, 멤버 경고 가능) */
    MODERATOR,

    /** 일반 멤버 - 기본 활동 권한만 보유 (게시물 작성, 댓글 작성 가능) */
    MEMBER
}