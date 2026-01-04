package com.glimpse.server.service;

import com.auth0.jwk.Jwk;
import com.auth0.jwk.JwkProvider;
import com.auth0.jwk.UrlJwkProvider;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import com.glimpse.server.dto.auth.CognitoUser;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.net.URL;
import java.security.interfaces.RSAPublicKey;

/**
 * AWS Cognito 토큰 검증 서비스
 *
 * <p>Cognito에서 발급한 ID Token의 서명을 검증하고 사용자 정보를 추출합니다.</p>
 *
 * <h3>검증 프로세스:</h3>
 * <ol>
 *   <li>토큰 디코딩</li>
 *   <li>JWKS(JSON Web Key Set)에서 공개키 조회</li>
 *   <li>서명 검증</li>
 *   <li>Issuer, Audience, 토큰 타입 검증</li>
 *   <li>사용자 정보 추출</li>
 * </ol>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Slf4j
@Service
public class CognitoTokenVerifier {
    
    @Value("${aws.cognito.user-pool-id}")
    private String userPoolId;
    
    @Value("${aws.cognito.region}")
    private String region;
    
    @Value("${aws.cognito.client-id:}")
    private String clientId;
    
    private JwkProvider jwkProvider;
    private String issuer;
    
    /**
     * 서비스 초기화
     * JWKS URL 설정 및 JwkProvider 생성
     */
    @PostConstruct
    public void init() {
        try {
            this.issuer = String.format("https://cognito-idp.%s.amazonaws.com/%s", region, userPoolId);
            String jwksUrl = issuer + "/.well-known/jwks.json";
            
            log.info("Cognito JWKS URL 초기화: {}", jwksUrl);
            this.jwkProvider = new UrlJwkProvider(new URL(jwksUrl));
            
        } catch (Exception e) {
            log.error("CognitoTokenVerifier 초기화 실패", e);
            throw new RuntimeException("Cognito 토큰 검증 서비스 초기화 실패", e);
        }
    }
    
    /**
     * Cognito ID Token 검증
     *
     * @param idToken Cognito에서 발급한 ID Token
     * @return 검증된 사용자 정보
     * @throws IllegalArgumentException 토큰이 유효하지 않은 경우
     */
    public CognitoUser verifyCognitoToken(String idToken) {
        try {
            log.debug("Cognito ID Token 검증 시작");
            
            // 1. 토큰 디코딩
            DecodedJWT jwt = JWT.decode(idToken);
            
            // 2. JWKS에서 공개 키 가져오기
            Jwk jwk = jwkProvider.get(jwt.getKeyId());
            Algorithm algorithm = Algorithm.RSA256((RSAPublicKey) jwk.getPublicKey(), null);
            
            // 3. 토큰 검증 (서명, issuer, token_use, audience)
            JWTVerifier.BaseVerification verification = (JWTVerifier.BaseVerification) JWT.require(algorithm)
                    .withIssuer(issuer)
                    .withClaim("token_use", "id");
            
            // Client ID 검증 (설정된 경우)
            if (clientId != null && !clientId.isEmpty()) {
                verification = verification.withAudience(clientId);
            }
            
            JWTVerifier verifier = verification.build();
            DecodedJWT verified = verifier.verify(idToken);
            
            // 4. 사용자 정보 추출
            CognitoUser cognitoUser = CognitoUser.builder()
                    .sub(verified.getSubject())
                    .phoneNumber(getClaim(verified, "phone_number"))
                    .phoneNumberVerified(getBooleanClaim(verified, "phone_number_verified"))
                    .email(getClaim(verified, "email"))
                    .emailVerified(getBooleanClaim(verified, "email_verified"))
                    .username(getClaim(verified, "cognito:username"))
                    .build();
            
            log.info("Cognito 토큰 검증 성공: sub={}, phoneNumber={}", 
                    cognitoUser.getSub(), maskPhoneNumber(cognitoUser.getPhoneNumber()));
            
            return cognitoUser;
            
        } catch (Exception e) {
            log.error("Cognito 토큰 검증 실패: {}", e.getMessage());
            throw new IllegalArgumentException("유효하지 않은 Cognito 토큰입니다: " + e.getMessage());
        }
    }
    
    /**
     * Cognito 토큰 유효성만 검사 (사용자 정보 추출 없이)
     *
     * @param idToken Cognito ID Token
     * @return 토큰 유효 여부
     */
    public boolean isValidToken(String idToken) {
        try {
            verifyCognitoToken(idToken);
            return true;
        } catch (Exception e) {
            log.debug("토큰 유효성 검사 실패: {}", e.getMessage());
            return false;
        }
    }
    
    // ==================== Private Helper Methods ====================
    
    /**
     * JWT Claim에서 String 값 안전하게 추출
     */
    private String getClaim(DecodedJWT jwt, String claimName) {
        try {
            return jwt.getClaim(claimName).asString();
        } catch (Exception e) {
            return null;
        }
    }
    
    /**
     * JWT Claim에서 Boolean 값 안전하게 추출
     */
    private Boolean getBooleanClaim(DecodedJWT jwt, String claimName) {
        try {
            return jwt.getClaim(claimName).asBoolean();
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * 전화번호 마스킹 (로그용)
     */
    private String maskPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.length() < 4) {
            return "****";
        }
        return phoneNumber.substring(0, phoneNumber.length() - 4) + "****";
    }
}

