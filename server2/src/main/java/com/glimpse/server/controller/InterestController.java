package com.glimpse.server.controller;

import com.glimpse.server.dto.common.ApiResponse;
import com.glimpse.server.dto.interest.InterestMatchDto;
import com.glimpse.server.dto.interest.InterestSearchDto;
import com.glimpse.server.dto.interest.MyInterestStatusDto;
import com.glimpse.server.service.InterestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Interest Controller
 *
 * <p>관심 표시 및 매칭 관련 REST API를 제공하는 컨트롤러입니다.</p>
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/interest")
@RequiredArgsConstructor
@Tag(name = "Interest", description = "관심 표시 및 매칭 API")
public class InterestController {

    private final InterestService interestService;

    @GetMapping("/searches")
    @Operation(summary = "활성화된 관심 검색 목록 조회", description = "현재 활성화된 관심 검색 목록을 조회합니다")
    public ResponseEntity<ApiResponse<List<InterestSearchDto>>> getActiveSearches(
            @RequestParam(name = "userId") String userId) {
        log.info("GET /api/v1/interest/searches - userId: {}", userId);

        try {
            List<InterestSearchDto> searches = interestService.getActiveSearches(userId);
            ApiResponse<List<InterestSearchDto>> response = ApiResponse.<List<InterestSearchDto>>builder()
                    .success(true)
                    .data(searches)
                    .build();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to get active searches: {}", e.getMessage());
            ApiResponse<List<InterestSearchDto>> response = ApiResponse.<List<InterestSearchDto>>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/matches")
    @Operation(summary = "매칭된 목록 조회", description = "사용자의 매칭된 목록을 조회합니다")
    public ResponseEntity<ApiResponse<List<InterestMatchDto>>> getMatches(
            @RequestParam(name = "userId") String userId) {
        log.info("GET /api/v1/interest/matches - userId: {}", userId);

        try {
            List<InterestMatchDto> matches = interestService.getMatches(userId);
            ApiResponse<List<InterestMatchDto>> response = ApiResponse.<List<InterestMatchDto>>builder()
                    .success(true)
                    .data(matches)
                    .build();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to get matches: {}", e.getMessage());
            ApiResponse<List<InterestMatchDto>> response = ApiResponse.<List<InterestMatchDto>>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/secure/my-status")
    @Operation(summary = "내 관심 상태 조회", description = "사용자의 관심 표시 상태를 조회합니다")
    public ResponseEntity<ApiResponse<MyInterestStatusDto>> getMyStatus(
            @RequestParam(name = "userId") String userId) {
        log.info("GET /api/v1/interest/secure/my-status - userId: {}", userId);

        try {
            MyInterestStatusDto status = interestService.getMyStatus(userId);
            ApiResponse<MyInterestStatusDto> response = ApiResponse.<MyInterestStatusDto>builder()
                    .success(true)
                    .data(status)
                    .build();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to get my status: {}", e.getMessage());
            ApiResponse<MyInterestStatusDto> response = ApiResponse.<MyInterestStatusDto>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
