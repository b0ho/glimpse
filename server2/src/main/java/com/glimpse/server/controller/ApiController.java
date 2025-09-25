package com.glimpse.server.controller;

import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/v1")
public class ApiController {
    
    @GetMapping("/groups/{groupId}")
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
    
    @GetMapping("/contents")
    public Map<String, Object> getContents(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            return response;
        }
        
        // Sample contents
        Map<String, Object> content1 = new HashMap<>();
        content1.put("id", "content-1");
        content1.put("type", "POST");
        content1.put("author", Map.of("id", "user-1", "nickname", "김철수"));
        content1.put("content", "오늘 날씨가 정말 좋네요! 다들 행복한 하루 보내세요 😊");
        content1.put("likeCount", 12);
        content1.put("commentCount", 3);
        content1.put("createdAt", System.currentTimeMillis());
        
        Map<String, Object> content2 = new HashMap<>();
        content2.put("id", "content-2");
        content2.put("type", "STORY");
        content2.put("author", Map.of("id", "user-2", "nickname", "이영희"));
        content2.put("imageUrl", "https://example.com/story.jpg");
        content2.put("viewCount", 45);
        content2.put("createdAt", System.currentTimeMillis() - 3600000);
        
        Map<String, Object> data = new HashMap<>();
        data.put("contents", new Object[]{ content1, content2 });
        data.put("total", 2);
        data.put("page", page);
        data.put("hasMore", false);
        
        response.put("success", true);
        response.put("data", data);
        return response;
    }
    
    @GetMapping("/matching/matches")
    public Map<String, Object> getMatches(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "20") int limit) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            return response;
        }
        
        // Sample matches
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
        
        Map<String, Object> data = new HashMap<>();
        data.put("matches", new Object[]{ match1 });
        data.put("total", 1);
        data.put("page", page);
        data.put("hasMore", false);
        
        response.put("success", true);
        response.put("data", data);
        return response;
    }
    
    @GetMapping("/users/profile")
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
    
    @GetMapping("/interest/searches")
    public Map<String, Object> getInterestSearches(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            return response;
        }
        
        Map<String, Object> data = new HashMap<>();
        data.put("searches", new Object[]{});
        data.put("total", 0);
        
        response.put("success", true);
        response.put("data", data);
        return response;
    }
    
    @GetMapping("/interest/matches")
    public Map<String, Object> getInterestMatches(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            return response;
        }
        
        Map<String, Object> data = new HashMap<>();
        data.put("matches", new Object[]{});
        data.put("total", 0);
        
        response.put("success", true);
        response.put("data", data);
        return response;
    }
    
    @GetMapping("/interest/secure/my-status")
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
    
    @PostMapping("/users/fcm/token")
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