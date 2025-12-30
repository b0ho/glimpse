package com.glimpse.server.entity;

import com.glimpse.server.entity.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;

/**
 * Notification 엔티티
 *
 * <p>사용자에게 전송되는 알림을 나타내는 엔티티입니다.
 * 좋아요, 매칭, 메시지, 시스템 공지 등 다양한 유형의 알림을 관리합니다.</p>
 *
 * <p>주요 관계:</p>
 * <ul>
 *   <li>@ManyToOne User: 알림을 받는 사용자 (LAZY 로딩, nullable하지 않음)</li>
 * </ul>
 *
 * <p>주요 기능:</p>
 * <ul>
 *   <li>다양한 알림 타입 지원 (MATCH, LIKE, MESSAGE, SYSTEM 등)</li>
 *   <li>읽음 확인 기능</li>
 *   <li>푸시 알림 전송 추적</li>
 *   <li>액션 URL 및 데이터 지원 (딥링크)</li>
 *   <li>알림 만료 시간 설정</li>
 *   <li>이미지 첨부 지원</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Entity
@Table(name = "notification")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification extends BaseEntity {

    /**
     * 알림 고유 식별자
     * <p>CUID 전략을 사용하여 자동 생성됩니다.</p>
     */
    @Id
    @GeneratedValue(generator = "cuid")
    @GenericGenerator(name = "cuid", strategy = "com.glimpse.server.util.CuidGenerator")
    @Column(name = "id")
    private String id;

    /**
     * 알림을 받는 사용자
     * <p>LAZY 로딩으로 성능을 최적화하며, null일 수 없습니다.</p>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * 알림 타입
     * <p>NotificationType enum (MATCH, LIKE, MESSAGE, SYSTEM 등).
     * 알림의 종류를 나타내며, null일 수 없습니다.</p>
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private NotificationType type;

    /**
     * 알림 제목
     * <p>알림의 간략한 제목입니다. null일 수 없습니다.</p>
     */
    @Column(name = "title", nullable = false)
    private String title;

    /**
     * 알림 내용
     * <p>알림의 상세 내용입니다. TEXT 타입으로 긴 내용을 지원하며, null일 수 없습니다.</p>
     */
    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    /**
     * 읽음 여부
     * <p>사용자가 알림을 읽었는지 여부입니다. 기본값: false</p>
     */
    @Column(name = "is_read")
    @Builder.Default
    private Boolean isRead = false;

    /**
     * 읽은 일시
     * <p>사용자가 알림을 읽은 시각입니다.</p>
     */
    @Column(name = "read_at")
    private LocalDateTime readAt;

    /**
     * 푸시 전송 여부
     * <p>모바일 푸시 알림이 전송되었는지 여부입니다. 기본값: false</p>
     */
    @Column(name = "is_pushed")
    @Builder.Default
    private Boolean isPushed = false;

    /**
     * 푸시 전송 일시
     * <p>푸시 알림이 전송된 시각입니다.</p>
     */
    @Column(name = "pushed_at")
    private LocalDateTime pushedAt;

    /**
     * 액션 URL
     * <p>알림 클릭 시 이동할 딥링크 URL입니다.</p>
     */
    @Column(name = "action_url")
    private String actionUrl;

    /**
     * 액션 데이터 (JSON)
     * <p>PostgreSQL JSONB 타입으로 저장되는 액션 관련 추가 데이터입니다.</p>
     */
    @Column(name = "action_data", columnDefinition = "jsonb")
    private String actionData;

    /**
     * 이미지 URL
     * <p>알림에 첨부된 이미지의 URL입니다.</p>
     */
    @Column(name = "image_url")
    private String imageUrl;

    /**
     * 만료 일시
     * <p>알림의 유효 기간입니다. 이 시각 이후에는 표시되지 않습니다.</p>
     */
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    /**
     * 알림을 읽음 처리합니다.
     *
     * <p>isRead를 true로 설정하고 readAt을 현재 시각으로 설정합니다.</p>
     */
    public void markAsRead() {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
    }

    /**
     * 알림이 만료되었는지 확인합니다.
     *
     * <p>expiresAt이 설정되어 있고 현재 시각보다 이전인 경우 만료된 것입니다.</p>
     *
     * @return 만료되었으면 true, 그렇지 않으면 false
     */
    public boolean isExpired() {
        return expiresAt != null && expiresAt.isBefore(LocalDateTime.now());
    }
}
