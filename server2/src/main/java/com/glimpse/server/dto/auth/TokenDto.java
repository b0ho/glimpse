package com.glimpse.server.dto.auth;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TokenDto {
    
    private String accessToken;
    
    private String refreshToken;
    
    private String tokenType;
    
    private Long expiresIn;
}