package com.glimpse.server.service;

import com.glimpse.server.dto.match.MatchDto;
import com.glimpse.server.entity.enums.MatchStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

/**
 * Match Service 인터페이스
 *
 * <p>매칭 관련 비즈니스 로직을 정의하는 인터페이스입니다.</p>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
public interface MatchService {

    /**
     * 매칭 ID로 매칭 조회
     *
     * @param matchId 매칭 ID
     * @param currentUserId 현재 사용자 ID (권한 확인용)
     * @return 매칭 DTO
     */
    Optional<MatchDto> getMatchById(String matchId, String currentUserId);

    /**
     * 사용자의 모든 활성 매칭 조회 (페이징)
     *
     * @param userId 사용자 ID
     * @param pageable 페이징 정보
     * @return 매칭 목록
     */
    Page<MatchDto> getActiveMatchesByUserId(String userId, Pageable pageable);

    /**
     * 사용자의 매칭 조회 (상태별)
     *
     * @param userId 사용자 ID
     * @param status 매칭 상태
     * @return 매칭 목록
     */
    List<MatchDto> getMatchesByUserIdAndStatus(String userId, MatchStatus status);

    /**
     * 두 사용자 간의 매칭 조회
     *
     * @param user1Id 사용자1 ID
     * @param user2Id 사용자2 ID
     * @return 매칭 DTO
     */
    Optional<MatchDto> getMatchBetweenUsers(String user1Id, String user2Id);

    /**
     * 사용자의 활성 매칭 수 조회
     *
     * @param userId 사용자 ID
     * @return 활성 매칭 수
     */
    long countActiveMatches(String userId);

    /**
     * 그룹 내 매칭 조회
     *
     * @param groupId 그룹 ID
     * @return 매칭 목록
     */
    List<MatchDto> getMatchesByGroupId(String groupId);

    /**
     * 읽지 않은 메시지가 있는 매칭 조회
     *
     * @param userId 사용자 ID
     * @return 매칭 목록
     */
    List<MatchDto> getMatchesWithUnreadMessages(String userId);

    /**
     * 신원 공개 요청
     *
     * @param matchId 매칭 ID
     * @param userId 요청하는 사용자 ID
     * @return 업데이트된 매칭 DTO
     */
    MatchDto requestReveal(String matchId, String userId);

    /**
     * 신원 공개 승인
     *
     * @param matchId 매칭 ID
     * @param userId 승인하는 사용자 ID
     * @return 업데이트된 매칭 DTO
     */
    MatchDto acceptReveal(String matchId, String userId);

    /**
     * 매칭 해제
     *
     * @param matchId 매칭 ID
     * @param userId 해제하는 사용자 ID
     * @param reason 해제 사유
     * @return 업데이트된 매칭 DTO
     */
    MatchDto unmatch(String matchId, String userId, String reason);

    /**
     * 메시지 전송 후 매칭 정보 업데이트
     *
     * @param matchId 매칭 ID
     * @param senderId 발신자 ID
     * @param messageContent 메시지 내용
     */
    void updateMatchAfterMessage(String matchId, String senderId, String messageContent);

    /**
     * 메시지 읽음 처리
     *
     * @param matchId 매칭 ID
     * @param userId 읽은 사용자 ID
     */
    void markMessagesAsRead(String matchId, String userId);
}
