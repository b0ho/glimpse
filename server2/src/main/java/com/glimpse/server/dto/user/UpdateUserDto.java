package com.glimpse.server.dto.user;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 사용자 수정 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUserDto {
    
    @Size(min = 2, max = 20, message = "닉네임은 2-20자 사이여야 합니다")
    private String nickname;
    
    @Min(value = 18, message = "만 18세 이상만 가입 가능합니다")
    @Max(value = 100, message = "올바른 나이를 입력해주세요")
    private Integer age;
    
    @Size(max = 500, message = "자기소개는 500자 이내로 작성해주세요")
    private String bio;
    
    private String profileImage;
    
    @Min(value = 140, message = "키는 140cm 이상이어야 합니다")
    @Max(value = 230, message = "키는 230cm 이하여야 합니다")
    private Integer height;
    
    @Pattern(regexp = "^[EI][NS][TF][JP]$", message = "올바른 MBTI 타입이 아닙니다")
    private String mbti;
    
    private String drinking;
    private String smoking;
    private String education;
    private String companyName;
    private String location;
    
    private List<String> interests;
}