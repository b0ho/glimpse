package com.glimpse.server.dto.user;

import com.glimpse.server.entity.enums.Gender;
import lombok.*;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 사용자 생성 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateUserDto {
    
    @NotNull(message = "전화번호는 필수입니다")
    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "올바른 전화번호 형식이 아닙니다")
    private String phoneNumber;
    
    @Size(min = 2, max = 20, message = "닉네임은 2-20자 사이여야 합니다")
    private String nickname;
    
    private Integer age;
    
    private Gender gender;
    
    private String profileImage;
    
    @Size(max = 500, message = "자기소개는 500자 이하여야 합니다")
    private String bio;
    
    private String clerkId;
    
    private String companyName;
    
    private String education;
    
    private String location;
    
    private Integer height;
    
    private String mbti;
    
    private String religion;
    
    private Boolean isDrinking;
    
    private Boolean isSmoking;
}