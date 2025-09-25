package com.glimpse.server.entity;

import com.glimpse.server.entity.enums.InviteStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;

/**
 * 그룹 초대 Entity
 */
@Entity
@Table(name = "GroupInvite")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupInvite extends BaseEntity {
    
    @Id
    @GeneratedValue(generator = "cuid")
    @GenericGenerator(name = "cuid", strategy = "com.glimpse.server.util.CuidGenerator")
    @Column(name = "id")
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inviter_id", nullable = false)
    private User inviter;
    
    @Column(name = "invitee_phone")
    private String inviteePhone;
    
    @Column(name = "invitee_email")
    private String inviteeEmail;
    
    @Column(name = "invite_code", unique = true)
    private String inviteCode;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    @Builder.Default
    private InviteStatus status = InviteStatus.PENDING;
    
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
    
    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;
    
    @Column(name = "declined_at")
    private LocalDateTime declinedAt;
    
    @Column(name = "message")
    private String message;
    
    // 헬퍼 메소드
    public boolean isExpired() {
        return expiresAt != null && expiresAt.isBefore(LocalDateTime.now());
    }
    
    public void accept() {
        this.status = InviteStatus.ACCEPTED;
        this.acceptedAt = LocalDateTime.now();
    }
    
    public void decline() {
        this.status = InviteStatus.DECLINED;
        this.declinedAt = LocalDateTime.now();
    }
}