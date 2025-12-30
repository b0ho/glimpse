package com.glimpse.server.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Collections;
import java.util.Date;

/**
 * JWT 토큰 제공자
 * 
 * <p>JWT 토큰의 생성, 검증, 파싱을 담당합니다.</p>
 * 
 * @author Glimpse Team
 * @version 1.0
 */
@Slf4j
@Component
public class JwtTokenProvider {

    private final SecretKey secretKey;
    private final long accessTokenExpiry;
    private final long refreshTokenExpiry;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-expiry:3600000}") long accessTokenExpiry,
            @Value("${jwt.refresh-token-expiry:604800000}") long refreshTokenExpiry) {
        
        // Base64 디코딩하여 SecretKey 생성
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
        this.accessTokenExpiry = accessTokenExpiry;
        this.refreshTokenExpiry = refreshTokenExpiry;
        
        log.info("JWT Token Provider initialized - Access: {}ms, Refresh: {}ms", 
                accessTokenExpiry, refreshTokenExpiry);
    }

    /**
     * Access Token 생성
     * 
     * @param userId 사용자 ID
     * @param role 사용자 역할
     * @return JWT Access Token
     */
    public String createAccessToken(String userId, String role) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessTokenExpiry);

        return Jwts.builder()
                .subject(userId)
                .claim("role", role)
                .claim("type", "access")
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey, Jwts.SIG.HS512)
                .compact();
    }

    /**
     * Refresh Token 생성
     * 
     * @param userId 사용자 ID
     * @return JWT Refresh Token
     */
    public String createRefreshToken(String userId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + refreshTokenExpiry);

        return Jwts.builder()
                .subject(userId)
                .claim("type", "refresh")
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey, Jwts.SIG.HS512)
                .compact();
    }

    /**
     * 토큰에서 사용자 ID 추출
     * 
     * @param token JWT 토큰
     * @return 사용자 ID
     */
    public String getUserIdFromToken(String token) {
        Claims claims = parseClaims(token);
        return claims.getSubject();
    }

    /**
     * 토큰에서 역할 추출
     * 
     * @param token JWT 토큰
     * @return 사용자 역할
     */
    public String getRoleFromToken(String token) {
        Claims claims = parseClaims(token);
        return claims.get("role", String.class);
    }

    /**
     * 토큰 타입 확인 (access/refresh)
     * 
     * @param token JWT 토큰
     * @return 토큰 타입
     */
    public String getTokenType(String token) {
        Claims claims = parseClaims(token);
        return claims.get("type", String.class);
    }

    /**
     * 토큰 유효성 검증
     * 
     * @param token JWT 토큰
     * @return 유효 여부
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (SecurityException | MalformedJwtException e) {
            log.warn("잘못된 JWT 서명입니다: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.warn("만료된 JWT 토큰입니다: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.warn("지원되지 않는 JWT 토큰입니다: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("JWT 토큰이 비어있습니다: {}", e.getMessage());
        }
        return false;
    }

    /**
     * 토큰이 만료되었는지 확인
     * 
     * @param token JWT 토큰
     * @return 만료 여부
     */
    public boolean isTokenExpired(String token) {
        try {
            Claims claims = parseClaims(token);
            return claims.getExpiration().before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        }
    }

    /**
     * 토큰에서 Authentication 객체 생성
     * 
     * @param token JWT 토큰
     * @return Authentication 객체
     */
    public Authentication getAuthentication(String token) {
        String userId = getUserIdFromToken(token);
        String role = getRoleFromToken(token);
        
        // role이 null이면 기본값 설정
        if (role == null) {
            role = "USER";
        }
        
        return new UsernamePasswordAuthenticationToken(
                userId,
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role))
        );
    }

    /**
     * 토큰 만료까지 남은 시간 (밀리초)
     * 
     * @param token JWT 토큰
     * @return 남은 시간 (밀리초)
     */
    public long getExpirationTime(String token) {
        Claims claims = parseClaims(token);
        return claims.getExpiration().getTime() - System.currentTimeMillis();
    }

    /**
     * Access Token 만료 시간 반환 (초)
     * 
     * @return 만료 시간 (초)
     */
    public long getAccessTokenExpirySeconds() {
        return accessTokenExpiry / 1000;
    }

    /**
     * Refresh Token 만료 시간 반환 (초)
     * 
     * @return 만료 시간 (초)
     */
    public long getRefreshTokenExpirySeconds() {
        return refreshTokenExpiry / 1000;
    }

    /**
     * Claims 파싱
     * 
     * @param token JWT 토큰
     * @return Claims
     */
    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}

