package com.glimpse.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

@SpringBootApplication
@RestController
@CrossOrigin(origins = "*")
public class SimpleApplicationFixed {
    
    public static void main(String[] args) {
        System.setProperty("server.port", "3001");
        SpringApplication.run(SimpleApplicationFixed.class, args);
    }
    
    @GetMapping("/api/v1/health")
    public Map<String, Object> health(@RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ok");
        response.put("message", "Spring Boot server is running");
        response.put("server", "server2-fixed");
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
        
        // Sample groups data - FIXED format to match client expectations
        List<Map<String, Object>> groups = new ArrayList<>();
        
        Map<String, Object> group1 = new HashMap<>();
        group1.put("id", "group-1");
        group1.put("name", "서강대학교");
        group1.put("type", "OFFICIAL");
        group1.put("memberCount", 1234);
        group1.put("maleCount", 654);
        group1.put("femaleCount", 580);
        group1.put("description", "서강대학교 공식 그룹입니다");
        group1.put("isMatchingActive", true);
        group1.put("createdAt", "2025-01-14T10:00:00Z");
        group1.put("updatedAt", "2025-01-14T10:00:00Z");
        group1.put("creatorId", "admin");
        group1.put("location", Map.of(
            "address", "서울 마포구 서강대로",
            "latitude", 37.5512,
            "longitude", 126.9409
        ));
        groups.add(group1);
        
        Map<String, Object> group2 = new HashMap<>();
        group2.put("id", "group-2");
        group2.put("name", "강남 러닝 크루");
        group2.put("type", "CREATED");
        group2.put("memberCount", 89);
        group2.put("maleCount", 45);
        group2.put("femaleCount", 44);
        group2.put("description", "강남에서 함께 러닝하는 크루입니다");
        group2.put("isMatchingActive", true);
        group2.put("createdAt", "2025-01-13T15:00:00Z");
        group2.put("updatedAt", "2025-01-13T15:00:00Z");
        group2.put("creatorId", "user123");
        group2.put("location", Map.of(
            "address", "서울 강남구 테헤란로",
            "latitude", 37.5013,
            "longitude", 127.0377
        ));
        groups.add(group2);
        
        Map<String, Object> group3 = new HashMap<>();
        group3.put("id", "group-3");
        group3.put("name", "연세대학교 경영학과");
        group3.put("type", "OFFICIAL");
        group3.put("memberCount", 456);
        group3.put("maleCount", 234);
        group3.put("femaleCount", 222);
        group3.put("description", "연세대학교 경영학과 학생들의 공식 그룹");
        group3.put("isMatchingActive", true);
        group3.put("createdAt", "2025-01-12T08:00:00Z");
        group3.put("updatedAt", "2025-01-12T08:00:00Z");
        group3.put("creatorId", "admin2");
        group3.put("location", Map.of(
            "address", "서울 서대문구 연세로",
            "latitude", 37.5668,
            "longitude", 126.9387
        ));
        groups.add(group3);
        
        // CRITICAL FIX: Client expects response.data to be an array directly
        response.put("success", true);
        response.put("data", groups);
        
        return response;
    }
    
    @GetMapping("/api/v1/groups/{groupId}")
    public Map<String, Object> getGroupDetail(
            @PathVariable String groupId,
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            return response;
        }
        
        Map<String, Object> group = new HashMap<>();
        group.put("id", groupId);
        group.put("name", "서강대학교 IT학과");
        group.put("description", "서강대학교 IT학과 학생들의 모임입니다. 코딩, 공모전, 취업 정보를 공유합니다.");
        group.put("type", "OFFICIAL");
        group.put("memberCount", 46);
        group.put("isMatchingActive", true);
        group.put("location", Map.of(
            "address", "서울 마포구 서강대로",
            "latitude", 37.5512,
            "longitude", 126.9409
        ));
        
