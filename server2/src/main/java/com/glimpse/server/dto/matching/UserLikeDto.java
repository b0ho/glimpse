package com.glimpse.server.dto.matching;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserLikeDto {
    private String id;
    private String senderId;
    private String receiverId;
    private String groupId;
    private Boolean isSuperLike;
    private Boolean isAnonymous;
    private String message;
    private Boolean isSeen;
    private Boolean isMatched;
    private LocalDateTime createdAt;
    private LocalDateTime matchedAt;
    private LocalDateTime expiresAt;
}