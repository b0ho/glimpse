package com.glimpse.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Glimpse Spring Boot 테스트 애플리케이션
 *
 * <p>Spring Boot 서버의 기본 동작을 테스트하기 위한 간단한 애플리케이션입니다.
 * 데이터베이스 연결 없이 빠르게 서버 실행을 확인할 수 있는 헬스 체크 엔드포인트를 제공합니다.</p>
 *
 * <p>제공하는 엔드포인트:</p>
 * <ul>
 *   <li>GET /api/v1/test - 서버 상태 테스트</li>
 *   <li>GET /health - 헬스 체크</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@SpringBootApplication
@RestController
public class TestApplication {

    /**
     * Spring Boot 애플리케이션 진입점
     *
     * @param args 명령줄 인수
     */
    public static void main(String[] args) {
        SpringApplication.run(TestApplication.class, args);
    }

    /**
     * 서버 상태 테스트 엔드포인트
     *
     * @return 서버 상태 정보 (status, message, server)
     */
    @GetMapping("/api/v1/test")
    public Map<String, String> test() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "ok");
        response.put("message", "Spring Boot server is running!");
        response.put("server", "backend");
        return response;
    }

    /**
     * 헬스 체크 엔드포인트
     *
     * @return 서버 헬스 정보 (status, timestamp)
     */
    @GetMapping("/health")
    public Map<String, String> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "healthy");
        response.put("timestamp", String.valueOf(System.currentTimeMillis()));
        return response;
    }
}