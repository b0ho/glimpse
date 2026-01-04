package com.glimpse.server.controller;

import com.glimpse.server.dto.common.ApiResponse;
import com.glimpse.server.dto.group.GroupMemberDto;
import com.glimpse.server.entity.enums.GroupMemberRole;
import com.glimpse.server.service.GroupMemberService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Group Member Controller
 *
 * <p>그룹 멤버 관리 REST API를 제공하는 컨트롤러입니다.</p>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-02
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/groups")
@RequiredArgsConstructor
@Tag(name = "Group Member", description = "그룹 멤버 관리 API")
public class GroupMemberController {

    private final GroupMemberService groupMemberService;

    /**
     * 그룹 가입
     */
    @PostMapping("/{groupId}/members")
    @Operation(summary = "그룹 가입", description = "사용자가 그룹에 가입합니다")
    public ResponseEntity<ApiResponse<GroupMemberDto>> joinGroup(
            @PathVariable String groupId,
            @RequestBody Map<String, String> body) {
        String userId = body.get("userId");
        log.info("POST /api/v1/groups/{}/members - User {} joining group", groupId, userId);
        
        try {
            GroupMemberDto memberDto = groupMemberService.joinGroup(groupId, userId);
            ApiResponse<GroupMemberDto> response = ApiResponse.<GroupMemberDto>builder()
                    .success(true)
                    .data(memberDto)
                    .message("그룹에 성공적으로 가입했습니다")
                    .build();
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            log.error("Failed to join group: {}", e.getMessage());
            ApiResponse<GroupMemberDto> response = ApiResponse.<GroupMemberDto>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 그룹 탈퇴
     */
    @DeleteMapping("/{groupId}/members/{userId}")
    @Operation(summary = "그룹 탈퇴", description = "사용자가 그룹에서 탈퇴합니다")
    public ResponseEntity<ApiResponse<Void>> leaveGroup(
            @PathVariable String groupId,
            @PathVariable String userId) {
        log.info("DELETE /api/v1/groups/{}/members/{} - User leaving group", groupId, userId);
        
        try {
            groupMemberService.leaveGroup(groupId, userId);
            ApiResponse<Void> response = ApiResponse.<Void>builder()
                    .success(true)
                    .message("그룹에서 탈퇴했습니다")
                    .build();
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Failed to leave group: {}", e.getMessage());
            ApiResponse<Void> response = ApiResponse.<Void>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 그룹 멤버 목록 조회
     */
    @GetMapping("/{groupId}/members")
    @Operation(summary = "그룹 멤버 목록 조회", description = "그룹의 모든 활성 멤버를 조회합니다")
    public ResponseEntity<ApiResponse<List<GroupMemberDto>>> getGroupMembers(
            @PathVariable String groupId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        log.info("GET /api/v1/groups/{}/members - Getting members", groupId);
        
        List<GroupMemberDto> members = groupMemberService.getGroupMembers(groupId);
        ApiResponse<List<GroupMemberDto>> response = ApiResponse.<List<GroupMemberDto>>builder()
                .success(true)
                .data(members)
                .build();
        return ResponseEntity.ok(response);
    }

    /**
     * 멤버 역할 변경
     */
    @PatchMapping("/{groupId}/members/{userId}/role")
    @Operation(summary = "멤버 역할 변경", description = "그룹 멤버의 역할을 변경합니다 (관리자 전용)")
    public ResponseEntity<ApiResponse<GroupMemberDto>> changeMemberRole(
            @PathVariable String groupId,
            @PathVariable String userId,
            @RequestBody Map<String, String> body) {
        String roleStr = body.get("role");
        log.info("PATCH /api/v1/groups/{}/members/{}/role - Changing role to {}", groupId, userId, roleStr);
        
        try {
            GroupMemberRole role = GroupMemberRole.valueOf(roleStr);
            GroupMemberDto memberDto = groupMemberService.changeMemberRole(groupId, userId, role);
            ApiResponse<GroupMemberDto> response = ApiResponse.<GroupMemberDto>builder()
                    .success(true)
                    .data(memberDto)
                    .message("멤버 역할이 변경되었습니다")
                    .build();
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Failed to change member role: {}", e.getMessage());
            ApiResponse<GroupMemberDto> response = ApiResponse.<GroupMemberDto>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 멤버 강제 퇴출
     */
    @DeleteMapping("/{groupId}/members/{userId}/kick")
    @Operation(summary = "멤버 강제 퇴출", description = "그룹 멤버를 강제로 퇴출합니다 (관리자 전용)")
    public ResponseEntity<ApiResponse<Void>> kickMember(
            @PathVariable String groupId,
            @PathVariable String userId,
            @RequestBody Map<String, String> body) {
        String reason = body.getOrDefault("reason", "관리자에 의해 퇴출됨");
        log.info("DELETE /api/v1/groups/{}/members/{}/kick - Kicking member", groupId, userId);
        
        try {
            groupMemberService.kickMember(groupId, userId, reason);
            ApiResponse<Void> response = ApiResponse.<Void>builder()
                    .success(true)
                    .message("멤버가 퇴출되었습니다")
                    .build();
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Failed to kick member: {}", e.getMessage());
            ApiResponse<Void> response = ApiResponse.<Void>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 사용자의 그룹 멤버십 확인
     */
    @GetMapping("/{groupId}/members/{userId}/status")
    @Operation(summary = "멤버십 상태 확인", description = "사용자의 그룹 멤버십 상태를 확인합니다")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkMembership(
            @PathVariable String groupId,
            @PathVariable String userId) {
        log.info("GET /api/v1/groups/{}/members/{}/status - Checking membership", groupId, userId);
        
        boolean isMember = groupMemberService.isMember(groupId, userId);
        GroupMemberRole role = isMember ? groupMemberService.getMemberRole(groupId, userId) : null;
        
        Map<String, Object> status = Map.of(
                "isMember", isMember,
                "role", role != null ? role.toString() : "NONE"
        );
        
        ApiResponse<Map<String, Object>> response = ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .data(status)
                .build();
        return ResponseEntity.ok(response);
    }

    /**
     * 그룹 관리자 목록 조회
     */
    @GetMapping("/{groupId}/admins")
    @Operation(summary = "관리자 목록 조회", description = "그룹의 관리자 목록을 조회합니다")
    public ResponseEntity<ApiResponse<List<GroupMemberDto>>> getGroupAdmins(
            @PathVariable String groupId) {
        log.info("GET /api/v1/groups/{}/admins - Getting admins", groupId);
        
        List<GroupMemberDto> admins = groupMemberService.getGroupAdmins(groupId);
        ApiResponse<List<GroupMemberDto>> response = ApiResponse.<List<GroupMemberDto>>builder()
                .success(true)
                .data(admins)
                .build();
        return ResponseEntity.ok(response);
    }
}


