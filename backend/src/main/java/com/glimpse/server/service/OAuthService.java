package com.glimpse.server.service;

import com.glimpse.server.dto.auth.OAuthUserInfo;

/**
 * OAuth 서비스 인터페이스
 * 
 * <p>소셜 로그인 제공자별 사용자 정보를 가져옵니다.</p>
 * 
 * @author Glimpse Team
 * @version 1.0
 */
public interface OAuthService {

    /**
     * Google OAuth 토큰으로 사용자 정보 조회
     * 
     * @param accessToken Google Access Token
     * @return 사용자 정보
     */
    OAuthUserInfo getGoogleUserInfo(String accessToken);

    /**
     * Kakao OAuth 토큰으로 사용자 정보 조회
     * 
     * @param accessToken Kakao Access Token
     * @return 사용자 정보
     */
    OAuthUserInfo getKakaoUserInfo(String accessToken);

    /**
     * Naver OAuth 토큰으로 사용자 정보 조회
     * 
     * @param accessToken Naver Access Token
     * @return 사용자 정보
     */
    OAuthUserInfo getNaverUserInfo(String accessToken);
}

