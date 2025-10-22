package com.glimpse.server.dto.interest;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Interest Match DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterestMatchDto {
    private String id;
    private String userId;
    private String matchedUserId;
    private String matchedUserNickname;
    private String matchedUserProfileImage;
    private String groupId;
    private String groupName;
    private Boolean isRevealed;
    private LocalDateTime matchedAt;
    private LocalDateTime createdAt;
}
