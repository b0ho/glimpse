package com.glimpse.server.dto.auth;

import lombok.*;
import jakarta.validation.constraints.NotNull;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginDto {
    
    @NotNull(message = "전화번호는 필수입니다")
    private String phoneNumber;
    
    private String password; // 개발 모드에서는 사용 안함
    
    private String clerkToken; // Clerk 인증 토큰
}