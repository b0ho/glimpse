package com.glimpse.server.service;

import com.glimpse.server.dto.user.UserDto;
import com.glimpse.server.entity.User;
import com.glimpse.server.entity.enums.Gender;
import com.glimpse.server.entity.enums.PremiumLevel;
import com.glimpse.server.repository.UserRepositoryNew;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class UserServiceImpl {
    
    private final UserRepositoryNew userRepository;
    
    public Optional<UserDto> findById(String id) {
        return userRepository.findById(id)
            .map(this::convertToDto);
    }
    
    public Optional<UserDto> findByPhoneNumber(String phoneNumber) {
        return userRepository.findByPhoneNumber(phoneNumber)
            .map(this::convertToDto);
    }
    
    @Transactional
    public UserDto createUser(UserDto dto) {
        User user = User.builder()
            .phoneNumber(dto.getPhoneNumber())
            .nickname(dto.getNickname())
            .age(dto.getAge())
            .gender(dto.getGender())
            .bio(dto.getBio())
            .isVerified(false)
            .isPremium(false)
            .credits(1)
            .build();
        
        user = userRepository.save(user);
        log.info("Created new user: {}", user.getId());
        return convertToDto(user);
    }
    
    @Transactional
    public void updateLastActive(String userId) {
        userRepository.updateLastActive(userId, LocalDateTime.now());
    }
    
    // Native Query 사용 - 복잡한 매칭 로직
    public List<UserDto> findPotentialMatches(String userId, int limit) {
        List<User> matches = userRepository.findPotentialMatches(userId, limit);
        return matches.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    // Native Query 사용 - 근처 사용자
    public List<Map<String, Object>> findNearbyUsers(String userId, Double latitude, 
                                                      Double longitude, Double radiusKm) {
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        List<Object[]> results = userRepository.findNearbyUsers(
            userId, latitude, longitude, radiusKm, since, 50
        );
        
        List<Map<String, Object>> nearbyUsers = new ArrayList<>();
        for (Object[] row : results) {
            User user = (User) row[0];
            Double distance = (Double) row[1];
            
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("user", convertToDto(user));
            userMap.put("distance", distance);
            nearbyUsers.add(userMap);
        }
        
        return nearbyUsers;
    }
    
    // Native Query 사용 - 그룹 기반 추천
    public List<Map<String, Object>> recommendUsersByGroups(String userId, String preferredGender,
                                                            int minAge, int maxAge) {
        List<Object[]> results = userRepository.recommendUsersByGroups(
            userId, preferredGender, minAge, maxAge, 20
        );
        
        List<Map<String, Object>> recommendations = new ArrayList<>();
        for (Object[] row : results) {
            User user = (User) row[0];
            Long commonGroups = ((Number) row[1]).longValue();
            
            Map<String, Object> recommendation = new HashMap<>();
            recommendation.put("user", convertToDto(user));
            recommendation.put("commonGroups", commonGroups);
            recommendation.put("score", calculateRecommendationScore(user, commonGroups));
            recommendations.add(recommendation);
        }
        
        return recommendations;
    }
    
    @Transactional
    public void addCredits(String userId, int amount) {
        userRepository.addCredits(userId, amount);
        log.info("Added {} credits to user {}", amount, userId);
    }
    
    @Transactional
    public void updatePremiumStatus(String userId, boolean isPremium, String level, LocalDateTime until) {
        userRepository.updatePremiumStatus(userId, isPremium, level, until);
        log.info("Updated premium status for user {}: isPremium={}, level={}", userId, isPremium, level);
    }
    
    private UserDto convertToDto(User user) {
        return UserDto.builder()
            .id(user.getId())
            .phoneNumber(user.getPhoneNumber())
            .nickname(user.getNickname())
            .age(user.getAge())
            .gender(user.getGender())
            .bio(user.getBio())
            .profileImage(user.getProfileImage())
            .isVerified(user.getIsVerified())
            .isPremium(user.getIsPremium())
            .premiumLevel(user.getPremiumLevel())
            .credits(user.getCredits())
            .lastActive(user.getLastActive())
            .build();
    }
    
    private double calculateRecommendationScore(User user, Long commonGroups) {
        double score = commonGroups * 10.0;
        
        // 최근 활동 가중치
        if (user.getLastActive() != null) {
            long hoursSinceActive = java.time.Duration.between(
                user.getLastActive(), LocalDateTime.now()
            ).toHours();
            
            if (hoursSinceActive < 24) score += 5.0;
            else if (hoursSinceActive < 72) score += 3.0;
            else if (hoursSinceActive < 168) score += 1.0;
        }
        
        // 프리미엄 사용자 가중치
        if (Boolean.TRUE.equals(user.getIsPremium())) score += 2.0;
        
        // 인증 사용자 가중치
        if (Boolean.TRUE.equals(user.getIsVerified())) score += 3.0;
        
        return score;
    }
}