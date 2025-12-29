package com.glimpse.server.service;

import com.glimpse.server.dto.match.MatchDto;
import com.glimpse.server.dto.user.UserDto;
import com.glimpse.server.entity.Match;
import com.glimpse.server.entity.User;
import com.glimpse.server.entity.enums.MatchStatus;
import com.glimpse.server.repository.MatchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Match Service Implementation
 *
 * <p>매칭 관련 비즈니스 로직을 구현하는 서비스입니다.</p>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MatchServiceImpl implements MatchService {

    private final MatchRepository matchRepository;
    private final UserService userService;

    @Override
    public Optional<MatchDto> getMatchById(String matchId, String currentUserId) {
        log.debug("Getting match by ID: {} for user: {}", matchId, currentUserId);

        return matchRepository.findById(matchId)
                .filter(match -> isParticipant(match, currentUserId))
                .map(match -> convertToDto(match, currentUserId));
    }

    @Override
    public Page<MatchDto> getActiveMatchesByUserId(String userId, Pageable pageable) {
        log.debug("Getting active matches for user: {}", userId);

        return matchRepository.findActiveMatchesByUserId(userId, pageable)
                .map(match -> convertToDto(match, userId));
    }

    @Override
    public List<MatchDto> getMatchesByUserIdAndStatus(String userId, MatchStatus status) {
        log.debug("Getting matches for user: {} with status: {}", userId, status);

        return matchRepository.findByUserIdAndStatus(userId, status)
                .stream()
                .map(match -> convertToDto(match, userId))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<MatchDto> getMatchBetweenUsers(String user1Id, String user2Id) {
        log.debug("Getting match between users: {} and {}", user1Id, user2Id);

        return matchRepository.findMatchBetweenUsers(user1Id, user2Id)
                .map(match -> {
                    // user1Id를 기준으로 변환
                    return convertToDto(match, user1Id);
                });
    }

    @Override
    public long countActiveMatches(String userId) {
        log.debug("Counting active matches for user: {}", userId);
        return matchRepository.countActiveMatchesByUserId(userId);
    }

    @Override
    public List<MatchDto> getMatchesByGroupId(String groupId) {
        log.debug("Getting matches for group: {}", groupId);

        return matchRepository.findByGroupId(groupId)
                .stream()
                .map(match -> {
                    // 그룹 조회시에는 user1을 기준으로 변환
                    return convertToDto(match, match.getUser1().getId());
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<MatchDto> getMatchesWithUnreadMessages(String userId) {
        log.debug("Getting matches with unread messages for user: {}", userId);

        return matchRepository.findMatchesWithUnreadMessages(userId)
                .stream()
                .map(match -> convertToDto(match, userId))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MatchDto requestReveal(String matchId, String userId) {
        log.info("User {} requesting reveal for match: {}", userId, matchId);

        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("매칭을 찾을 수 없습니다: " + matchId));

        // 권한 확인
        if (!isParticipant(match, userId)) {
            throw new IllegalArgumentException("이 매칭에 접근할 권한이 없습니다");
        }

        // 이미 공개된 경우
        if (!match.getIsAnonymous()) {
            throw new IllegalArgumentException("이미 신원이 공개된 매칭입니다");
        }

        // 이미 요청된 경우 - 상대방이 요청했다면 즉시 공개
        if (match.getRevealRequestedBy() != null) {
            if (match.getRevealRequestedBy().equals(userId)) {
                throw new IllegalArgumentException("이미 신원 공개를 요청하셨습니다");
            } else {
                // 상대방이 이미 요청했으므로 즉시 공개
                match.setIsAnonymous(false);
                match.setRevealedAt(LocalDateTime.now());
                log.info("Both users agreed to reveal. Match revealed: {}", matchId);
            }
        } else {
            // 처음 요청
            match.setRevealRequestedBy(userId);
            match.setRevealRequestedAt(LocalDateTime.now());
            log.info("Reveal requested by user: {} for match: {}", userId, matchId);
        }

        Match savedMatch = matchRepository.save(match);
        return convertToDto(savedMatch, userId);
    }

    @Override
    @Transactional
    public MatchDto acceptReveal(String matchId, String userId) {
        log.info("User {} accepting reveal for match: {}", userId, matchId);

        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("매칭을 찾을 수 없습니다: " + matchId));

        // 권한 확인
        if (!isParticipant(match, userId)) {
            throw new IllegalArgumentException("이 매칭에 접근할 권한이 없습니다");
        }

        // 상대방이 요청했는지 확인
        if (match.getRevealRequestedBy() == null) {
            throw new IllegalArgumentException("신원 공개 요청이 없습니다");
        }

        if (match.getRevealRequestedBy().equals(userId)) {
            throw new IllegalArgumentException("자신의 요청은 승인할 수 없습니다");
        }

        // 신원 공개
        match.setIsAnonymous(false);
        match.setRevealedAt(LocalDateTime.now());

        Match savedMatch = matchRepository.save(match);
        log.info("Reveal accepted. Match revealed: {}", matchId);

        return convertToDto(savedMatch, userId);
    }

    @Override
    @Transactional
    public MatchDto unmatch(String matchId, String userId, String reason) {
        log.info("User {} unmatching from match: {} with reason: {}", userId, matchId, reason);

        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("매칭을 찾을 수 없습니다: " + matchId));

        // 권한 확인
        if (!isParticipant(match, userId)) {
            throw new IllegalArgumentException("이 매칭에 접근할 권한이 없습니다");
        }

        // 이미 해제된 경우
        if (match.getUnmatchedAt() != null) {
            throw new IllegalArgumentException("이미 해제된 매칭입니다");
        }

        match.setStatus(MatchStatus.UNMATCHED);
        match.setUnmatchedAt(LocalDateTime.now());
        match.setUnmatchReason(reason);

        Match savedMatch = matchRepository.save(match);
        log.info("Match unmatched successfully: {}", matchId);

        return convertToDto(savedMatch, userId);
    }

    @Override
    @Transactional
    public void updateMatchAfterMessage(String matchId, String senderId, String messageContent) {
        log.debug("Updating match {} after message from user: {}", matchId, senderId);

        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("매칭을 찾을 수 없습니다: " + matchId));

        // 마지막 메시지 정보 업데이트
        match.setLastMessage(messageContent);
        match.setLastMessageAt(LocalDateTime.now());
        match.setMessageCount(match.getMessageCount() + 1);

        // 상대방의 읽지 않은 메시지 수 증가
        match.incrementUnreadCount(senderId);

        matchRepository.save(match);
        log.debug("Match updated after message");
    }

    @Override
    @Transactional
    public void markMessagesAsRead(String matchId, String userId) {
        log.debug("Marking messages as read for match: {} by user: {}", matchId, userId);

        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("매칭을 찾을 수 없습니다: " + matchId));

        // 권한 확인
        if (!isParticipant(match, userId)) {
            throw new IllegalArgumentException("이 매칭에 접근할 권한이 없습니다");
        }

        // 읽지 않은 메시지 수 초기화
        match.resetUnreadCount(userId);

        matchRepository.save(match);
        log.debug("Messages marked as read");
    }

    /**
     * Match 엔티티를 MatchDto로 변환합니다.
     *
     * @param match Match 엔티티
     * @param currentUserId 현재 사용자 ID (상대방 정보 조회용)
     * @return MatchDto
     */
    private MatchDto convertToDto(Match match, String currentUserId) {
        // 상대방 사용자 정보 조회
        User otherUser = match.getOtherUser(currentUserId);
        UserDto otherUserDto = null;

        if (otherUser != null) {
            otherUserDto = userService.getUserById(otherUser.getId())
                    .orElse(null);
        }

        // 현재 사용자의 읽지 않은 메시지 수 조회
        Integer unreadCount = match.getUnreadCount(currentUserId);

        return MatchDto.builder()
                .id(match.getId())
                .status(match.getStatus())
                .otherUser(otherUserDto)
                .groupId(match.getGroup() != null ? match.getGroup().getId() : null)
                .isAnonymous(match.getIsAnonymous())
                .revealRequestedBy(match.getRevealRequestedBy())
                .revealRequestedAt(match.getRevealRequestedAt())
                .revealedAt(match.getRevealedAt())
                .lastMessage(match.getLastMessage())
                .lastMessageAt(match.getLastMessageAt())
                .unreadCount(unreadCount)
                .messageCount(match.getMessageCount())
                .matchedAt(match.getMatchedAt())
                .unmatchedAt(match.getUnmatchedAt())
                .unmatchReason(match.getUnmatchReason())
                .createdAt(match.getCreatedAt())
                .updatedAt(match.getUpdatedAt())
                .build();
    }

    /**
     * 사용자가 매칭의 참여자인지 확인합니다.
     *
     * @param match Match 엔티티
     * @param userId 사용자 ID
     * @return 참여자이면 true
     */
    private boolean isParticipant(Match match, String userId) {
        return (match.getUser1() != null && match.getUser1().getId().equals(userId)) ||
               (match.getUser2() != null && match.getUser2().getId().equals(userId));
    }
}
