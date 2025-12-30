package com.glimpse.server.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JWT 인증 필터
 * 
 * <p>모든 요청에서 JWT 토큰을 검증하고 인증 정보를 설정합니다.</p>
 * 
 * @author Glimpse Team
 * @version 1.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String DEV_AUTH_HEADER = "x-dev-auth";

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String requestURI = request.getRequestURI();
        
        // 개발 모드 인증 바이패스 (x-dev-auth 헤더)
        String devAuth = request.getHeader(DEV_AUTH_HEADER);
        if ("true".equals(devAuth)) {
            log.debug("[DEV] 개발 모드 인증 바이패스: {}", requestURI);
            // 개발 모드에서는 기본 인증 정보 설정
            Authentication devAuthentication = createDevAuthentication();
            SecurityContextHolder.getContext().setAuthentication(devAuthentication);
            filterChain.doFilter(request, response);
            return;
        }

        // JWT 토큰 추출
        String token = resolveToken(request);

        // 토큰 유효성 검증 및 인증 정보 설정
        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
            // Access Token인지 확인
            String tokenType = jwtTokenProvider.getTokenType(token);
            if (!"access".equals(tokenType)) {
                log.warn("Access Token이 아닌 토큰으로 인증 시도: {}", tokenType);
                filterChain.doFilter(request, response);
                return;
            }

            Authentication authentication = jwtTokenProvider.getAuthentication(token);
            SecurityContextHolder.getContext().setAuthentication(authentication);
            log.debug("Security Context에 인증 정보 저장: {} (URI: {})", 
                    authentication.getName(), requestURI);
        } else {
            log.debug("유효한 JWT 토큰이 없습니다. URI: {}", requestURI);
        }

        filterChain.doFilter(request, response);
    }

    /**
     * 요청 헤더에서 JWT 토큰 추출
     * 
     * @param request HTTP 요청
     * @return JWT 토큰 (Bearer 제외)
     */
    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length());
        }
        return null;
    }

    /**
     * 개발 모드용 인증 객체 생성
     * 
     * @return Authentication 객체
     */
    private Authentication createDevAuthentication() {
        return new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                "dev_user",
                null,
                java.util.Collections.singletonList(
                        new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_USER")
                )
        );
    }

    /**
     * 필터를 적용하지 않을 경로 설정
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        
        // 인증이 필요 없는 경로
        return path.startsWith("/api/v1/auth/") ||
               path.startsWith("/api/v1/health") ||
               path.startsWith("/swagger-ui") ||
               path.startsWith("/v3/api-docs") ||
               path.startsWith("/actuator");
    }
}

