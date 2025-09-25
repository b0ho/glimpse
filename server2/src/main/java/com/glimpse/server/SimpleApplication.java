package com.glimpse.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@SpringBootApplication(exclude = {SecurityAutoConfiguration.class})
@RestController
@CrossOrigin(origins = "*")
public class SimpleApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(SimpleApplication.class, args);
    }
    
    @GetMapping("/api/v1/health")
    public Map<String, Object> health(@RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ok");
        response.put("message", "Spring Boot server is running");
        response.put("server", "server2");
        response.put("devMode", "true".equals(devAuth));
        return response;
    }
    
    @GetMapping("/api/v1/groups")
    public Map<String, Object> getGroups(@RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            return response;
        }
        
        // Sample groups data for testing
        response.put("groups", new Object[]{
            Map.of(
                "id", "group-1",
                "name", "서강대학교",
                "type", "OFFICIAL",
                "memberCount", 1234
            ),
            Map.of(
                "id", "group-2", 
                "name", "강남 러닝 크루",
                "type", "CREATED",
                "memberCount", 89
            )
        });
        
        return response;
    }
    
    @GetMapping("/api/v1/users/me")
    public Map<String, Object> getCurrentUser(@RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            return response;
        }
        
        response.put("id", "test-user-001");
        response.put("nickname", "테스트 사용자");
        response.put("phoneNumber", "+821012345678");
        response.put("isVerified", true);
        response.put("credits", 10);
        response.put("isPremium", false);
        
        return response;
    }
    
    @PostMapping("/api/v1/auth/login")
    public Map<String, Object> login(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        response.put("accessToken", "test-token-12345");
        response.put("refreshToken", "refresh-token-67890");
        response.put("user", Map.of(
            "id", "test-user-001",
            "nickname", "테스트 사용자"
        ));
        return response;
    }
}