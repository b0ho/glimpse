package com.glimpse.server.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    
    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        // Mock user data
        Map<String, Object> user = new HashMap<>();
        user.put("id", "user-" + UUID.randomUUID().toString().substring(0, 8));
        user.put("email", request.get("email"));
        user.put("name", request.get("name"));
        user.put("createdAt", new Date().toInstant().toString());
        
        response.put("user", user);
        response.put("token", "mock-jwt-token-" + UUID.randomUUID().toString());
        response.put("message", "Registration successful");
        
        return response;
    }
    
    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        // Mock authentication
        String email = (String) request.get("email");
        String password = (String) request.get("password");
        
        if (email == null || password == null) {
            response.put("error", "Email and password required");
            response.put("status", 400);
            return response;
        }
        
        // Mock user data
        Map<String, Object> user = new HashMap<>();
        user.put("id", "user-12345678");
        user.put("email", email);
        user.put("name", "테스트 유저");
        user.put("nickname", "테스터");
        user.put("isPremium", false);
        
        response.put("user", user);
        response.put("token", "mock-jwt-token-" + UUID.randomUUID().toString());
        response.put("message", "Login successful");
        
        return response;
    }
    
    @GetMapping("/me")
    public Map<String, Object> getMe(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        
        if (!"true".equals(devAuth) && auth == null) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Unauthorized");
            errorResponse.put("status", 401);
            return errorResponse;
        }
        
        Map<String, Object> user = new HashMap<>();
        user.put("id", "user-12345678");
        user.put("email", "test@example.com");
        user.put("name", "테스트 유저");
        user.put("nickname", "테스터");
        user.put("isPremium", false);
        user.put("groupIds", Arrays.asList("group-1", "group-2"));
        
        return user;
    }
}