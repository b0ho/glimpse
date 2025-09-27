package com.glimpse.server.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/matching")
@CrossOrigin(origins = "*")
public class MatchingController {
    
    @PostMapping("/like")
    public Map<String, Object> sendLike(
            @RequestBody Map<String, Object> request,
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        
        Map<String, Object> response = new HashMap<>();
        
        // Simulate match (30% chance)
        boolean isMatch = Math.random() < 0.3;
        
        response.put("success", true);
        response.put("isMatch", isMatch);
        
        if (isMatch) {
            Map<String, Object> match = new HashMap<>();
            match.put("id", "match-" + UUID.randomUUID().toString().substring(0, 8));
            match.put("userId", request.get("toUserId"));
            match.put("nickname", "매칭된유저");
            match.put("matchedAt", new Date().toInstant().toString());
            response.put("match", match);
            response.put("message", "축하합니다! 서로 좋아요를 눌렀습니다!");
        } else {
            response.put("message", "좋아요를 보냈습니다");
        }
        
        return response;
    }
    
    @GetMapping("/recommendations")
    public Map<String, Object> getRecommendations(
            @RequestParam(defaultValue = "group-1") String groupId,
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        
        List<Map<String, Object>> recommendations = new ArrayList<>();
        
        // Generate mock recommendations
        for (int i = 1; i <= 5; i++) {
            Map<String, Object> user = new HashMap<>();
            user.put("id", "user-rec-" + i);
            user.put("nickname", "익명유저" + i);
            user.put("age", 20 + (int)(Math.random() * 10));
            user.put("bio", "안녕하세요! 좋은 인연 만들고 싶어요.");
            user.put("interests", Arrays.asList("영화", "음악", "여행", "독서"));
            user.put("groupId", groupId);
            user.put("isOnline", Math.random() < 0.5);
            user.put("lastActiveAt", new Date().toInstant().toString());
            
            Map<String, Object> profile = new HashMap<>();
            profile.put("height", 165 + (int)(Math.random() * 20));
            profile.put("education", "대학교");
            profile.put("job", "직장인");
            user.put("profile", profile);
            
            recommendations.add(user);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("data", recommendations);
        response.put("total", recommendations.size());
        
        return response;
    }
    
    @GetMapping("/matches")
    public Map<String, Object> getMatches(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        
        List<Map<String, Object>> matches = new ArrayList<>();
        
        // Generate mock matches
        for (int i = 1; i <= 3; i++) {
            Map<String, Object> match = new HashMap<>();
            match.put("id", "match-" + i);
            match.put("userId", "user-matched-" + i);
            match.put("nickname", "매칭유저" + i);
            match.put("matchedAt", new Date().toInstant().toString());
            match.put("lastMessage", "안녕하세요!");
            match.put("unreadCount", (int)(Math.random() * 5));
            match.put("isOnline", Math.random() < 0.3);
            
            matches.add(match);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("data", matches);
        response.put("total", matches.size());
        
        return response;
    }
}