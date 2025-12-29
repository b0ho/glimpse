package com.glimpse.server.dto.match;

import com.glimpse.server.dto.user.UserDto;
import com.glimpse.server.entity.enums.MatchStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Match DTO
 *
 * <p>매칭 정보를 전송하기 위한 Data Transfer Object입니다.</p>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchDto {

    /** 매칭 ID */
    private String id;

    /** 매칭 상태 */
    private MatchStatus status;

    /** 상대방 사용자 정보 */
    private UserDto otherUser;

    /** 그룹 ID */
    private String groupId;

    /** 익명 매칭 여부 */
    private Boolean isAnonymous;

    /** 신원 공개 요청자 ID */
    private String revealRequestedBy;

    /** 신원 공개 요청 일시 */
    private LocalDateTime revealRequestedAt;

    /** 신원 공개 완료 일시 */
    private LocalDateTime revealedAt;

    /** 마지막 메시지 내용 */
    private String lastMessage;

    /** 마지막 메시지 전송 일시 */
    private LocalDateTime lastMessageAt;

    /** 읽지 않은 메시지 수 (현재 사용자 기준) */
    private Integer unreadCount;

    /** 총 메시지 수 */
    private Integer messageCount;

    /** 매칭 성사 일시 */
    private LocalDateTime matchedAt;

    /** 매칭 해제 일시 */
    private LocalDateTime unmatchedAt;

    /** 매칭 해제 사유 */
    private String unmatchReason;

    /** 생성 일시 */
    private LocalDateTime createdAt;

    /** 수정 일시 */
    private LocalDateTime updatedAt;
}
