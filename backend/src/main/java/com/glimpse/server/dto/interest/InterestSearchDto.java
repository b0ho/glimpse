package com.glimpse.server.dto.interest;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Interest Search DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterestSearchDto {
    private String id;
    private String userId;
    private String nickname;
    private String profileImage;
    private String groupId;
    private String groupName;
    private String description;
    private Boolean isActive;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
