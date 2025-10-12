package com.glimpse.server.dto.auth;

import lombok.*;
import jakarta.validation.constraints.NotNull;

/**
 * 로그인 요청 데이터 전송 객체
 *
 * <p>사용자 로그인 시 전송되는 인증 정보를 담고 있습니다.
 * 전화번호 기반 인증과 Clerk 인증을 모두 지원하며,
 * 개발 모드에서는 간소화된 인증 프로세스를 제공합니다.</p>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginDto {

    /** 사용자 전화번호 (필수, 한국 형식: +821012345678) */
    @NotNull(message = "전화번호는 필수입니다")
    private String phoneNumber;

    /** 비밀번호 (프로덕션 환경에서 사용, 개발 모드에서는 선택) */
    private String password;

    /** Clerk 인증 토큰 (Clerk 인증 방식 사용 시) */
    private String clerkToken;
}