package com.glimpse.server.controller;

import com.glimpse.server.dto.common.ApiResponse;
import com.glimpse.server.dto.group.CreateGroupDto;
import com.glimpse.server.dto.group.GroupDto;
import com.glimpse.server.dto.group.UpdateGroupDto;
import com.glimpse.server.entity.enums.GroupCategory;
import com.glimpse.server.entity.enums.GroupType;
import com.glimpse.server.service.GroupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Group Controller
 *
 * <p>그룹 관련 REST API를 제공하는 컨트롤러입니다.</p>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/groups")
@RequiredArgsConstructor
@Tag(name = "Group", description = "그룹 관리 API")
public class GroupController {

    private final GroupService groupService;

    @PostMapping
    @Operation(summary = "그룹 생성", description = "새로운 그룹을 생성합니다")
    public ResponseEntity<ApiResponse<GroupDto>> createGroup(
            @Valid @RequestBody CreateGroupDto createGroupDto,
            @RequestParam String creatorId) {
        log.info("POST /api/v1/groups - Creating group: {} by user: {}", createGroupDto.getName(), creatorId);
        try {
            GroupDto groupDto = groupService.createGroup(createGroupDto, creatorId);
            ApiResponse<GroupDto> response = ApiResponse.<GroupDto>builder()
                    .success(true)
                    .data(groupDto)
                    .message("그룹이 성공적으로 생성되었습니다")
                    .build();
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            log.error("Failed to create group: {}", e.getMessage());
            ApiResponse<GroupDto> response = ApiResponse.<GroupDto>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "그룹 조회", description = "ID로 그룹을 조회합니다")
    public ResponseEntity<ApiResponse<GroupDto>> getGroupById(@PathVariable String id) {
        log.info("GET /api/v1/groups/{} - Getting group", id);
        return groupService.getGroupById(id)
                .map(group -> {
                    ApiResponse<GroupDto> response = ApiResponse.<GroupDto>builder()
                            .success(true)
                            .data(group)
                            .build();
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    ApiResponse<GroupDto> response = ApiResponse.<GroupDto>builder()
                            .success(false)
                            .message("그룹을 찾을 수 없습니다: " + id)
                            .build();
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
                });
    }

    @PatchMapping("/{id}")
    @Operation(summary = "그룹 업데이트", description = "그룹 정보를 업데이트합니다")
    public ResponseEntity<ApiResponse<GroupDto>> updateGroup(
            @PathVariable String id,
            @Valid @RequestBody UpdateGroupDto updateGroupDto) {
        log.info("PATCH /api/v1/groups/{} - Updating group", id);
        try {
            GroupDto groupDto = groupService.updateGroup(id, updateGroupDto);
            ApiResponse<GroupDto> response = ApiResponse.<GroupDto>builder()
                    .success(true)
                    .data(groupDto)
                    .message("그룹 정보가 업데이트되었습니다")
                    .build();
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Failed to update group: {}", e.getMessage());
            ApiResponse<GroupDto> response = ApiResponse.<GroupDto>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "그룹 삭제", description = "그룹을 삭제합니다")
    public ResponseEntity<ApiResponse<Void>> deleteGroup(@PathVariable String id) {
        log.info("DELETE /api/v1/groups/{} - Deleting group", id);
        try {
            groupService.deleteGroup(id);
            ApiResponse<Void> response = ApiResponse.<Void>builder()
                    .success(true)
                    .message("그룹이 삭제되었습니다")
                    .build();
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Failed to delete group: {}", e.getMessage());
            ApiResponse<Void> response = ApiResponse.<Void>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping
    @Operation(summary = "공개 그룹 목록 조회", description = "모든 공개 활성 그룹을 조회합니다")
    public ResponseEntity<ApiResponse<List<GroupDto>>> getPublicGroups(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("GET /api/v1/groups - Getting public groups (page: {}, size: {})", page, size);
        
        if (page == 0 && size == 20) {
            // 페이징 없이 전체 조회
            List<GroupDto> groups = groupService.getPublicGroups();
            ApiResponse<List<GroupDto>> response = ApiResponse.<List<GroupDto>>builder()
                    .success(true)
                    .data(groups)
                    .build();
            return ResponseEntity.ok(response);
        } else {
            // 페이징 처리
            Pageable pageable = PageRequest.of(page, size);
            Page<GroupDto> groupPage = groupService.getPublicGroupsPage(pageable);
            ApiResponse<List<GroupDto>> response = ApiResponse.<List<GroupDto>>builder()
                    .success(true)
                    .data(groupPage.getContent())
                    .build();
            return ResponseEntity.ok(response);
        }
    }

    @GetMapping("/official")
    @Operation(summary = "공식 그룹 목록 조회", description = "모든 공식 그룹을 조회합니다")
    public ResponseEntity<ApiResponse<List<GroupDto>>> getOfficialGroups() {
        log.info("GET /api/v1/groups/official - Getting official groups");
        List<GroupDto> groups = groupService.getOfficialGroups();
        ApiResponse<List<GroupDto>> response = ApiResponse.<List<GroupDto>>builder()
                .success(true)
                .data(groups)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/type/{type}")
    @Operation(summary = "타입별 그룹 조회", description = "특정 타입의 그룹을 조회합니다")
    public ResponseEntity<ApiResponse<List<GroupDto>>> getGroupsByType(@PathVariable GroupType type) {
        log.info("GET /api/v1/groups/type/{} - Getting groups by type", type);
        List<GroupDto> groups = groupService.getGroupsByType(type);
        ApiResponse<List<GroupDto>> response = ApiResponse.<List<GroupDto>>builder()
                .success(true)
                .data(groups)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "카테고리별 그룹 조회", description = "특정 카테고리의 그룹을 조회합니다")
    public ResponseEntity<ApiResponse<List<GroupDto>>> getGroupsByCategory(@PathVariable GroupCategory category) {
        log.info("GET /api/v1/groups/category/{} - Getting groups by category", category);
        List<GroupDto> groups = groupService.getGroupsByCategory(category);
        ApiResponse<List<GroupDto>> response = ApiResponse.<List<GroupDto>>builder()
                .success(true)
                .data(groups)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/creator/{userId}")
    @Operation(summary = "사용자가 생성한 그룹 조회", description = "특정 사용자가 생성한 그룹을 조회합니다")
    public ResponseEntity<ApiResponse<List<GroupDto>>> getGroupsByCreator(@PathVariable String userId) {
        log.info("GET /api/v1/groups/creator/{} - Getting groups by creator", userId);
        List<GroupDto> groups = groupService.getGroupsByCreator(userId);
        ApiResponse<List<GroupDto>> response = ApiResponse.<List<GroupDto>>builder()
                .success(true)
                .data(groups)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "사용자가 가입한 그룹 조회", description = "특정 사용자가 가입한 그룹을 조회합니다")
    public ResponseEntity<ApiResponse<List<GroupDto>>> getGroupsByUserId(@PathVariable String userId) {
        log.info("GET /api/v1/groups/user/{} - Getting groups by user", userId);
        List<GroupDto> groups = groupService.getGroupsByUserId(userId);
        ApiResponse<List<GroupDto>> response = ApiResponse.<List<GroupDto>>builder()
                .success(true)
                .data(groups)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    @Operation(summary = "그룹 검색", description = "키워드로 그룹을 검색합니다")
    public ResponseEntity<ApiResponse<List<GroupDto>>> searchGroups(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("GET /api/v1/groups/search?keyword={} - Searching groups", keyword);
        Pageable pageable = PageRequest.of(page, size);
        Page<GroupDto> groupPage = groupService.searchGroups(keyword, pageable);
        ApiResponse<List<GroupDto>> response = ApiResponse.<List<GroupDto>>builder()
                .success(true)
                .data(groupPage.getContent())
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/nearby")
    @Operation(summary = "주변 그룹 조회", description = "위치 기반으로 주변 그룹을 조회합니다")
    public ResponseEntity<ApiResponse<List<GroupDto>>> getNearbyGroups(
            @RequestParam double latitude,
            @RequestParam double longitude,
            @RequestParam(defaultValue = "10.0") double radiusKm) {
        log.info("GET /api/v1/groups/nearby?lat={}&lng={}&radius={}", latitude, longitude, radiusKm);
        List<GroupDto> groups = groupService.getNearbyGroups(latitude, longitude, radiusKm);
        ApiResponse<List<GroupDto>> response = ApiResponse.<List<GroupDto>>builder()
                .success(true)
                .data(groups)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/invite/{inviteCode}")
    @Operation(summary = "초대 코드로 그룹 조회", description = "초대 코드로 그룹을 조회합니다")
    public ResponseEntity<ApiResponse<GroupDto>> getGroupByInviteCode(@PathVariable String inviteCode) {
        log.info("GET /api/v1/groups/invite/{} - Getting group by invite code", inviteCode);
        return groupService.getGroupByInviteCode(inviteCode)
                .map(group -> {
                    ApiResponse<GroupDto> response = ApiResponse.<GroupDto>builder()
                            .success(true)
                            .data(group)
                            .build();
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    ApiResponse<GroupDto> response = ApiResponse.<GroupDto>builder()
                            .success(false)
                            .message("유효하지 않은 초대 코드입니다")
                            .build();
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
                });
    }

    @GetMapping("/{id}/members/count")
    @Operation(summary = "그룹 멤버 수 조회", description = "그룹의 활성 멤버 수를 조회합니다")
    public ResponseEntity<ApiResponse<Map<String, Long>>> countActiveMembers(@PathVariable String id) {
        log.info("GET /api/v1/groups/{}/members/count - Counting active members", id);
        long count = groupService.countActiveMembers(id);
        Map<String, Long> result = Map.of("count", count);
        ApiResponse<Map<String, Long>> response = ApiResponse.<Map<String, Long>>builder()
                .success(true)
                .data(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/check/name/{name}")
    @Operation(summary = "그룹 이름 중복 확인", description = "그룹 이름 중복 여부를 확인합니다")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkGroupName(@PathVariable String name) {
        log.info("GET /api/v1/groups/check/name/{} - Checking group name", name);
        boolean exists = groupService.existsByName(name);
        Map<String, Boolean> result = Map.of("exists", exists);
        ApiResponse<Map<String, Boolean>> response = ApiResponse.<Map<String, Boolean>>builder()
                .success(true)
                .data(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
