package com.glimpse.server.dto.matching;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationCodeDto {
    private String matchId;
    private String code;
    private LocalDateTime expiresAt;
}