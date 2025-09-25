package com.glimpse.server.controller;

import com.glimpse.server.dto.common.ApiResponse;
import com.glimpse.server.entity.User;
import com.glimpse.server.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 사용자 컨트롤러 (간소화 버전)
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class UserController {
    
    private final UserService userService;
    
    /**
     * 사용자 목록 조회
     */
    @GetMapping
    public ApiResponse<List<User>> getUsers() {
        List<User> users = userService.findAllActive();
        return ApiResponse.success(users);
    }
    
    /**
     * 사용자 통계
     */
    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getUserStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userService.countActiveUsers());
        stats.put("activeUsers", userService.countActiveUsers());
        return ApiResponse.success(stats);
    }
    
    /**
     * 현재 사용자 정보 (개발 모드용)
     */
    @GetMapping("/me")
    public ApiResponse<Map<String, Object>> getCurrentUser(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        
        Map<String, Object> user = new HashMap<>();
        if ("true".equals(devAuth)) {
            // 개발 모드 테스트 사용자
            user.put("id", "test-user-001");
            user.put("nickname", "테스트 사용자");
            user.put("phoneNumber", "+821012345678");
            user.put("isVerified", true);
            user.put("credits", 10);
            user.put("isPremium", false);
            return ApiResponse.success(user, "Development mode user");
        }
        
        return ApiResponse.error("Unauthorized");
    }
}