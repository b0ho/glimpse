package com.glimpse.server.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

/**
 * 메시지 반응 엔티티
 *
 * <p>채팅 메시지에 대한 사용자의 이모지 반응을 관리합니다.
 * 사용자는 메시지에 좋아요, 하트, 웃음 등 다양한 이모지로 반응할 수 있으며,
 * 하나의 메시지에 여러 사용자가 각각 다른 이모지로 반응할 수 있습니다.</p>
 *
 * <p>주요 관계:</p>
 * <ul>
 *   <li>@ManyToOne - ChatMessage: 반응 대상 메시지 (LAZY 로딩, 필수)</li>
 *   <li>@ManyToOne - User: 반응을 남긴 사용자 (LAZY 로딩, 필수)</li>
 * </ul>
 *
 * <p>주요 기능:</p>
 * <ul>
 *   <li>메시지에 대한 이모지 반응 추가</li>
 *   <li>메시지별 반응 집계 (이모지 종류별 카운트)</li>
 *   <li>사용자별 반응 관리 (추가/삭제)</li>
 *   <li>실시간 반응 업데이트 (WebSocket 연동)</li>
 *   <li>인기 메시지 선정 기준</li>
 * </ul>
 *
 * <p>비즈니스 규칙:</p>
 * <ul>
 *   <li>한 사용자는 같은 메시지에 여러 이모지로 반응 가능</li>
 *   <li>한 사용자는 같은 메시지에 같은 이모지로 중복 반응 불가 (unique constraint 필요)</li>
 *   <li>반응 추가 시 메시지 작성자에게 알림 발송</li>
 *   <li>메시지 삭제 시 모든 반응도 함께 삭제 (CASCADE DELETE)</li>
 *   <li>이모지는 유니코드 표준 이모지만 허용 (보안 및 호환성)</li>
 * </ul>
 *
 * <p>사용 예시:</p>
 * <pre>{@code
 * // 메시지 반응 추가
 * MessageReaction reaction = MessageReaction.builder()
 *     .message(chatMessage)
 *     .user(user)
 *     .emoji("👍")
 *     .build();
 * messageReactionRepository.save(reaction);
 *
 * // 메시지의 반응 집계
 * Map<String, Long> reactionCounts = messageReactionRepository
 *     .findByMessage(message)
 *     .stream()
 *     .collect(Collectors.groupingBy(
 *         MessageReaction::getEmoji,
 *         Collectors.counting()
 *     ));
 *
 * // 사용자가 특정 이모지로 반응했는지 확인
 * boolean hasReacted = messageReactionRepository
 *     .existsByMessageAndUserAndEmoji(message, user, "❤️");
 * }</pre>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Entity
@Table(name = "MessageReaction")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageReaction extends BaseEntity {

    /**
     * 메시지 반응 고유 식별자
     * <p>CUID 생성 전략을 사용하여 충돌 없는 고유한 ID를 자동 생성합니다.
     * CUID는 분산 시스템에서도 안전하게 사용할 수 있는 정렬 가능한 고유 식별자입니다.</p>
     */
    @Id
    @GeneratedValue(generator = "cuid")
    @GenericGenerator(name = "cuid", strategy = "com.glimpse.server.util.CuidGenerator")
    @Column(name = "id")
    private String id;

    /**
     * 반응 대상 채팅 메시지
     * <p>사용자가 반응을 남긴 채팅 메시지를 나타냅니다.
     * LAZY 로딩을 사용하여 반응 정보 조회 시 메시지 내용은 필요할 때만 로드됩니다.</p>
     *
     * <p>특징:</p>
     * <ul>
     *   <li>필수값: 모든 반응은 반드시 메시지와 연결되어야 함</li>
     *   <li>LAZY 로딩: 성능 최적화를 위한 지연 로딩</li>
     *   <li>CASCADE DELETE 권장: 메시지 삭제 시 반응도 함께 삭제</li>
     *   <li>인덱스 권장: 메시지별 반응 조회 및 집계 쿼리 최적화</li>
     * </ul>
     *
     * <p>사용 시나리오:</p>
     * <ul>
     *   <li>메시지의 인기도 측정</li>
     *   <li>채팅방 활성도 분석</li>
     *   <li>사용자 참여도 통계</li>
     *   <li>인기 메시지 하이라이트</li>
     * </ul>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private ChatMessage message;

    /**
     * 반응을 남긴 사용자
     * <p>메시지에 이모지 반응을 표시한 사용자입니다.
     * LAZY 로딩을 사용하여 필요 시에만 사용자 정보를 로드합니다.</p>
     *
     * <p>특징:</p>
     * <ul>
     *   <li>필수값: 모든 반응은 반드시 사용자와 연결되어야 함</li>
     *   <li>LAZY 로딩: 성능 최적화를 위한 지연 로딩</li>
     *   <li>CASCADE 없음: 사용자 삭제 시 반응 처리 정책 필요 (익명화 또는 삭제)</li>
     *   <li>인덱스 권장: 사용자별 반응 조회 최적화</li>
     * </ul>
     *
     * <p>사용 시나리오:</p>
     * <ul>
     *   <li>누가 어떤 메시지에 반응했는지 추적</li>
     *   <li>사용자별 반응 패턴 분석</li>
     *   <li>채팅방 내 사용자 활동 모니터링</li>
     *   <li>반응 알림 수신자 결정</li>
     * </ul>
     *
     * <p>데이터 정합성:</p>
     * <ul>
     *   <li>복합 유니크 제약: (message_id, user_id, emoji) 조합은 유니크해야 함</li>
     *   <li>중복 반응 방지를 위한 DB 제약조건 또는 애플리케이션 레벨 검증 필요</li>
     * </ul>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * 반응 이모지
     * <p>사용자가 선택한 이모지입니다.
     * 유니코드 표준 이모지 문자열로 저장되며, 다양한 감정과 반응을 표현합니다.</p>
     *
     * <p>특징:</p>
     * <ul>
     *   <li>필수값: 반응은 반드시 이모지를 포함해야 함</li>
     *   <li>유니코드 이모지: "👍", "❤️", "😂", "😮", "😢", "🙏" 등</li>
     *   <li>저장 형식: UTF-8 인코딩된 이모지 문자열</li>
     *   <li>길이 제한: 일반적으로 단일 이모지 또는 시퀀스 (예: 👨‍👩‍👧‍👦)</li>
     * </ul>
     *
     * <p>일반적인 이모지 목록:</p>
     * <ul>
     *   <li>👍 (좋아요), 👎 (싫어요)</li>
     *   <li>❤️ (하트), 🔥 (불)</li>
     *   <li>😂 (웃음), 😮 (놀람), 😢 (슬픔)</li>
     *   <li>🎉 (축하), 🙏 (감사), 💯 (100점)</li>
     * </ul>
     *
     * <p>검증 사항:</p>
     * <ul>
     *   <li>유효한 유니코드 이모지인지 검증 필요</li>
     *   <li>허용된 이모지 목록 관리 (선택적)</li>
     *   <li>최대 길이 제한 (복합 이모지 고려)</li>
     *   <li>XSS 공격 방지 (일반 텍스트 차단)</li>
     * </ul>
     *
     * <p>사용 예시:</p>
     * <pre>{@code
     * // 단일 이모지
     * reaction.setEmoji("👍");
     *
     * // 스킨톤이 있는 이모지
     * reaction.setEmoji("👍🏻");
     *
     * // 복합 이모지
     * reaction.setEmoji("👨‍👩‍👧‍👦");
     * }</pre>
     */
    @Column(name = "emoji", nullable = false)
    private String emoji;
}