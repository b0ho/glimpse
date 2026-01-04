package com.glimpse.server.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;

/**
 * Cognito 로그인 요청 DTO
 *
 * <p>Cognito ID Token을 사용한 로그인 요청을 담는 DTO입니다.</p>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CognitoLoginDto {
    
    /**
     * Cognito ID Token
     */
    @NotBlank(message = "Cognito ID Token은 필수입니다")
    private String cognitoIdToken;
}

