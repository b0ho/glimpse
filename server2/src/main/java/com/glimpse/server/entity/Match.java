package com.glimpse.server.entity;

import com.glimpse.server.entity.enums.MatchStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 매칭 Entity
 * 두 사용자 간의 매칭 관계
 */
@Entity
@Table(name = "Match")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Match extends BaseEntity {
    
    @Id
    @GeneratedValue(generator = "cuid")
    @GenericGenerator(name = "cuid", strategy = "com.glimpse.server.util.CuidGenerator")
    @Column(name = "id")
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user1_id", nullable = false)
    private User user1;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user2_id", nullable = false)
    private User user2;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private MatchStatus status = MatchStatus.PENDING;
    
    @Column(name = "matched_at")
    private LocalDateTime matchedAt;
    
    @Column(name = "unmatched_at")
    private LocalDateTime unmatchedAt;
    
    @Column(name = "unmatch_reason")
    private String unmatchReason;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private Group group;
    
    @Column(name = "is_anonymous")
    @Builder.Default
    private Boolean isAnonymous = true;
    
    @Column(name = "reveal_requested_by")
    private String revealRequestedBy;
    
    @Column(name = "reveal_requested_at")
    private LocalDateTime revealRequestedAt;
    
    @Column(name = "revealed_at")
    private LocalDateTime revealedAt;
    
    // 본인 확인 코드
    @Column(name = "verification_code1")
    private String verificationCode1;
    
    @Column(name = "verification_code2")
    private String verificationCode2;
    
    @Column(name = "verification_expires_at")
    private LocalDateTime verificationExpiresAt;
    
    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;
    
    // 채팅 관련
    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;
    
    @Column(name = "last_message")
    private String lastMessage;
    
    @Column(name = "unread_count1")
    @Builder.Default
    private Integer unreadCount1 = 0;
    
    @Column(name = "unread_count2")
    @Builder.Default
    private Integer unreadCount2 = 0;
    
    // 통계
    @Column(name = "message_count")
    @Builder.Default
    private Integer messageCount = 0;
    
    @Column(name = "call_count")
    @Builder.Default
    private Integer callCount = 0;
    
    @Column(name = "video_call_count")
    @Builder.Default
    private Integer videoCallCount = 0;
    
    // 메타데이터
    @Column(name = "metadata", columnDefinition = "jsonb")
    private String metadata;
    
    // 관계 매핑
    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL)
    private List<ChatMessage> messages = new ArrayList<>();
    
    // 헬퍼 메소드
    public boolean isActive() {
        return status == MatchStatus.MATCHED && unmatchedAt == null;
    }
    
    public boolean canReveal() {
        return isAnonymous && status == MatchStatus.MATCHED;
    }
    
    public User getOtherUser(String userId) {
        if (user1 != null && userId != null && userId.equals(user1.getId())) {
            return user2;
        } else if (user2 != null && userId != null && userId.equals(user2.getId())) {
            return user1;
        }
        return null;
    }
    
    public void incrementUnreadCount(String userId) {
        if (user1 != null && userId != null && userId.equals(user1.getId())) {
            unreadCount2++;
        } else if (user2 != null && userId != null && userId.equals(user2.getId())) {
            unreadCount1++;
        }
    }
    
    public void resetUnreadCount(String userId) {
        if (user1 != null && userId != null && userId.equals(user1.getId())) {
            unreadCount1 = 0;
        } else if (user2 != null && userId != null && userId.equals(user2.getId())) {
            unreadCount2 = 0;
        }
    }
    
    public Integer getUnreadCount(String userId) {
        if (user1 != null && userId != null && userId.equals(user1.getId())) {
            return unreadCount1;
        } else if (user2 != null && userId != null && userId.equals(user2.getId())) {
            return unreadCount2;
        }
        return 0;
    }
}