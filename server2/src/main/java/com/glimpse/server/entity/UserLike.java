package com.glimpse.server.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;

/**
 * 좋아요 Entity
 * 사용자 간 좋아요 표현
 */
@Entity
@Table(name = "UserLike")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserLike extends BaseEntity {
    
    @Id
    @GeneratedValue(generator = "cuid")
    @GenericGenerator(name = "cuid", strategy = "com.glimpse.server.util.CuidGenerator")
    @Column(name = "id")
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private Group group;
    
    @Column(name = "is_super_like")
    @Builder.Default
    private Boolean isSuperLike = false;
    
    @Column(name = "is_anonymous")
    @Builder.Default
    private Boolean isAnonymous = true;
    
    @Column(name = "message")
    private String message;
    
    @Column(name = "is_seen")
    @Builder.Default
    private Boolean isSeen = false;
    
    @Column(name = "seen_at")
    private LocalDateTime seenAt;
    
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
    
    @Column(name = "is_matched")
    @Builder.Default
    private Boolean isMatched = false;
    
    @Column(name = "matched_at")
    private LocalDateTime matchedAt;
    
    // 헬퍼 메소드
    public boolean isExpired() {
        return expiresAt != null && expiresAt.isBefore(LocalDateTime.now());
    }
    
    public void markAsSeen() {
        this.isSeen = true;
        this.seenAt = LocalDateTime.now();
    }
}