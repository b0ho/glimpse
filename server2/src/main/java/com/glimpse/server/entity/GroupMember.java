package com.glimpse.server.entity;

import com.glimpse.server.entity.enums.GroupRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;

/**
 * 그룹 멤버 Entity
 * 사용자와 그룹의 관계
 */
@Entity
@Table(name = "GroupMember")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupMember extends BaseEntity {
    
    @Id
    @GeneratedValue(generator = "cuid")
    @GenericGenerator(name = "cuid", strategy = "com.glimpse.server.util.CuidGenerator")
    @Column(name = "id")
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "role")
    @Builder.Default
    private GroupRole role = GroupRole.MEMBER;
    
    @Column(name = "joined_at")
    @Builder.Default
    private LocalDateTime joinedAt = LocalDateTime.now();
    
    @Column(name = "is_verified")
    @Builder.Default
    private Boolean isVerified = false;
    
    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;
    
    @Column(name = "verification_method")
    private String verificationMethod;
    
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
    
    @Column(name = "left_at")
    private LocalDateTime leftAt;
    
    @Column(name = "banned_at")
    private LocalDateTime bannedAt;
    
    @Column(name = "ban_reason")
    private String banReason;
    
    @Column(name = "contribution_points")
    @Builder.Default
    private Integer contributionPoints = 0;
    
    @Column(name = "last_active_at")
    private LocalDateTime lastActiveAt;
    
    // 알림 설정
    @Column(name = "notifications_enabled")
    @Builder.Default
    private Boolean notificationsEnabled = true;
    
    @Column(name = "notification_settings", columnDefinition = "jsonb")
    private String notificationSettings;
    
    // 헬퍼 메소드
    public boolean isAdmin() {
        return role == GroupRole.ADMIN || role == GroupRole.OWNER;
    }
    
    public boolean canManageMembers() {
        return role == GroupRole.ADMIN || role == GroupRole.OWNER || role == GroupRole.MODERATOR;
    }
    
    public void updateLastActive() {
        this.lastActiveAt = LocalDateTime.now();
    }
}