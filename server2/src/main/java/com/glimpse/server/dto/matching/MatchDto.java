package com.glimpse.server.dto.matching;

import com.glimpse.server.entity.enums.MatchStatus;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchDto {
    private String id;
    private String user1Id;
    private String user2Id;
    private String otherUserId;
    private String otherUserNickname;
    private String otherUserProfileImage;
    private MatchStatus status;
    private Boolean isAnonymous;
    private String groupId;
    private LocalDateTime matchedAt;
    private LocalDateTime unmatchedAt;
    private LocalDateTime revealedAt;
    private LocalDateTime verifiedAt;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private Integer unreadCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}