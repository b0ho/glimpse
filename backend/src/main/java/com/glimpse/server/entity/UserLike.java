package com.glimpse.server.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;

/**
 * UserLike 엔티티
 *
 * <p>사용자 간의 좋아요를 나타내는 엔티티입니다.
 * Glimpse의 익명 매칭 시스템에서 관심 표현의 수단이며, 양방향 좋아요 시 매칭이 성사됩니다.</p>
 *
 * <p>주요 관계:</p>
 * <ul>
 *   <li>@ManyToOne User (sender): 좋아요를 보낸 사용자 (LAZY 로딩, nullable하지 않음)</li>
 *   <li>@ManyToOne User (receiver): 좋아요를 받은 사용자 (LAZY 로딩, nullable하지 않음)</li>
 *   <li>@ManyToOne Group: 좋아요가 발생한 그룹 (LAZY 로딩, nullable)</li>
 * </ul>
 *
 * <p>주요 기능:</p>
 * <ul>
 *   <li>일반 좋아요 및 슈퍼 좋아요 구분</li>
 *   <li>익명 좋아요 시스템</li>
 *   <li>좋아요와 함께 메시지 전송 가능</li>
 *   <li>읽음 확인 기능</li>
 *   <li>좋아요 만료 시간 설정</li>
 *   <li>매칭 성사 여부 추적</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Entity
@Table(name = "user_like")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserLike extends BaseEntity {

    /**
     * 좋아요 고유 식별자
     * <p>CUID 전략을 사용하여 자동 생성됩니다.</p>
     */
    @Id
    @GeneratedValue(generator = "cuid")
    @GenericGenerator(name = "cuid", strategy = "com.glimpse.server.util.CuidGenerator")
    @Column(name = "id")
    private String id;

    /**
     * 좋아요 발신자
     * <p>좋아요를 보낸 사용자입니다.
     * LAZY 로딩으로 성능을 최적화하며, null일 수 없습니다.</p>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    /**
     * 좋아요 수신자
     * <p>좋아요를 받은 사용자입니다.
     * LAZY 로딩으로 성능을 최적화하며, null일 수 없습니다.</p>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    /**
     * 좋아요가 발생한 그룹
     * <p>어떤 그룹에서 좋아요가 발생했는지 나타냅니다.
     * LAZY 로딩으로 성능을 최적화하며, nullable입니다.</p>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private Group group;

    /**
     * 슈퍼 좋아요 여부
     * <p>프리미엄 기능인 슈퍼 좋아요인지 여부입니다. 기본값: false</p>
     */
    @Column(name = "is_super_like")
    @Builder.Default
    private Boolean isSuperLike = false;

    /**
     * 익명 좋아요 여부
     * <p>발신자의 신원이 공개되지 않은 익명 좋아요인지 여부입니다. 기본값: true</p>
     */
    @Column(name = "is_anonymous")
    @Builder.Default
    private Boolean isAnonymous = true;

    /**
     * 좋아요 메시지
     * <p>좋아요와 함께 전송할 수 있는 짧은 메시지입니다.</p>
     */
    @Column(name = "message")
    private String message;

    /**
     * 읽음 여부
     * <p>수신자가 좋아요를 확인했는지 여부입니다. 기본값: false</p>
     */
    @Column(name = "is_seen")
    @Builder.Default
    private Boolean isSeen = false;

    /**
     * 읽은 일시
     * <p>수신자가 좋아요를 확인한 시각입니다.</p>
     */
    @Column(name = "seen_at")
    private LocalDateTime seenAt;

    /**
     * 만료 일시
     * <p>좋아요의 유효 기간입니다. 이 시각 이후에는 매칭이 불가능합니다.</p>
     */
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    /**
     * 매칭 성사 여부
     * <p>이 좋아요로 인해 매칭이 성사되었는지 여부입니다. 기본값: false</p>
     */
    @Column(name = "is_matched")
    @Builder.Default
    private Boolean isMatched = false;

    /**
     * 매칭 성사 일시
     * <p>이 좋아요로 인해 매칭이 성사된 시각입니다.</p>
     */
    @Column(name = "matched_at")
    private LocalDateTime matchedAt;

    /**
     * 좋아요가 만료되었는지 확인합니다.
     *
     * <p>expiresAt이 설정되어 있고 현재 시각보다 이전인 경우 만료된 것입니다.</p>
     *
     * @return 만료되었으면 true, 그렇지 않으면 false
     */
    public boolean isExpired() {
        return expiresAt != null && expiresAt.isBefore(LocalDateTime.now());
    }

    /**
     * 좋아요를 읽음 처리합니다.
     *
     * <p>isSeen을 true로 설정하고 seenAt을 현재 시각으로 설정합니다.</p>
     */
    public void markAsSeen() {
        this.isSeen = true;
        this.seenAt = LocalDateTime.now();
    }
}
