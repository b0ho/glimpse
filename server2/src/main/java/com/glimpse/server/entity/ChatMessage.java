package com.glimpse.server.entity;

import com.glimpse.server.entity.enums.MessageType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 채팅 메시지 Entity
 */
@Entity
@Table(name = "ChatMessage")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage extends BaseEntity {
    
    @Id
    @GeneratedValue(generator = "cuid")
    @GenericGenerator(name = "cuid", strategy = "com.glimpse.server.util.CuidGenerator")
    @Column(name = "id")
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;
    
    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    @Builder.Default
    private MessageType type = MessageType.TEXT;
    
    @Column(name = "is_read")
    @Builder.Default
    private Boolean isRead = false;
    
    @Column(name = "read_at")
    private LocalDateTime readAt;
    
    @Column(name = "is_edited")
    @Builder.Default
    private Boolean isEdited = false;
    
    @Column(name = "edited_at")
    private LocalDateTime editedAt;
    
    @Column(name = "is_deleted")
    @Builder.Default
    private Boolean isDeleted = false;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    // 미디어 메시지용
    @Column(name = "media_url")
    private String mediaUrl;
    
    @Column(name = "media_type")
    private String mediaType;
    
    @Column(name = "media_size")
    private Long mediaSize;
    
    @Column(name = "media_duration")
    private Integer mediaDuration;
    
    @Column(name = "thumbnail_url")
    private String thumbnailUrl;
    
    // 메타데이터
    @Column(name = "metadata", columnDefinition = "jsonb")
    private String metadata;
    
    // 답장
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_to_id")
    private ChatMessage replyTo;
    
    @OneToMany(mappedBy = "replyTo")
    private List<ChatMessage> replies = new ArrayList<>();
    
    // 반응
    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL)
    private List<MessageReaction> reactions = new ArrayList<>();
    
    // 헬퍼 메소드
    public void markAsRead() {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
    }
    
    public void edit(String newContent) {
        this.content = newContent;
        this.isEdited = true;
        this.editedAt = LocalDateTime.now();
    }
    
    public void delete() {
        this.isDeleted = true;
        this.deletedAt = LocalDateTime.now();
    }
}