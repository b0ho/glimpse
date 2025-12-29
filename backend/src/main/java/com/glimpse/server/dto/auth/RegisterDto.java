package com.glimpse.server.dto.auth;

import com.glimpse.server.entity.enums.Gender;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 회원가입 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterDto {
    
    @NotBlank(message = "전화번호는 필수입니다")
    @Pattern(regexp = "^01[0-9]-?[0-9]{4}-?[0-9]{4}$", message = "올바른 한국 전화번호 형식이 아닙니다")
    private String phoneNumber;
    
    @NotBlank(message = "인증 코드는 필수입니다")
    @Size(min = 6, max = 6, message = "인증 코드는 6자리여야 합니다")
    private String verificationCode;
    
    @Size(min = 2, max = 20, message = "닉네임은 2-20자 사이여야 합니다")
    private String nickname;
    
    @NotNull(message = "나이는 필수입니다")
    @Min(value = 18, message = "만 18세 이상만 가입 가능합니다")
    @Max(value = 100, message = "올바른 나이를 입력해주세요")
    private Integer age;
    
    @NotNull(message = "성별은 필수입니다")
    private Gender gender;
    
    private String clerkId;
}