package com.glimpse.server.entity;

import com.glimpse.server.entity.enums.GroupType;
import com.glimpse.server.entity.enums.GroupCategory;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 그룹 Entity
 * 사용자들이 속하는 그룹 (회사, 대학, 취미 등)
 */
@Entity
@Table(name = "Group")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Group extends BaseEntity {
    
    @Id
    @GeneratedValue(generator = "cuid")
    @GenericGenerator(name = "cuid", strategy = "com.glimpse.server.util.CuidGenerator")
    @Column(name = "id")
    private String id;
    
    @Column(name = "name", nullable = false)
    private String name;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private GroupType type;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "category")
    private GroupCategory category;
    
    @Column(name = "profile_image")
    private String profileImage;
    
    @Column(name = "cover_image")
    private String coverImage;
    
    @Column(name = "verification_required")
    @Builder.Default
    private Boolean verificationRequired = false;
    
    @Column(name = "verification_method")
    private String verificationMethod;
    
    @Column(name = "member_count")
    @Builder.Default
    private Integer memberCount = 0;
    
    @Column(name = "max_members")
    private Integer maxMembers;
    
    @Column(name = "is_public")
    @Builder.Default
    private Boolean isPublic = true;
    
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
    
    @Column(name = "is_official")
    @Builder.Default
    private Boolean isOfficial = false;
    
    @Column(name = "location")
    private String location;
    
    @Column(name = "latitude")
    private Double latitude;
    
    @Column(name = "longitude")
    private Double longitude;
    
    @Column(name = "radius")
    private Double radius;
    
    @Column(name = "invite_code", unique = true)
    private String inviteCode;
    
    @Column(name = "invite_code_expires_at")
    private LocalDateTime inviteCodeExpiresAt;
    
    // 그룹 설정 (JSON)
    @Column(name = "settings", columnDefinition = "jsonb")
    private String settings;
    
    @Column(name = "rules", columnDefinition = "jsonb")
    private String rules;
    
    @Column(name = "metadata", columnDefinition = "jsonb")
    private String metadata;
    
    // 통계
    @Column(name = "total_likes")
    @Builder.Default
    private Integer totalLikes = 0;
    
    @Column(name = "total_matches")
    @Builder.Default
    private Integer totalMatches = 0;
    
    @Column(name = "daily_active_users")
    @Builder.Default
    private Integer dailyActiveUsers = 0;
    
    @Column(name = "weekly_active_users")
    @Builder.Default
    private Integer weeklyActiveUsers = 0;
    
    // 관계 매핑
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", referencedColumnName = "id")
    private User creator;
    
    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL)
    private List<GroupMember> members = new ArrayList<>();
    
    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL)
    private List<GroupLike> groupLikes = new ArrayList<>();
    
    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL)
    private List<GroupInvite> invites = new ArrayList<>();
    
    // 태그
    @ElementCollection
    @CollectionTable(name = "group_tags", joinColumns = @JoinColumn(name = "group_id"))
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();
    
    // 헬퍼 메소드
    public boolean canJoin() {
        return isActive && isPublic && 
               (maxMembers == null || memberCount < maxMembers);
    }
    
    public boolean isNearbyGroup() {
        return type == GroupType.LOCATION && latitude != null && longitude != null;
    }
    
    public void incrementMemberCount() {
        this.memberCount++;
    }
    
    public void decrementMemberCount() {
        if (this.memberCount > 0) {
            this.memberCount--;
        }
    }
}