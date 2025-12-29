package com.glimpse.server.entity;

import com.glimpse.server.entity.enums.GroupRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;

/**
 * GroupMember 엔티티
 *
 * <p>사용자와 그룹 간의 멤버십 관계를 나타내는 엔티티입니다.
 * 사용자가 어떤 그룹에 속해 있고, 그 그룹 내에서 어떤 역할을 가지는지 관리합니다.</p>
 *
 * <p>주요 관계:</p>
 * <ul>
 *   <li>@ManyToOne Group: 멤버가 속한 그룹 (LAZY 로딩, nullable하지 않음)</li>
 *   <li>@ManyToOne User: 그룹에 속한 사용자 (LAZY 로딩, nullable하지 않음)</li>
 * </ul>
 *
 * <p>주요 기능:</p>
 * <ul>
 *   <li>그룹 내 역할 관리 (OWNER, ADMIN, MODERATOR, MEMBER)</li>
 *   <li>본인 인증 시스템</li>
 *   <li>멤버 활성화/비활성화 (탈퇴, 차단)</li>
 *   <li>기여도 포인트 관리</li>
 *   <li>그룹별 알림 설정</li>
 *   <li>마지막 활동 시각 추적</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Entity
@Table(name = "GroupMember")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupMember extends BaseEntity {

    /**
     * 그룹 멤버십 고유 식별자
     * <p>CUID 전략을 사용하여 자동 생성됩니다.</p>
     */
    @Id
    @GeneratedValue(generator = "cuid")
    @GenericGenerator(name = "cuid", strategy = "com.glimpse.server.util.CuidGenerator")
    @Column(name = "id")
    private String id;

    /**
     * 멤버가 속한 그룹
     * <p>LAZY 로딩으로 성능을 최적화하며, null일 수 없습니다.</p>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    /**
     * 그룹에 속한 사용자
     * <p>LAZY 로딩으로 성능을 최적화하며, null일 수 없습니다.</p>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * 그룹 내 역할
     * <p>GroupRole enum (OWNER, ADMIN, MODERATOR, MEMBER). 기본값: MEMBER</p>
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "role")
    @Builder.Default
    private GroupRole role = GroupRole.MEMBER;

    /**
     * 가입 일시
     * <p>그룹에 가입한 시각입니다. 기본값: 현재 시각</p>
     */
    @Column(name = "joined_at")
    @Builder.Default
    private LocalDateTime joinedAt = LocalDateTime.now();

    /**
     * 본인 인증 여부
     * <p>그룹 가입 시 요구되는 본인 인증 완료 여부입니다. 기본값: false</p>
     */
    @Column(name = "is_verified")
    @Builder.Default
    private Boolean isVerified = false;

    /**
     * 인증 완료 일시
     * <p>본인 인증이 완료된 시각입니다.</p>
     */
    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    /**
     * 인증 방법
     * <p>어떤 방법으로 본인 인증을 했는지 기록합니다 (예: 회사 이메일, 학생증 등).</p>
     */
    @Column(name = "verification_method")
    private String verificationMethod;

    /**
     * 활성 멤버 여부
     * <p>현재 그룹에서 활성 상태인 멤버인지 여부입니다. 기본값: true</p>
     */
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    /**
     * 탈퇴 일시
     * <p>그룹에서 탈퇴한 시각입니다. null이면 현재 멤버입니다.</p>
     */
    @Column(name = "left_at")
    private LocalDateTime leftAt;

    /**
     * 차단 일시
     * <p>그룹에서 차단당한 시각입니다. null이면 차단되지 않은 상태입니다.</p>
     */
    @Column(name = "banned_at")
    private LocalDateTime bannedAt;

    /**
     * 차단 사유
     * <p>그룹에서 차단된 이유를 기록합니다.</p>
     */
    @Column(name = "ban_reason")
    private String banReason;

    /**
     * 기여도 포인트
     * <p>그룹 내 활동으로 얻은 기여도 점수입니다. 기본값: 0</p>
     */
    @Column(name = "contribution_points")
    @Builder.Default
    private Integer contributionPoints = 0;

    /**
     * 마지막 활동 일시
     * <p>그룹 내에서 마지막으로 활동한 시각입니다.</p>
     */
    @Column(name = "last_active_at")
    private LocalDateTime lastActiveAt;

    /**
     * 알림 활성화 여부
     * <p>이 그룹의 알림을 받을지 여부입니다. 기본값: true</p>
     */
    @Column(name = "notifications_enabled")
    @Builder.Default
    private Boolean notificationsEnabled = true;

    /**
     * 알림 설정 (JSON)
     * <p>PostgreSQL JSONB 타입으로 저장되는 그룹별 알림 세부 설정입니다.</p>
     */
    @Column(name = "notification_settings", columnDefinition = "jsonb")
    private String notificationSettings;

    /**
     * 관리자 권한이 있는지 확인합니다.
     *
     * <p>OWNER 또는 ADMIN 역할인 경우 관리자 권한이 있습니다.</p>
     *
     * @return 관리자 권한이 있으면 true, 그렇지 않으면 false
     */
    public boolean isAdmin() {
        return role == GroupRole.ADMIN || role == GroupRole.OWNER;
    }

    /**
     * 멤버 관리 권한이 있는지 확인합니다.
     *
     * <p>OWNER, ADMIN, MODERATOR 역할인 경우 멤버를 관리할 수 있습니다.</p>
     *
     * @return 멤버 관리 권한이 있으면 true, 그렇지 않으면 false
     */
    public boolean canManageMembers() {
        return role == GroupRole.ADMIN || role == GroupRole.OWNER || role == GroupRole.MODERATOR;
    }

    /**
     * 마지막 활동 시각을 현재 시각으로 업데이트합니다.
     *
     * <p>그룹 내에서 활동이 발생할 때 호출됩니다.</p>
     */
    public void updateLastActive() {
        this.lastActiveAt = LocalDateTime.now();
    }
}
