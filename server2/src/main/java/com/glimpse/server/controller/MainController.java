package com.glimpse.server.controller;

import com.glimpse.server.dto.common.ApiResponse;
import com.glimpse.server.dto.user.UserDto;
import com.glimpse.server.entity.enums.Gender;
import com.glimpse.server.entity.enums.PremiumLevel;
import com.glimpse.server.service.MatchService;
import com.glimpse.server.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class MainController {
    
    private final UserService userService;
    private final MatchService matchService;
    
    // 개발 환경 인증 체크
    private boolean isDevAuth(String devAuth) {
        return "true".equals(devAuth);
    }
    
    @GetMapping("/health")
    public Map<String, Object> health(@RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ok");
        response.put("message", "JPA + Native Query Server Running");
        response.put("server", "server2-jpa");
        response.put("devMode", isDevAuth(devAuth));
        response.put("timestamp", System.currentTimeMillis());
        return response;
    }
    
    // ===== User APIs =====
    
    @GetMapping("/users/profile")
    public ApiResponse<UserDto> getUserProfile(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth,
            @RequestParam(required = false) String userId) {
        
        if (!isDevAuth(devAuth)) {
            return ApiResponse.error("Unauthorized");
        }
        
        // 테스트용 더미 사용자 반환
        UserDto testUser = UserDto.builder()
            .id("test-user-001")
            .nickname("테스트 사용자")
            .phoneNumber("+821012345678")
            .age(28)
            .gender(Gender.MALE)
            .isPremium(false)
            .premiumLevel(PremiumLevel.FREE)
            .credits(10)
            .isVerified(true)
            .lastActive(LocalDateTime.now())
            .build();
        
        return ApiResponse.success(testUser);
    }
    
    @GetMapping("/users/recommendations")
    public ApiResponse<List<Map<String, Object>>> getRecommendations(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth,
            @RequestParam(defaultValue = "test-user-001") String userId,
            @RequestParam(defaultValue = "FEMALE") String preferredGender,
            @RequestParam(defaultValue = "20") int minAge,
            @RequestParam(defaultValue = "35") int maxAge) {
        
        if (!isDevAuth(devAuth)) {
            return ApiResponse.error("Unauthorized");
        }
        
        List<Map<String, Object>> recommendations = 
            userService.recommendUsersByGroups(userId, preferredGender, minAge, maxAge);
        
        return ApiResponse.success(recommendations);
    }
    
    @GetMapping("/users/nearby")
    public ApiResponse<List<Map<String, Object>>> getNearbyUsers(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth,
            @RequestParam(defaultValue = "test-user-001") String userId,
            @RequestParam(defaultValue = "37.5665") Double latitude,
            @RequestParam(defaultValue = "126.9780") Double longitude,
            @RequestParam(defaultValue = "5.0") Double radiusKm) {
        
        if (!isDevAuth(devAuth)) {
            return ApiResponse.error("Unauthorized");
        }
        
        List<Map<String, Object>> nearbyUsers = 
            userService.findNearbyUsers(userId, latitude, longitude, radiusKm);
        
        return ApiResponse.success(nearbyUsers);
    }
    
    @GetMapping("/users/me")
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
    
    // ===== Match APIs =====
    
    @GetMapping("/matching/matches")
    public ApiResponse<Map<String, Object>> getMatches(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth,
            @RequestParam(defaultValue = "test-user-001") String userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        
        if (!isDevAuth(devAuth)) {
            return ApiResponse.error("Unauthorized");
        }
        
        List<Map<String, Object>> matches = matchService.getUserMatches(userId);
        Map<String, Object> statistics = matchService.getMatchStatistics(userId);
        
        Map<String, Object> data = new HashMap<>();
        data.put("matches", matches);
        data.put("statistics", statistics);
        data.put("total", matches.size());
        data.put("page", page);
        data.put("hasMore", false);
        
        Map<String, Object> response = new HashMap<>();
        response.put("data", data);
        response.put("success", true);
        
        return ApiResponse.success(response);
    }
    
    // ===== Group APIs =====
    
    @GetMapping("/groups")
    public Map<String, Object> getGroups(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {
        
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            return response;
        }
        
        List<Map<String, Object>> groups = List.of(
            Map.of(
                "id", "group-1",
                "name", "서강대학교",
                "type", "OFFICIAL",
                "memberCount", 1234,
                "maleCount", 654,
                "femaleCount", 580,
                "description", "서강대학교 공식 그룹",
                "isMatchingActive", true,
                "createdAt", "2025-01-14T10:00:00Z",
                "updatedAt", "2025-01-14T10:00:00Z"
            ),
            Map.of(
                "id", "group-2",
                "name", "강남 러닝 크루",
                "type", "CREATED",
                "memberCount", 89,
                "maleCount", 45,
                "femaleCount", 44,
                "description", "함께 달리는 러닝 모임",
                "isMatchingActive", true,
                "createdAt", "2025-01-13T15:00:00Z",
                "updatedAt", "2025-01-13T15:00:00Z"
            )
        );
        
        response.put("success", true);
        response.put("data", groups);
        return response;
    }
    
    // ===== Content APIs =====
    
    @GetMapping("/contents")
    public Map<String, Object> getContents(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {
        
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            return response;
        }
        
        List<Map<String, Object>> contents = List.of(
            Map.of(
                "id", "content-1",
                "type", "POST",
                "author", Map.of("id", "user-1", "nickname", "익명 사용자"),
                "content", "오늘 날씨가 좋네요!",
                "likeCount", 12,
                "commentCount", 3,
                "createdAt", System.currentTimeMillis()
            )
        );
        
        response.put("success", true);
        response.put("data", contents);
        return response;
    }
    
    // ===== Interest APIs =====
    
    @GetMapping("/interest/searches")
    public Map<String, Object> getInterestSearches(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            return response;
        }
        
        Map<String, Object> data = new HashMap<>();
        data.put("searches", List.of());
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
        data.put("matches", List.of());
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
}