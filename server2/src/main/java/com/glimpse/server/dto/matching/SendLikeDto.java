package com.glimpse.server.dto.matching;

import lombok.*;
import jakarta.validation.constraints.NotNull;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendLikeDto {
    
    @NotNull(message = "수신자 ID는 필수입니다")
    private String receiverId;
    
    private String groupId;
    
    private Boolean isSuperLike;
    
    private Boolean isAnonymous;
    
    private String message;
}