package com.glimpse.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@SpringBootApplication(exclude = {
    SecurityAutoConfiguration.class,
    DataSourceAutoConfiguration.class,
    HibernateJpaAutoConfiguration.class
})
@RestController
@CrossOrigin(origins = "*")
public class SimpleApplication2 {
    
    public static void main(String[] args) {
        System.setProperty("server.port", "3001");
        SpringApplication.run(SimpleApplication2.class, args);
    }
    
    @GetMapping("/api/v1/health")
    public Map<String, Object> health(@RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ok");
        response.put("message", "Spring Boot server is running");
        response.put("server", "server2");
        response.put("devMode", "true".equals(devAuth));
        response.put("timestamp", System.currentTimeMillis());
        return response;
    }
    
    @GetMapping("/api/v1/groups")
    public Map<String, Object> getGroups(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            response.put("message", "Development authentication required");
            return response;
        }
        
        // Sample groups data for testing
        Map<String, Object> group1 = new HashMap<>();
        group1.put("id", "group-1");
        group1.put("name", "서강대학교");
        group1.put("type", "OFFICIAL");
        group1.put("memberCount", 1234);
        group1.put("description", "서강대학교 공식 그룹입니다");
        group1.put("location", "서울 마포구");
        
        Map<String, Object> group2 = new HashMap<>();
        group2.put("id", "group-2");
        group2.put("name", "강남 러닝 크루");
        group2.put("type", "CREATED");
        group2.put("memberCount", 89);
        group2.put("description", "강남에서 함께 러닝하는 크루입니다");
        group2.put("location", "서울 강남구");
        
        // Create data object with proper structure
        Map<String, Object> data = new HashMap<>();
        data.put("groups", new Object[]{ group1, group2 });
        data.put("total", 2);
        data.put("page", page);
        data.put("hasMore", false);
        
        response.put("success", true);
        response.put("data", data);
        
        return response;
    }
    
    @GetMapping("/api/v1/users/me")
    public Map<String, Object> getCurrentUser(@RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            response.put("message", "Development authentication required");
            return response;
        }
        
        response.put("id", "test-user-001");
        response.put("nickname", "테스트 사용자");
        response.put("phoneNumber", "+821012345678");
        response.put("isVerified", true);
        response.put("credits", 10);
        response.put("isPremium", false);
        response.put("success", true);
        
        return response;
    }
    
    @PostMapping("/api/v1/auth/login")
    public Map<String, Object> login(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        Map<String, Object> user = new HashMap<>();
        user.put("id", "test-user-001");
        user.put("nickname", "테스트 사용자");
        
        response.put("accessToken", "test-token-12345");
        response.put("refreshToken", "refresh-token-67890");
        response.put("user", user);
        response.put("success", true);
        
        return response;
    }
}