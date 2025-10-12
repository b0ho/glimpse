package com.glimpse.server.controller;

import com.glimpse.server.dto.common.ApiResponse;
import com.glimpse.server.dto.match.MatchDto;
import com.glimpse.server.entity.Group;
import com.glimpse.server.entity.Match;
import com.glimpse.server.entity.User;
import com.glimpse.server.entity.enums.MatchStatus;
import com.glimpse.server.repository.GroupRepository;
import com.glimpse.server.repository.MatchRepository;
import com.glimpse.server.repository.UserRepository;
import com.glimpse.server.service.MatchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Match Controller
 *
 * <p>매칭 관련 REST API를 제공하는 컨트롤러입니다.</p>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/matches")
@RequiredArgsConstructor
@Tag(name = "Match", description = "매칭 관리 API")
public class MatchController {

    private final MatchService matchService;
    private final MatchRepository matchRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;

    @GetMapping("/{id}")
    @Operation(summary = "매칭 조회", description = "ID로 매칭을 조회합니다")
    public ResponseEntity<ApiResponse<MatchDto>> getMatchById(
            @PathVariable String id,
            @RequestParam String currentUserId) {
        log.info("GET /api/v1/matches/{} - Getting match for user: {}", id, currentUserId);
        return matchService.getMatchById(id, currentUserId)
                .map(match -> {
                    ApiResponse<MatchDto> response = ApiResponse.<MatchDto>builder()
                            .success(true)
                            .data(match)
                            .build();
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    ApiResponse<MatchDto> response = ApiResponse.<MatchDto>builder()
                            .success(false)
                            .message("매칭을 찾을 수 없습니다: " + id)
                            .build();
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
                });
    }

