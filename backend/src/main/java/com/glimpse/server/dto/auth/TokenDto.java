package com.glimpse.server.dto.auth;

import lombok.*;

/**
 * 인증 토큰 데이터 전송 객체
 *
 * <p>사용자 인증 후 발급되는 JWT 토큰 정보를 전달합니다.
 * Access Token과 Refresh Token을 포함하며, 토큰 타입과 만료 시간을 제공합니다.</p>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TokenDto {

    /** 액세스 토큰 (API 요청에 사용) */
    private String accessToken;

    /** 리프레시 토큰 (액세스 토큰 갱신에 사용) */
    private String refreshToken;

    /** 토큰 타입 (일반적으로 "Bearer") */
    private String tokenType;

    /** 토큰 만료 시간 (초 단위) */
    private Long expiresIn;
}