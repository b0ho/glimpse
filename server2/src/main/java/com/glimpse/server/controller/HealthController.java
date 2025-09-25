package com.glimpse.server.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 헬스 체크 컨트롤러
 */
@RestController
@RequestMapping("/api/v1")
public class HealthController {
    
    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ok");
        response.put("service", "Glimpse Server (Spring Boot)");
        response.put("timestamp", System.currentTimeMillis());
        return response;
    }
    
    @GetMapping("/test")
    public Map<String, String> test() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Spring Boot server is running");
        response.put("version", "0.0.1");
        return response;
    }
}