    @GetMapping
    @Operation(summary = "활성 매칭 목록 조회", description = "사용자의 모든 활성 매칭을 조회합니다")
    public ResponseEntity<ApiResponse<List<MatchDto>>> getActiveMatches(
            @RequestParam String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("GET /api/v1/matches - Getting active matches for user: {} (page: {}, size: {})",
                userId, page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<MatchDto> matchPage = matchService.getActiveMatchesByUserId(userId, pageable);
        ApiResponse<List<MatchDto>> response = ApiResponse.<List<MatchDto>>builder()
                .success(true)
                .data(matchPage.getContent())
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "상태별 매칭 조회", description = "특정 상태의 매칭을 조회합니다")
    public ResponseEntity<ApiResponse<List<MatchDto>>> getMatchesByStatus(
            @PathVariable MatchStatus status,
            @RequestParam String userId) {
        log.info("GET /api/v1/matches/status/{} - Getting matches for user: {}", status, userId);
        List<MatchDto> matches = matchService.getMatchesByUserIdAndStatus(userId, status);
        ApiResponse<List<MatchDto>> response = ApiResponse.<List<MatchDto>>builder()
                .success(true)
                .data(matches)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/with/{otherUserId}")
    @Operation(summary = "두 사용자 간 매칭 조회", description = "현재 사용자와 다른 사용자 간의 매칭을 조회합니다")
    public ResponseEntity<ApiResponse<MatchDto>> getMatchBetweenUsers(
            @PathVariable String otherUserId,
            @RequestParam String currentUserId) {
        log.info("GET /api/v1/matches/with/{} - Getting match for user: {}", otherUserId, currentUserId);
        return matchService.getMatchBetweenUsers(currentUserId, otherUserId)
                .map(match -> {
                    ApiResponse<MatchDto> response = ApiResponse.<MatchDto>builder()
                            .success(true)
                            .data(match)
                            .build();
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    ApiResponse<MatchDto> response = ApiResponse.<MatchDto>builder()
                            .success(false)
                            .message("매칭을 찾을 수 없습니다")
                            .build();
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
                });
    }

    @GetMapping("/count")
    @Operation(summary = "활성 매칭 수 조회", description = "사용자의 활성 매칭 수를 조회합니다")
    public ResponseEntity<ApiResponse<Map<String, Long>>> countActiveMatches(
            @RequestParam String userId) {
        log.info("GET /api/v1/matches/count - Counting active matches for user: {}", userId);
        long count = matchService.countActiveMatches(userId);
        Map<String, Long> result = Map.of("count", count);
        ApiResponse<Map<String, Long>> response = ApiResponse.<Map<String, Long>>builder()
                .success(true)
                .data(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/group/{groupId}")
    @Operation(summary = "그룹별 매칭 조회", description = "특정 그룹의 매칭을 조회합니다")
    public ResponseEntity<ApiResponse<List<MatchDto>>> getMatchesByGroup(@PathVariable String groupId) {
        log.info("GET /api/v1/matches/group/{} - Getting matches for group", groupId);
        List<MatchDto> matches = matchService.getMatchesByGroupId(groupId);
        ApiResponse<List<MatchDto>> response = ApiResponse.<List<MatchDto>>builder()
                .success(true)
                .data(matches)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/unread")
    @Operation(summary = "읽지 않은 메시지가 있는 매칭 조회", description = "읽지 않은 메시지가 있는 매칭을 조회합니다")
    public ResponseEntity<ApiResponse<List<MatchDto>>> getMatchesWithUnreadMessages(
            @RequestParam String userId) {
        log.info("GET /api/v1/matches/unread - Getting matches with unread messages for user: {}", userId);
        List<MatchDto> matches = matchService.getMatchesWithUnreadMessages(userId);
        ApiResponse<List<MatchDto>> response = ApiResponse.<List<MatchDto>>builder()
                .success(true)
                .data(matches)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/reveal")
    @Operation(summary = "신원 공개 요청", description = "매칭 상대방에게 신원 공개를 요청합니다")
    public ResponseEntity<ApiResponse<MatchDto>> requestReveal(
            @PathVariable String id,
            @RequestParam String userId) {
        log.info("POST /api/v1/matches/{}/reveal - User {} requesting reveal", id, userId);
        try {
            MatchDto match = matchService.requestReveal(id, userId);
            ApiResponse<MatchDto> response = ApiResponse.<MatchDto>builder()
                    .success(true)
                    .data(match)
                    .message("신원 공개를 요청했습니다")
                    .build();
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Failed to request reveal: {}", e.getMessage());
            ApiResponse<MatchDto> response = ApiResponse.<MatchDto>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/{id}/reveal/accept")
    @Operation(summary = "신원 공개 승인", description = "상대방의 신원 공개 요청을 승인합니다")
    public ResponseEntity<ApiResponse<MatchDto>> acceptReveal(
            @PathVariable String id,
            @RequestParam String userId) {
        log.info("POST /api/v1/matches/{}/reveal/accept - User {} accepting reveal", id, userId);
        try {
            MatchDto match = matchService.acceptReveal(id, userId);
            ApiResponse<MatchDto> response = ApiResponse.<MatchDto>builder()
                    .success(true)
                    .data(match)
                    .message("신원이 공개되었습니다")
                    .build();
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Failed to accept reveal: {}", e.getMessage());
            ApiResponse<MatchDto> response = ApiResponse.<MatchDto>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/{id}/unmatch")
    @Operation(summary = "매칭 해제", description = "매칭을 해제합니다")
    public ResponseEntity<ApiResponse<MatchDto>> unmatch(
            @PathVariable String id,
            @RequestParam String userId,
            @RequestParam(required = false) String reason) {
        log.info("POST /api/v1/matches/{}/unmatch - User {} unmatching", id, userId);
        try {
            MatchDto match = matchService.unmatch(id, userId, reason);
            ApiResponse<MatchDto> response = ApiResponse.<MatchDto>builder()
                    .success(true)
                    .data(match)
                    .message("매칭이 해제되었습니다")
                    .build();
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Failed to unmatch: {}", e.getMessage());
            ApiResponse<MatchDto> response = ApiResponse.<MatchDto>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/{id}/read")
    @Operation(summary = "메시지 읽음 처리", description = "매칭의 메시지를 읽음으로 표시합니다")
    public ResponseEntity<ApiResponse<Void>> markMessagesAsRead(
            @PathVariable String id,
            @RequestParam String userId) {
        log.info("POST /api/v1/matches/{}/read - User {} marking messages as read", id, userId);
        try {
            matchService.markMessagesAsRead(id, userId);
            ApiResponse<Void> response = ApiResponse.<Void>builder()
                    .success(true)
                    .message("메시지를 읽음으로 표시했습니다")
                    .build();
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Failed to mark messages as read: {}", e.getMessage());
            ApiResponse<Void> response = ApiResponse.<Void>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/test/create")
    @Operation(summary = "[테스트용] 매칭 생성", description = "테스트를 위해 매칭을 직접 생성합니다")
    public ResponseEntity<ApiResponse<MatchDto>> createMatch(
            @RequestParam String user1Id,
            @RequestParam String user2Id,
            @RequestParam String groupId) {
        log.info("POST /api/v1/matches/test/create - Creating match between {} and {}", user1Id, user2Id);
        try {
            User user1 = userRepository.findById(user1Id)
                    .orElseThrow(() -> new IllegalArgumentException("사용자1을 찾을 수 없습니다: " + user1Id));
            User user2 = userRepository.findById(user2Id)
                    .orElseThrow(() -> new IllegalArgumentException("사용자2를 찾을 수 없습니다: " + user2Id));
            Group group = groupRepository.findById(groupId)
                    .orElseThrow(() -> new IllegalArgumentException("그룹을 찾을 수 없습니다: " + groupId));

            Match match = Match.builder()
                    .user1(user1)
                    .user2(user2)
                    .group(group)
                    .status(MatchStatus.MATCHED)
                    .isAnonymous(true)
                    .messageCount(0)
                    .unreadCount1(0)
                    .unreadCount2(0)
                    .matchedAt(LocalDateTime.now())
                    .build();

            Match savedMatch = matchRepository.save(match);
            MatchDto matchDto = matchService.getMatchById(savedMatch.getId(), user1Id)
                    .orElseThrow(() -> new IllegalStateException("생성된 매칭을 찾을 수 없습니다"));

            ApiResponse<MatchDto> response = ApiResponse.<MatchDto>builder()
                    .success(true)
                    .data(matchDto)
                    .message("테스트 매칭이 생성되었습니다")
                    .build();
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            log.error("Failed to create match: {}", e.getMessage());
            ApiResponse<MatchDto> response = ApiResponse.<MatchDto>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.badRequest().body(response);
        }
    }
}
