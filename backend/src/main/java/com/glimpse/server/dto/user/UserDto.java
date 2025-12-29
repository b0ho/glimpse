package com.glimpse.server.dto.user;

import com.glimpse.server.entity.enums.Gender;
import com.glimpse.server.entity.enums.PremiumLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * User DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {
    private String id;
    private String clerkId;
    private String anonymousId;
    private String phoneNumber;
    private String nickname;
    private Integer age;
    private Gender gender;
    private String profileImage;
    private String bio;
    private Boolean isVerified;
    private Integer credits;
    private Boolean isPremium;
    private PremiumLevel premiumLevel;
    private LocalDateTime premiumUntil;
    private LocalDateTime lastActive;
    private LocalDateTime lastOnline;
    private String companyName;
    private String education;
    private String location;
    private Integer height;
    private String mbti;
    private String drinking;
    private String smoking;
    private List<String> interests;
    private List<String> groups;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}