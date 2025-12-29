package com.glimpse.server.dto.matching;

import lombok.*;
import java.time.LocalDateTime;

/**
 * 매칭 인증 코드 데이터 전송 객체
 *
 * <p>매칭된 사용자 간 신원 확인을 위한 인증 코드 정보를 전달합니다.
 * 일회성 코드로 만료 시간이 있으며, 안전한 매칭 확인을 위해 사용됩니다.</p>
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
public class VerificationCodeDto {
    /** 매칭 고유 식별자 */
    private String matchId;

    /** 인증 코드 (일회성) */
    private String code;

    /** 코드 만료 시간 */
    private LocalDateTime expiresAt;
}