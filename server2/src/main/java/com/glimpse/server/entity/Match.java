package com.glimpse.server.entity;

import com.glimpse.server.entity.enums.MatchStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Match 엔티티
 *
 * <p>두 사용자 간의 매칭 관계를 나타내는 엔티티입니다.
 * Glimpse의 익명 매칭 시스템의 핵심으로, 양방향 좋아요가 성사될 때 생성됩니다.</p>
 *
 * <p>주요 관계:</p>
 * <ul>
 *   <li>@ManyToOne User (user1): 매칭을 시작한 사용자 (LAZY 로딩)</li>
 *   <li>@ManyToOne User (user2): 매칭을 받은 사용자 (LAZY 로딩)</li>
 *   <li>@ManyToOne Group: 매칭이 이루어진 그룹 (LAZY 로딩, nullable)</li>
 *   <li>@OneToMany ChatMessage: 이 매칭에서 주고받은 채팅 메시지들 (CASCADE ALL)</li>
 * </ul>
 *
 * <p>주요 기능:</p>
 * <ul>
 *   <li>익명 매칭 및 신원 공개 요청/승인 관리</li>
 *   <li>본인 확인 코드 시스템</li>
 *   <li>채팅 메시지 및 읽지 않은 메시지 수 추적</li>
 *   <li>통화 통계 (음성/영상 통화 횟수)</li>
 *   <li>매칭 해제 및 사유 관리</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Entity
