package com.glimpse.server.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Refresh Token 엔티티
 * 
 * <p>JWT Refresh Token을 저장하고 관리합니다.</p>
 * 
 * @author Glimpse Team
 * @version 1.0
 */
@Entity
@Table(name = "refresh_tokens", indexes = {
        @Index(name = "idx_refresh_token_user_id", columnList = "user_id"),
        @Index(name = "idx_refresh_token_token", columnList = "token"),
        @Index(name = "idx_refresh_token_expires_at", columnList = "expires_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    /**
     * 사용자 ID
     */
    @Column(name = "user_id", nullable = false)
    private String userId;

    /**
     * Refresh Token 값
     */
    @Column(nullable = false, unique = true, length = 512)
    private String token;

    /**
     * 디바이스 정보 (선택)
     */
    @Column(name = "device_info", length = 255)
    private String deviceInfo;

    /**
     * IP 주소
     */
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    /**
     * User-Agent
     */
    @Column(name = "user_agent", length = 512)
    private String userAgent;

    /**
     * 만료 시간
     */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /**
     * 생성 시간
     */
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /**
     * 마지막 사용 시간
     */
    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;

    /**
     * 폐기 여부
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean revoked = false;

    /**
     * 토큰 만료 여부 확인
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    /**
     * 토큰 유효성 확인
     */
    public boolean isValid() {
        return !revoked && !isExpired();
    }

    /**
     * 토큰 폐기
     */
    public void revoke() {
        this.revoked = true;
    }

    /**
     * 마지막 사용 시간 업데이트
     */
    public void updateLastUsed() {
        this.lastUsedAt = LocalDateTime.now();
    }
}

