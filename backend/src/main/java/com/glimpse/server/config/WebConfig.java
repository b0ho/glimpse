package com.glimpse.server.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web Configuration
 *
 * <p>CORS 설정 및 웹 MVC 관련 설정</p>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    /**
     * CORS 매핑 설정
     *
     * <p>개발 환경 및 프로덕션 환경에 대한 CORS 정책 설정</p>
     *
     * @param registry CORS 레지스트리
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                // 허용할 Origins (개발 환경)
                .allowedOrigins(
                    "http://localhost:8081",     // Expo Web
                    "http://localhost:8085",     // Expo Web (alternate port)
                    "http://localhost:3000",     // Web Landing / Admin
                    "http://localhost:5173",     // Vite Dev Server
                    "exp://192.168.*:8081",      // Expo Development Build
                    "http://192.168.*:8081"      // Local Network Expo
                )
                // 모든 HTTP 메서드 허용
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                // 모든 헤더 허용
                .allowedHeaders("*")
                // 인증 정보 허용 (쿠키, Authorization 헤더 등)
                .allowCredentials(true)
                // Preflight 요청 캐시 시간 (1시간)
                .maxAge(3600);
    }
}
