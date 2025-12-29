package com.glimpse.server.dto.matching;

import lombok.*;
import jakarta.validation.constraints.NotNull;

/**
 * 좋아요 전송 요청 데이터 전송 객체
 *
 * <p>사용자가 다른 사용자에게 좋아요를 보낼 때 사용되는 요청 DTO입니다.
 * 일반 좋아요, 슈퍼 좋아요, 익명 좋아요 등의 옵션을 설정할 수 있으며,
 * 좋아요와 함께 메시지를 전송할 수 있습니다.</p>
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
public class SendLikeDto {

    /** 좋아요를 받을 사용자 ID (필수) */
    @NotNull(message = "수신자 ID는 필수입니다")
    private String receiverId;

    /** 좋아요가 발생한 그룹 ID (선택) */
    private String groupId;

    /** 슈퍼 좋아요 여부 (프리미엄 기능) */
    private Boolean isSuperLike;

    /** 익명 좋아요 여부 */
    private Boolean isAnonymous;

    /** 좋아요와 함께 전송할 메시지 (선택) */
    private String message;
}