package com.glimpse.server.dto.matching;

import com.glimpse.server.entity.enums.MatchStatus;
import lombok.*;
import java.time.LocalDateTime;

/**
 * 매칭 정보 데이터 전송 객체
 *
 * <p>양방향 좋아요로 성공한 매칭의 상세 정보를 전달합니다.
 * 매칭 상태, 상대방 정보, 채팅 정보, 익명 여부 등을 포함하며,
 * 매칭의 전체 생명주기를 추적합니다.</p>
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
public class MatchDto {
    /** 매칭 고유 식별자 */
    private String id;

    /** 첫 번째 사용자 ID */
    private String user1Id;

    /** 두 번째 사용자 ID */
    private String user2Id;

    /** 상대방 사용자 ID (현재 사용자 기준) */
    private String otherUserId;

    /** 상대방 닉네임 */
    private String otherUserNickname;

    /** 상대방 프로필 이미지 URL */
    private String otherUserProfileImage;

    /** 매칭 상태 (ACTIVE, UNMATCHED, BLOCKED 등) */
    private MatchStatus status;

    /** 익명 매칭 여부 */
    private Boolean isAnonymous;

    /** 매칭이 발생한 그룹 ID */
    private String groupId;

    /** 매칭 성공 시간 */
    private LocalDateTime matchedAt;

    /** 매칭 해제 시간 */
    private LocalDateTime unmatchedAt;

    /** 신원 공개 시간 (익명 해제) */
    private LocalDateTime revealedAt;

    /** 인증 완료 시간 */
    private LocalDateTime verifiedAt;

    /** 마지막 메시지 내용 */
    private String lastMessage;

    /** 마지막 메시지 전송 시간 */
    private LocalDateTime lastMessageAt;

    /** 읽지 않은 메시지 수 */
    private Integer unreadCount;

    /** 매칭 생성 시간 */
    private LocalDateTime createdAt;

    /** 매칭 정보 수정 시간 */
    private LocalDateTime updatedAt;
}