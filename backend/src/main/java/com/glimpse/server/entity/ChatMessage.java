package com.glimpse.server.entity;

import com.glimpse.server.entity.enums.MessageType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * ChatMessage 엔티티
 *
 * <p>매칭된 사용자 간에 주고받는 채팅 메시지를 나타내는 엔티티입니다.
 * 텍스트, 이미지, 영상, 음성 등 다양한 타입의 메시지를 지원합니다.</p>
 *
 * <p>주요 관계:</p>
 * <ul>
 *   <li>@ManyToOne Match: 메시지가 속한 매칭 (LAZY 로딩, nullable하지 않음)</li>
 *   <li>@ManyToOne User (sender): 메시지를 보낸 사용자 (LAZY 로딩, nullable하지 않음)</li>
 *   <li>@ManyToOne ChatMessage (replyTo): 답장 대상 메시지 (LAZY 로딩, nullable)</li>
 *   <li>@OneToMany ChatMessage (replies): 이 메시지에 대한 답장들</li>
 *   <li>@OneToMany MessageReaction: 메시지에 대한 반응들 (CASCADE ALL)</li>
 * </ul>
 *
 * <p>주요 기능:</p>
 * <ul>
 *   <li>다양한 메시지 타입 지원 (TEXT, IMAGE, VIDEO, AUDIO, FILE 등)</li>
 *   <li>읽음 확인 기능</li>
 *   <li>메시지 수정 및 삭제 (Soft delete)</li>
 *   <li>답장 (Reply) 기능</li>
 *   <li>미디어 메시지 지원 (URL, 타입, 크기, 썸네일)</li>
 *   <li>메시지 반응 (이모지 등)</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Entity
@Table(name = "ChatMessage")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage extends BaseEntity {

    /**
     * 메시지 고유 식별자
     * <p>CUID 전략을 사용하여 자동 생성됩니다.</p>
     */
    @Id
    @GeneratedValue(generator = "cuid")
    @GenericGenerator(name = "cuid", strategy = "com.glimpse.server.util.CuidGenerator")
    @Column(name = "id")
    private String id;

    /**
     * 메시지가 속한 매칭
     * <p>어떤 매칭의 채팅방에서 발생한 메시지인지 나타냅니다.
     * LAZY 로딩으로 성능을 최적화하며, null일 수 없습니다.</p>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    /**
     * 메시지 발신자
     * <p>메시지를 보낸 사용자입니다.
     * LAZY 로딩으로 성능을 최적화하며, null일 수 없습니다.</p>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    /**
     * 메시지 내용
     * <p>TEXT 타입으로 긴 메시지를 지원하며, null일 수 없습니다.</p>
     */
    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    /**
     * 메시지 타입
     * <p>MessageType enum (TEXT, IMAGE, VIDEO, AUDIO, FILE 등). 기본값: TEXT</p>
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    @Builder.Default
    private MessageType type = MessageType.TEXT;

    /**
     * 읽음 여부
     * <p>상대방이 메시지를 읽었는지 여부입니다. 기본값: false</p>
     */
    @Column(name = "is_read")
    @Builder.Default
    private Boolean isRead = false;

    /**
     * 읽은 일시
     * <p>상대방이 메시지를 읽은 시각입니다.</p>
     */
    @Column(name = "read_at")
    private LocalDateTime readAt;

    /**
     * 수정 여부
     * <p>메시지가 수정되었는지 여부입니다. 기본값: false</p>
     */
    @Column(name = "is_edited")
    @Builder.Default
    private Boolean isEdited = false;

    /**
     * 수정 일시
     * <p>메시지가 마지막으로 수정된 시각입니다.</p>
     */
    @Column(name = "edited_at")
    private LocalDateTime editedAt;

    /**
     * 삭제 여부
     * <p>Soft delete를 위한 필드입니다. 기본값: false</p>
     */
    @Column(name = "is_deleted")
    @Builder.Default
    private Boolean isDeleted = false;

    /**
     * 삭제 일시
     * <p>메시지가 삭제된 시각입니다.</p>
     */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /**
     * 미디어 파일 URL
     * <p>이미지, 영상, 음성 등 미디어 메시지의 파일 URL입니다.</p>
     */
    @Column(name = "media_url")
    private String mediaUrl;

    /**
     * 미디어 MIME 타입
     * <p>미디어 파일의 MIME 타입입니다 (예: image/jpeg, video/mp4).</p>
     */
    @Column(name = "media_type")
    private String mediaType;

    /**
     * 미디어 파일 크기 (바이트)
     * <p>미디어 파일의 크기입니다.</p>
     */
    @Column(name = "media_size")
    private Long mediaSize;

    /**
     * 미디어 재생 시간 (초)
     * <p>영상/음성 메시지의 재생 시간입니다.</p>
     */
    @Column(name = "media_duration")
    private Integer mediaDuration;

    /**
     * 썸네일 URL
     * <p>영상 메시지의 썸네일 이미지 URL입니다.</p>
     */
    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    /**
     * 메타데이터 (JSON)
     * <p>PostgreSQL JSONB 타입으로 저장되는 추가 정보입니다.</p>
     */
    @Column(name = "metadata", columnDefinition = "jsonb")
    private String metadata;

    /**
     * 답장 대상 메시지
     * <p>이 메시지가 답장인 경우, 답장 대상이 되는 원본 메시지입니다.
     * LAZY 로딩으로 성능을 최적화하며, nullable입니다.</p>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_to_id")
    private ChatMessage replyTo;

    /**
     * 이 메시지에 대한 답장들
     * <p>다른 메시지들이 이 메시지를 답장 대상으로 설정한 경우의 목록입니다.</p>
     */
    @OneToMany(mappedBy = "replyTo")
    private List<ChatMessage> replies = new ArrayList<>();

    /**
     * 메시지에 대한 반응들
     * <p>MessageReaction 엔티티의 message 필드와 매핑됩니다.
     * CascadeType.ALL로 인해 ChatMessage 삭제 시 모든 반응도 함께 삭제됩니다.</p>
     */
    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL)
    private List<MessageReaction> reactions = new ArrayList<>();

    /**
     * 메시지를 읽음 처리합니다.
     *
     * <p>isRead를 true로 설정하고 readAt을 현재 시각으로 설정합니다.</p>
     */
    public void markAsRead() {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
    }

    /**
     * 메시지 내용을 수정합니다.
     *
     * <p>새로운 내용으로 변경하고, isEdited를 true로, editedAt을 현재 시각으로 설정합니다.</p>
     *
     * @param newContent 수정할 새로운 메시지 내용
     */
    public void edit(String newContent) {
        this.content = newContent;
        this.isEdited = true;
        this.editedAt = LocalDateTime.now();
    }

    /**
     * 메시지를 삭제 처리합니다.
     *
     * <p>Soft delete로, isDeleted를 true로 설정하고 deletedAt을 현재 시각으로 설정합니다.</p>
     */
    public void delete() {
        this.isDeleted = true;
        this.deletedAt = LocalDateTime.now();
    }
}
