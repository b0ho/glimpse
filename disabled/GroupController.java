package com.glimpse.server.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/groups")
@CrossOrigin(origins = "*")
public class GroupController {
    
    @GetMapping
    public Map<String, Object> getGroups(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        
        // In dev mode, accept x-dev-auth header
        if (!"true".equals(devAuth) && auth == null) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Unauthorized");
            errorResponse.put("status", 401);
            return errorResponse;
        }
        
        List<Map<String, Object>> groups = new ArrayList<>();
        
        // Sample group 1
        Map<String, Object> group1 = new HashMap<>();
        group1.put("id", "group-1");
        group1.put("name", "서강대학교");
        group1.put("type", "OFFICIAL");
        group1.put("description", "서강대학교 공식 그룹입니다");
        group1.put("memberCount", 1234);
        group1.put("maleCount", 654);
        group1.put("femaleCount", 580);
        group1.put("isMatchingActive", true);
        group1.put("creatorId", "admin");
        group1.put("createdAt", "2025-01-14T10:00:00Z");
        group1.put("updatedAt", "2025-01-14T10:00:00Z");
        
        Map<String, Object> location1 = new HashMap<>();
        location1.put("latitude", 37.5512);
        location1.put("longitude", 126.9409);
        location1.put("address", "서울 마포구 서강대로");
        group1.put("location", location1);
        
        // Sample group 2
        Map<String, Object> group2 = new HashMap<>();
        group2.put("id", "group-2");
        group2.put("name", "연세대학교");
        group2.put("type", "OFFICIAL");
        group2.put("description", "연세대학교 공식 그룹입니다");
        group2.put("memberCount", 2156);
        group2.put("maleCount", 1100);
        group2.put("femaleCount", 1056);
        group2.put("isMatchingActive", true);
        group2.put("creatorId", "admin");
        group2.put("createdAt", "2025-01-14T10:00:00Z");
        group2.put("updatedAt", "2025-01-14T10:00:00Z");
        
        Map<String, Object> location2 = new HashMap<>();
        location2.put("latitude", 37.5663);
        location2.put("longitude", 126.9389);
        location2.put("address", "서울 서대문구 연세로");
        group2.put("location", location2);
        
        groups.add(group1);
        groups.add(group2);
        
        Map<String, Object> response = new HashMap<>();
        response.put("data", groups);
        response.put("total", groups.size());
        response.put("page", 1);
        response.put("limit", 10);
        
        return response;
    }
    
    @GetMapping("/{id}")
    public Map<String, Object> getGroup(
            @PathVariable String id,
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        
        Map<String, Object> group = new HashMap<>();
        group.put("id", id);
        group.put("name", "서강대학교");
        group.put("type", "OFFICIAL");
        group.put("description", "서강대학교 공식 그룹입니다");
        group.put("memberCount", 1234);
        
        return group;
    }
}