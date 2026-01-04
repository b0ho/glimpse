package com.glimpse.server.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Cognito 사용자 정보 DTO
 *
 * <p>AWS Cognito ID Token에서 추출한 사용자 정보를 담는 DTO입니다.</p>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CognitoUser {
    
    /**
     * Cognito User Sub (고유 ID)
     */
    private String sub;
    
    /**
     * 전화번호
     */
    private String phoneNumber;
    
    /**
     * 전화번호 인증 여부
     */
    private Boolean phoneNumberVerified;
    
    /**
     * 이메일
     */
    private String email;
    
    /**
     * 이메일 인증 여부
     */
    private Boolean emailVerified;
    
    /**
     * 사용자 이름
     */
    private String username;
}

