package com.glimpse.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Glimpse Dating App Server - Spring Boot Application
 * 
 * 한국 시장을 타겟으로 한 익명 매칭 데이팅 앱 서버
 * - 그룹 기반 매칭 시스템
 * - 실시간 채팅
 * - 프리미엄 구독 모델
 */
@SpringBootApplication
@EnableJpaAuditing
@EnableCaching
@EnableAsync
@EnableScheduling
public class GlimpseServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(GlimpseServerApplication.class, args);
    }
}