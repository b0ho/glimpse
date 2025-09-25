package com.glimpse.server.dto.group;

import com.glimpse.server.dto.user.UserDto;
import com.glimpse.server.entity.enums.GroupRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 그룹 멤버 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupMemberDto {
    private String id;
    private String groupId;
    private String userId;
    private UserDto user;
    private GroupRole role;
    private LocalDateTime joinedAt;
    private Boolean isVerified;
    private LocalDateTime verifiedAt;
    private String verificationMethod;
    private Boolean isActive;
    private LocalDateTime leftAt;
    private LocalDateTime bannedAt;
    private String banReason;
    private Integer contributionPoints;
    private LocalDateTime lastActiveAt;
    private Boolean notificationsEnabled;
}