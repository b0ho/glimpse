package com.glimpse.server.dto.matching;

import lombok.*;
import java.time.LocalDateTime;

/**
 * 사용자 좋아요 데이터 전송 객체
 *
 * <p>매칭 시스템에서 사용자 간 좋아요 정보를 전달하기 위한 DTO입니다.
 * 일반 좋아요와 슈퍼 좋아요, 익명 좋아요를 지원하며, 좋아요의 상태와 만료 시간을 관리합니다.</p>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserLikeDto {
    /** 좋아요 고유 식별자 */
    private String id;

    /** 좋아요를 보낸 사용자 ID */
    private String senderId;

    /** 좋아요를 받은 사용자 ID */
    private String receiverId;

    /** 좋아요가 발생한 그룹 ID */
    private String groupId;

    /** 슈퍼 좋아요 여부 (프리미엄 기능) */
    private Boolean isSuperLike;

    /** 익명 좋아요 여부 */
    private Boolean isAnonymous;

    /** 좋아요와 함께 전송된 메시지 */
    private String message;

    /** 수신자가 확인했는지 여부 */
    private Boolean isSeen;

    /** 매칭 성공 여부 (양방향 좋아요) */
    private Boolean isMatched;

    /** 좋아요 생성 시간 */
    private LocalDateTime createdAt;

    /** 매칭 성공 시간 */
    private LocalDateTime matchedAt;

    /** 좋아요 만료 시간 */
    private LocalDateTime expiresAt;
}