@Table(name = "Match")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Match extends BaseEntity {
    
    /**
     * 매칭 고유 식별자
     * <p>CUID 전략을 사용하여 자동 생성됩니다.</p>
     */
    @Id
    @GeneratedValue(generator = "cuid")
    @GenericGenerator(name = "cuid", strategy = "com.glimpse.server.util.CuidGenerator")
    @Column(name = "id")
    private String id;

    /**
     * 매칭의 첫 번째 사용자
     * <p>매칭을 시작한 사용자입니다. LAZY 로딩으로 성능을 최적화하며, null일 수 없습니다.</p>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user1_id", nullable = false)
    private User user1;

    /**
     * 매칭의 두 번째 사용자
     * <p>매칭을 받은 사용자입니다. LAZY 로딩으로 성능을 최적화하며, null일 수 없습니다.</p>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user2_id", nullable = false)
    private User user2;

    /**
     * 매칭 상태
     * <p>MatchStatus enum 타입 (PENDING, MATCHED, UNMATCHED 등). 기본값: PENDING</p>
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private MatchStatus status = MatchStatus.PENDING;

    /**
     * 매칭 성사 일시
     * <p>양방향 좋아요가 완료되어 매칭이 성사된 시각입니다.</p>
     */
    @Column(name = "matched_at")
    private LocalDateTime matchedAt;

    /**
     * 매칭 해제 일시
     * <p>매칭이 해제된 시각입니다. null이면 활성 매칭입니다.</p>
     */
    @Column(name = "unmatched_at")
    private LocalDateTime unmatchedAt;

    /**
     * 매칭 해제 사유
     * <p>사용자가 매칭을 해제한 이유를 저장합니다.</p>
     */
    @Column(name = "unmatch_reason")
    private String unmatchReason;

    /**
     * 매칭이 이루어진 그룹
     * <p>어떤 그룹에서 매칭이 성사되었는지 나타냅니다. LAZY 로딩이며 nullable입니다.</p>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private Group group;

    /**
     * 익명 매칭 여부
     * <p>아직 서로의 신원이 공개되지 않은 상태인지 나타냅니다. 기본값: true</p>
     */
    @Column(name = "is_anonymous")
    @Builder.Default
    private Boolean isAnonymous = true;

    /**
     * 신원 공개를 요청한 사용자 ID
     * <p>신원 공개(reveal)를 먼저 요청한 사용자의 ID입니다.</p>
     */
    @Column(name = "reveal_requested_by")
    private String revealRequestedBy;

    /**
     * 신원 공개 요청 일시
     * <p>신원 공개가 요청된 시각입니다.</p>
     */
    @Column(name = "reveal_requested_at")
    private LocalDateTime revealRequestedAt;

    /**
     * 신원 공개 완료 일시
     * <p>양측이 신원 공개에 동의하여 실제로 공개된 시각입니다.</p>
     */
    @Column(name = "revealed_at")
    private LocalDateTime revealedAt;

    /**
     * user1의 본인 확인 코드
     * <p>실제 만남을 위한 본인 확인용 코드입니다.</p>
     */
    @Column(name = "verification_code1")
    private String verificationCode1;

    /**
     * user2의 본인 확인 코드
     * <p>실제 만남을 위한 본인 확인용 코드입니다.</p>
     */
    @Column(name = "verification_code2")
    private String verificationCode2;

    /**
     * 본인 확인 코드 만료 일시
     * <p>확인 코드의 유효 기간입니다.</p>
     */
    @Column(name = "verification_expires_at")
    private LocalDateTime verificationExpiresAt;

    /**
     * 본인 확인 완료 일시
     * <p>오프라인 만남에서 본인 확인이 완료된 시각입니다.</p>
     */
    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    /**
     * 마지막 메시지 전송 일시
     * <p>이 매칭에서 마지막으로 메시지가 전송된 시각입니다.</p>
     */
    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    /**
     * 마지막 메시지 내용
     * <p>채팅 목록에서 미리보기로 표시할 마지막 메시지입니다.</p>
     */
    @Column(name = "last_message")
    private String lastMessage;

    /**
     * user1의 읽지 않은 메시지 수
     * <p>user1이 아직 읽지 않은 메시지의 개수입니다. 기본값: 0</p>
     */
    @Column(name = "unread_count1")
    @Builder.Default
    private Integer unreadCount1 = 0;

    /**
     * user2의 읽지 않은 메시지 수
     * <p>user2가 아직 읽지 않은 메시지의 개수입니다. 기본값: 0</p>
     */
    @Column(name = "unread_count2")
    @Builder.Default
    private Integer unreadCount2 = 0;

    /**
     * 총 메시지 수
     * <p>이 매칭에서 주고받은 전체 메시지 수입니다. 기본값: 0</p>
     */
    @Column(name = "message_count")
    @Builder.Default
    private Integer messageCount = 0;

    /**
     * 음성 통화 횟수
     * <p>음성 통화를 시도한 총 횟수입니다. 기본값: 0</p>
     */
    @Column(name = "call_count")
    @Builder.Default
    private Integer callCount = 0;

    /**
     * 영상 통화 횟수
     * <p>영상 통화를 시도한 총 횟수입니다. 기본값: 0</p>
     */
    @Column(name = "video_call_count")
    @Builder.Default
    private Integer videoCallCount = 0;

    /**
     * 메타데이터 (JSON)
     * <p>PostgreSQL JSONB 타입으로 저장되는 추가 정보입니다.</p>
     */
    @Column(name = "metadata", columnDefinition = "jsonb")
    private String metadata;

    /**
     * 매칭에서 주고받은 채팅 메시지들
     * <p>ChatMessage 엔티티의 match 필드와 매핑됩니다.
     * CascadeType.ALL로 인해 Match 삭제 시 모든 메시지도 함께 삭제됩니다.</p>
     */
    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL)
    private List<ChatMessage> messages = new ArrayList<>();

    /**
     * 매칭이 활성 상태인지 확인합니다.
     *
     * <p>status가 MATCHED이고 unmatchedAt이 null인 경우 활성 매칭입니다.</p>
     *
     * @return 활성 매칭이면 true, 그렇지 않으면 false
     */
    public boolean isActive() {
        return status == MatchStatus.MATCHED && unmatchedAt == null;
    }

    /**
     * 신원 공개가 가능한 상태인지 확인합니다.
     *
     * <p>익명 상태이고 매칭이 성사된 경우에만 신원 공개가 가능합니다.</p>
     *
     * @return 신원 공개 가능하면 true, 그렇지 않으면 false
     */
    public boolean canReveal() {
        return isAnonymous && status == MatchStatus.MATCHED;
    }

    /**
     * 주어진 사용자의 상대방을 반환합니다.
     *
     * <p>userId가 user1이면 user2를, user1이 아니면 user1을 반환합니다.</p>
     *
     * @param userId 기준이 되는 사용자 ID
     * @return 상대방 User 객체, 찾을 수 없으면 null
     */
    public User getOtherUser(String userId) {
        if (user1 != null && userId != null && userId.equals(user1.getId())) {
            return user2;
        } else if (user2 != null && userId != null && userId.equals(user2.getId())) {
            return user1;
        }
        return null;
    }

    /**
     * 상대방의 읽지 않은 메시지 수를 1 증가시킵니다.
     *
     * <p>userId가 user1이면 unreadCount2를, user2이면 unreadCount1을 증가시킵니다.</p>
     *
     * @param userId 메시지를 보낸 사용자 ID
     */
    public void incrementUnreadCount(String userId) {
        if (user1 != null && userId != null && userId.equals(user1.getId())) {
            unreadCount2++;
        } else if (user2 != null && userId != null && userId.equals(user2.getId())) {
            unreadCount1++;
        }
    }

    /**
     * 사용자의 읽지 않은 메시지 수를 0으로 초기화합니다.
     *
     * <p>채팅방에 입장하여 메시지를 읽을 때 호출됩니다.</p>
     *
     * @param userId 메시지를 읽은 사용자 ID
     */
    public void resetUnreadCount(String userId) {
        if (user1 != null && userId != null && userId.equals(user1.getId())) {
            unreadCount1 = 0;
        } else if (user2 != null && userId != null && userId.equals(user2.getId())) {
            unreadCount2 = 0;
        }
    }

    /**
     * 사용자의 읽지 않은 메시지 수를 조회합니다.
     *
     * @param userId 조회할 사용자 ID
     * @return 읽지 않은 메시지 수, 찾을 수 없으면 0
     */
    public Integer getUnreadCount(String userId) {
        if (user1 != null && userId != null && userId.equals(user1.getId())) {
            return unreadCount1;
        } else if (user2 != null && userId != null && userId.equals(user2.getId())) {
            return unreadCount2;
        }
        return 0;
    }
}