package com.glimpse.server.dto.group;

import com.glimpse.server.entity.enums.GroupCategory;
import com.glimpse.server.entity.enums.GroupType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Group DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupDto {
    private String id;
    private String name;
    private String description;
    private GroupType type;
    private GroupCategory category;
    private String profileImage;
    private String coverImage;
    private Boolean verificationRequired;
    private String verificationMethod;
    private Integer memberCount;
    private Integer maxMembers;
    private Boolean isPublic;
    private Boolean isActive;
    private Boolean isOfficial;
    private String location;
    private Double latitude;
    private Double longitude;
    private Double radius;
    private String inviteCode;
    private LocalDateTime inviteCodeExpiresAt;
    private String creatorId;
    private List<String> tags;
    private Integer totalLikes;
    private Integer totalMatches;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}