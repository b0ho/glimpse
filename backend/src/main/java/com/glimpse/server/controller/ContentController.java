package com.glimpse.server.controller;

import com.glimpse.server.dto.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Content Controller
 *
 * <p>콘텐츠 피드 관련 REST API를 제공하는 컨트롤러입니다.</p>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-02
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/contents")
@RequiredArgsConstructor
@Tag(name = "Content", description = "콘텐츠 피드 API")
public class ContentController {

    /**
     * 콘텐츠 목록을 조회합니다.
     *
     * @param page 페이지 번호 (기본값: 1)
     * @param limit 페이지당 항목 수 (기본값: 10)
     * @return 콘텐츠 목록과 HTTP 200
     */
    @GetMapping
    @Operation(summary = "콘텐츠 목록 조회", description = "홈 피드의 콘텐츠 목록을 조회합니다")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getContents(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {
        log.info("GET /api/v1/contents - Getting contents (page: {}, limit: {})", page, limit);

        // 개발 환경용 샘플 데이터
        List<Map<String, Object>> contents = new ArrayList<>();
        
        for (int i = 0; i < limit; i++) {
            Map<String, Object> content = new HashMap<>();
            content.put("id", "content-" + ((page - 1) * limit + i + 1));
            content.put("type", i % 3 == 0 ? "POST" : i % 3 == 1 ? "STORY" : "MATCH");
            content.put("userId", "user" + (i % 5 + 1));
            content.put("nickname", "사용자" + (i % 5 + 1));
            content.put("content", "샘플 콘텐츠 " + ((page - 1) * limit + i + 1));
            content.put("imageUrl", "https://picsum.photos/400/600?random=" + i);
            content.put("likeCount", (int) (Math.random() * 100));
            content.put("commentCount", (int) (Math.random() * 50));
            content.put("timestamp", System.currentTimeMillis() - (i * 3600000));
            contents.add(content);
        }

        ApiResponse<List<Map<String, Object>>> response = ApiResponse.<List<Map<String, Object>>>builder()
                .success(true)
                .data(contents)
                .message("콘텐츠 목록을 성공적으로 조회했습니다")
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * 특정 콘텐츠를 조회합니다.
     *
     * @param id 콘텐츠 ID
     * @return 콘텐츠 상세 정보와 HTTP 200
     */
    @GetMapping("/{id}")
    @Operation(summary = "콘텐츠 상세 조회", description = "특정 콘텐츠의 상세 정보를 조회합니다")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getContentById(@PathVariable String id) {
        log.info("GET /api/v1/contents/{} - Getting content details", id);

        Map<String, Object> content = new HashMap<>();
        content.put("id", id);
        content.put("type", "POST");
        content.put("userId", "user1");
        content.put("nickname", "김철수");
        content.put("content", "샘플 콘텐츠 상세 내용입니다.");
        content.put("imageUrl", "https://picsum.photos/400/600");
        content.put("likeCount", 42);
        content.put("commentCount", 15);
        content.put("timestamp", System.currentTimeMillis() - 7200000);

        ApiResponse<Map<String, Object>> response = ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .data(content)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * 새로운 콘텐츠를 생성합니다.
     *
     * @param body 콘텐츠 데이터
     * @return 생성된 콘텐츠와 HTTP 201
     */
    @PostMapping
    @Operation(summary = "콘텐츠 생성", description = "새로운 콘텐츠를 생성합니다")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createContent(@RequestBody Map<String, Object> body) {
        log.info("POST /api/v1/contents - Creating new content");

        Map<String, Object> content = new HashMap<>();
        content.put("id", "content-" + System.currentTimeMillis());
        content.put("type", body.getOrDefault("type", "POST"));
        content.put("userId", body.get("userId"));
        content.put("content", body.get("content"));
        content.put("imageUrl", body.get("imageUrl"));
        content.put("likeCount", 0);
        content.put("commentCount", 0);
        content.put("timestamp", System.currentTimeMillis());

        ApiResponse<Map<String, Object>> response = ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .data(content)
                .message("콘텐츠가 성공적으로 생성되었습니다")
                .build();

        return ResponseEntity.status(201).body(response);
    }

    /**
     * 콘텐츠를 삭제합니다.
     *
     * @param id 콘텐츠 ID
     * @return HTTP 200
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "콘텐츠 삭제", description = "콘텐츠를 삭제합니다")
    public ResponseEntity<ApiResponse<Void>> deleteContent(@PathVariable String id) {
        log.info("DELETE /api/v1/contents/{} - Deleting content", id);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message("콘텐츠가 삭제되었습니다")
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * 콘텐츠에 좋아요를 추가합니다.
     *
     * @param id 콘텐츠 ID
     * @param body 사용자 ID
     * @return HTTP 200
     */
    @PostMapping("/{id}/like")
    @Operation(summary = "콘텐츠 좋아요", description = "콘텐츠에 좋아요를 추가합니다")
    public ResponseEntity<ApiResponse<Map<String, Object>>> likeContent(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        log.info("POST /api/v1/contents/{}/like - Liking content", id);

        Map<String, Object> result = new HashMap<>();
        result.put("contentId", id);
        result.put("userId", body.get("userId"));
        result.put("liked", true);
        result.put("likeCount", (int) (Math.random() * 100) + 1);

        ApiResponse<Map<String, Object>> response = ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .data(result)
                .message("좋아요를 추가했습니다")
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * 콘텐츠의 좋아요를 취소합니다.
     *
     * @param id 콘텐츠 ID
     * @param body 사용자 ID
     * @return HTTP 200
     */
    @PostMapping("/{id}/unlike")
    @Operation(summary = "콘텐츠 좋아요 취소", description = "콘텐츠의 좋아요를 취소합니다")
    public ResponseEntity<ApiResponse<Map<String, Object>>> unlikeContent(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        log.info("POST /api/v1/contents/{}/unlike - Unliking content", id);

        Map<String, Object> result = new HashMap<>();
        result.put("contentId", id);
        result.put("userId", body.get("userId"));
        result.put("liked", false);
        result.put("likeCount", (int) (Math.random() * 100));

        ApiResponse<Map<String, Object>> response = ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .data(result)
                .message("좋아요를 취소했습니다")
                .build();

        return ResponseEntity.ok(response);
    }
}