        response.put("success", true);
        response.put("data", group);
        return response;
    }
    
    @GetMapping("/api/v1/contents")
    public Map<String, Object> getContents(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            return response;
        }
        
        List<Map<String, Object>> contents = new ArrayList<>();
        
        Map<String, Object> content1 = new HashMap<>();
        content1.put("id", "content-1");
        content1.put("type", "POST");
        content1.put("author", Map.of("id", "user-1", "nickname", "김철수"));
        content1.put("content", "오늘 날씨가 정말 좋네요! 다들 행복한 하루 보내세요 😊");
        content1.put("likeCount", 12);
        content1.put("commentCount", 3);
        content1.put("createdAt", System.currentTimeMillis());
        contents.add(content1);
        
        Map<String, Object> content2 = new HashMap<>();
        content2.put("id", "content-2");
        content2.put("type", "STORY");
        content2.put("author", Map.of("id", "user-2", "nickname", "이영희"));
        content2.put("imageUrl", "https://example.com/story.jpg");
        content2.put("viewCount", 45);
        content2.put("createdAt", System.currentTimeMillis() - 3600000);
        contents.add(content2);
        
        // Mobile app expects data to be an array directly
        response.put("success", true);
        response.put("data", contents);
        return response;
    }
    
    @GetMapping("/api/v1/matching/matches")
    public Map<String, Object> getMatches(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "20") int limit) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            return response;
        }
        
        List<Map<String, Object>> matches = new ArrayList<>();
        
        Map<String, Object> match1 = new HashMap<>();
        match1.put("id", "match-1");
        match1.put("user", Map.of(
            "id", "user-3",
            "nickname", "별님",
            "profileImageUrl", "https://example.com/profile1.jpg"
        ));
        match1.put("matchedAt", System.currentTimeMillis() - 86400000);
        match1.put("lastMessage", "안녕하세요!");
        match1.put("unreadCount", 2);
        matches.add(match1);
        
        Map<String, Object> data = new HashMap<>();
        data.put("matches", matches);
        data.put("total", 1);
        data.put("page", page);
        data.put("hasMore", false);
        
        response.put("success", true);
        response.put("data", data);
        return response;
    }
    
    @GetMapping("/api/v1/users/profile")
    public Map<String, Object> getUserProfile(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            return response;
        }
        
        Map<String, Object> profile = new HashMap<>();
        profile.put("id", "test-user-001");
        profile.put("nickname", "테스트 사용자");
        profile.put("phoneNumber", "+821012345678");
        profile.put("isPremium", true);
        profile.put("premiumType", "MONTHLY");
        profile.put("credits", 10);
        profile.put("joinedGroups", 5);
        profile.put("sentLikes", 23);
        profile.put("receivedLikes", 17);
        profile.put("matches", 8);
        
        response.put("success", true);
        response.put("data", profile);
        return response;
    }
    
    @GetMapping("/api/v1/interest/searches")
    public Map<String, Object> getInterestSearches(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            return response;
        }
        
        Map<String, Object> data = new HashMap<>();
        data.put("searches", new ArrayList<>());
        data.put("total", 0);
        
        response.put("success", true);
        response.put("data", data);
        return response;
    }
    
    @GetMapping("/api/v1/interest/matches")
    public Map<String, Object> getInterestMatches(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            return response;
        }
        
        Map<String, Object> data = new HashMap<>();
        data.put("matches", new ArrayList<>());
        data.put("total", 0);
        
        response.put("success", true);
        response.put("data", data);
        return response;
    }
    
    @GetMapping("/api/v1/interest/secure/my-status")
    public Map<String, Object> getInterestStatus(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            return response;
        }
        
        Map<String, Object> data = new HashMap<>();
        data.put("status", "active");
        data.put("remainingSearches", 3);
        
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
    
    @PostMapping("/api/v1/users/fcm/token")
    public Map<String, Object> registerFcmToken(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth,
            @RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            return response;
        }
        
        response.put("success", true);
        response.put("message", "FCM token registered");
        return response;
    }
}