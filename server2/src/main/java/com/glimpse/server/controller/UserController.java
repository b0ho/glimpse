package com.glimpse.server.controller;

import com.glimpse.server.dto.common.ApiResponse;
import com.glimpse.server.dto.user.CreateUserDto;
import com.glimpse.server.dto.user.UpdateUserDto;
import com.glimpse.server.dto.user.UserDto;
import com.glimpse.server.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * User Controller
 *
 * <p>사용자 관련 REST API를 제공하는 컨트롤러입니다.</p>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User", description = "사용자 관리 API")
public class UserController {

    private final UserService userService;

    /**
     * 새로운 사용자를 생성합니다.
     *
     * @param createUserDto 사용자 생성 정보
     * @return 생성된 사용자 DTO와 HTTP 201
     */
    @PostMapping
    @Operation(summary = "사용자 생성", description = "새로운 사용자를 생성합니다")
    public ResponseEntity<ApiResponse<UserDto>> createUser(@Valid @RequestBody CreateUserDto createUserDto) {
        log.info("POST /api/v1/users - Creating user with phone: {}", createUserDto.getPhoneNumber());
        try {
            UserDto userDto = userService.createUser(createUserDto);
            ApiResponse<UserDto> response = ApiResponse.<UserDto>builder()
                    .success(true)
                    .data(userDto)
                    .message("사용자가 성공적으로 생성되었습니다")
                    .build();
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            log.error("Failed to create user: {}", e.getMessage());
            ApiResponse<UserDto> response = ApiResponse.<UserDto>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * ID로 사용자를 조회합니다.
     *
     * @param id 사용자 ID
     * @return 사용자 DTO와 HTTP 200
     */
    @GetMapping("/{id}")
    @Operation(summary = "사용자 조회", description = "ID로 사용자를 조회합니다")
    public ResponseEntity<ApiResponse<UserDto>> getUserById(@PathVariable String id) {
        log.info("GET /api/v1/users/{} - Getting user", id);
        return userService.getUserById(id)
                .map(user -> {
                    ApiResponse<UserDto> response = ApiResponse.<UserDto>builder()
                            .success(true)
                            .data(user)
                            .build();
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    ApiResponse<UserDto> response = ApiResponse.<UserDto>builder()
                            .success(false)
                            .message("사용자를 찾을 수 없습니다: " + id)
                            .build();
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
                });
    }

    /**
     * 전화번호로 사용자를 조회합니다.
     *
     * @param phoneNumber 전화번호
     * @return 사용자 DTO와 HTTP 200
     */
    @GetMapping("/phone/{phoneNumber}")
    @Operation(summary = "전화번호로 사용자 조회", description = "전화번호로 사용자를 조회합니다")
    public ResponseEntity<ApiResponse<UserDto>> getUserByPhoneNumber(@PathVariable String phoneNumber) {
        log.info("GET /api/v1/users/phone/{} - Getting user by phone", phoneNumber);
        return userService.getUserByPhoneNumber(phoneNumber)
                .map(user -> {
                    ApiResponse<UserDto> response = ApiResponse.<UserDto>builder()
                            .success(true)
                            .data(user)
                            .build();
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    ApiResponse<UserDto> response = ApiResponse.<UserDto>builder()
                            .success(false)
                            .message("사용자를 찾을 수 없습니다")
                            .build();
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
                });
    }

    /**
     * 사용자 정보를 업데이트합니다.
     *
     * @param id 사용자 ID
     * @param updateUserDto 업데이트할 사용자 정보
     * @return 업데이트된 사용자 DTO와 HTTP 200
     */
    @PatchMapping("/{id}")
    @Operation(summary = "사용자 업데이트", description = "사용자 정보를 업데이트합니다")
    public ResponseEntity<ApiResponse<UserDto>> updateUser(
            @PathVariable String id,
            @Valid @RequestBody UpdateUserDto updateUserDto) {
        log.info("PATCH /api/v1/users/{} - Updating user", id);
        try {
            UserDto userDto = userService.updateUser(id, updateUserDto);
            ApiResponse<UserDto> response = ApiResponse.<UserDto>builder()
                    .success(true)
                    .data(userDto)
                    .message("사용자 정보가 업데이트되었습니다")
                    .build();
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Failed to update user: {}", e.getMessage());
            ApiResponse<UserDto> response = ApiResponse.<UserDto>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 사용자를 삭제합니다 (Soft Delete).
     *
     * @param id 사용자 ID
     * @param body 삭제 사유
     * @return HTTP 204
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "사용자 삭제", description = "사용자를 삭제합니다 (Soft Delete)")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body) {
        log.info("DELETE /api/v1/users/{} - Deleting user", id);
        try {
            String reason = body != null ? body.get("reason") : "사용자 요청";
            userService.deleteUser(id, reason);
            ApiResponse<Void> response = ApiResponse.<Void>builder()
                    .success(true)
                    .message("사용자가 삭제되었습니다")
                    .build();
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Failed to delete user: {}", e.getMessage());
            ApiResponse<Void> response = ApiResponse.<Void>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 모든 활성 사용자를 조회합니다.
     *
     * @return 활성 사용자 목록과 HTTP 200
     */
    @GetMapping
    @Operation(summary = "활성 사용자 목록 조회", description = "모든 활성 사용자를 조회합니다")
    public ResponseEntity<ApiResponse<List<UserDto>>> getActiveUsers() {
        log.info("GET /api/v1/users - Getting active users");
        List<UserDto> users = userService.getActiveUsers();
        ApiResponse<List<UserDto>> response = ApiResponse.<List<UserDto>>builder()
                .success(true)
                .data(users)
                .build();
        return ResponseEntity.ok(response);
    }

    /**
     * 프리미엄 사용자 목록을 조회합니다.
     *
     * @return 프리미엄 사용자 목록과 HTTP 200
     */
    @GetMapping("/premium")
    @Operation(summary = "프리미엄 사용자 목록 조회", description = "모든 프리미엄 사용자를 조회합니다")
    public ResponseEntity<ApiResponse<List<UserDto>>> getPremiumUsers() {
        log.info("GET /api/v1/users/premium - Getting premium users");
        List<UserDto> users = userService.getPremiumUsers();
        ApiResponse<List<UserDto>> response = ApiResponse.<List<UserDto>>builder()
                .success(true)
                .data(users)
                .build();
        return ResponseEntity.ok(response);
    }

    /**
     * 사용자의 크레딧을 추가합니다.
     *
     * @param id 사용자 ID
     * @param body 추가할 크레딧 양
     * @return 업데이트된 사용자 DTO와 HTTP 200
     */
    @PostMapping("/{id}/credits/add")
    @Operation(summary = "크레딧 추가", description = "사용자의 크레딧을 추가합니다")
    public ResponseEntity<ApiResponse<UserDto>> addCredits(
            @PathVariable String id,
            @RequestBody Map<String, Integer> body) {
        log.info("POST /api/v1/users/{}/credits/add - Adding credits", id);
        try {
            int amount = body.getOrDefault("amount", 0);
            UserDto userDto = userService.addCredits(id, amount);
            ApiResponse<UserDto> response = ApiResponse.<UserDto>builder()
                    .success(true)
                    .data(userDto)
                    .message("크레딧이 추가되었습니다")
                    .build();
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Failed to add credits: {}", e.getMessage());
            ApiResponse<UserDto> response = ApiResponse.<UserDto>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 사용자의 크레딧을 차감합니다.
     *
     * @param id 사용자 ID
     * @param body 차감할 크레딧 양
     * @return 업데이트된 사용자 DTO와 HTTP 200
     */
    @PostMapping("/{id}/credits/deduct")
    @Operation(summary = "크레딧 차감", description = "사용자의 크레딧을 차감합니다")
    public ResponseEntity<ApiResponse<UserDto>> deductCredits(
            @PathVariable String id,
            @RequestBody Map<String, Integer> body) {
        log.info("POST /api/v1/users/{}/credits/deduct - Deducting credits", id);
        try {
            int amount = body.getOrDefault("amount", 0);
            UserDto userDto = userService.deductCredits(id, amount);
            ApiResponse<UserDto> response = ApiResponse.<UserDto>builder()
                    .success(true)
                    .data(userDto)
                    .message("크레딧이 차감되었습니다")
                    .build();
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Failed to deduct credits: {}", e.getMessage());
            ApiResponse<UserDto> response = ApiResponse.<UserDto>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 프리미엄 구독을 활성화합니다.
     *
     * @param id 사용자 ID
     * @param body 프리미엄 만료 시각
     * @return 업데이트된 사용자 DTO와 HTTP 200
     */
    @PostMapping("/{id}/premium/activate")
    @Operation(summary = "프리미엄 활성화", description = "사용자의 프리미엄 구독을 활성화합니다")
    public ResponseEntity<ApiResponse<UserDto>> activatePremium(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        log.info("POST /api/v1/users/{}/premium/activate - Activating premium", id);
        try {
            LocalDateTime until = LocalDateTime.parse(body.get("until"));
            UserDto userDto = userService.activatePremium(id, until);
            ApiResponse<UserDto> response = ApiResponse.<UserDto>builder()
                    .success(true)
                    .data(userDto)
                    .message("프리미엄이 활성화되었습니다")
                    .build();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to activate premium: {}", e.getMessage());
            ApiResponse<UserDto> response = ApiResponse.<UserDto>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 프리미엄 구독을 취소합니다.
     *
     * @param id 사용자 ID
     * @return 업데이트된 사용자 DTO와 HTTP 200
     */
    @PostMapping("/{id}/premium/deactivate")
    @Operation(summary = "프리미엄 취소", description = "사용자의 프리미엄 구독을 취소합니다")
    public ResponseEntity<ApiResponse<UserDto>> deactivatePremium(@PathVariable String id) {
        log.info("POST /api/v1/users/{}/premium/deactivate - Deactivating premium", id);
        try {
            UserDto userDto = userService.deactivatePremium(id);
            ApiResponse<UserDto> response = ApiResponse.<UserDto>builder()
                    .success(true)
                    .data(userDto)
                    .message("프리미엄이 취소되었습니다")
                    .build();
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Failed to deactivate premium: {}", e.getMessage());
            ApiResponse<UserDto> response = ApiResponse.<UserDto>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 사용자 통계를 조회합니다.
     *
     * @return 사용자 통계와 HTTP 200
     */
    @GetMapping("/stats")
    @Operation(summary = "사용자 통계 조회", description = "활성 사용자 및 프리미엄 사용자 수를 조회합니다")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUserStats() {
        log.info("GET /api/v1/users/stats - Getting user statistics");
        long activeUsers = userService.countActiveUsers();
        long premiumUsers = userService.countPremiumUsers();

        Map<String, Long> stats = Map.of(
                "activeUsers", activeUsers,
                "premiumUsers", premiumUsers
        );

        ApiResponse<Map<String, Long>> response = ApiResponse.<Map<String, Long>>builder()
                .success(true)
                .data(stats)
                .build();
        return ResponseEntity.ok(response);
    }

    /**
     * 전화번호 중복 여부를 확인합니다.
     *
     * @param phoneNumber 전화번호
     * @return 중복 여부와 HTTP 200
     */
    @GetMapping("/check/phone/{phoneNumber}")
    @Operation(summary = "전화번호 중복 확인", description = "전화번호 중복 여부를 확인합니다")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkPhoneNumber(@PathVariable String phoneNumber) {
        log.info("GET /api/v1/users/check/phone/{} - Checking phone number", phoneNumber);
        boolean exists = userService.existsByPhoneNumber(phoneNumber);
        Map<String, Boolean> result = Map.of("exists", exists);

        ApiResponse<Map<String, Boolean>> response = ApiResponse.<Map<String, Boolean>>builder()
                .success(true)
                .data(result)
                .build();
        return ResponseEntity.ok(response);
    }

    /**
     * 닉네임 중복 여부를 확인합니다.
     *
     * @param nickname 닉네임
     * @return 중복 여부와 HTTP 200
     */
    @GetMapping("/check/nickname/{nickname}")
    @Operation(summary = "닉네임 중복 확인", description = "닉네임 중복 여부를 확인합니다")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkNickname(@PathVariable String nickname) {
        log.info("GET /api/v1/users/check/nickname/{} - Checking nickname", nickname);
        boolean exists = userService.existsByNickname(nickname);
        Map<String, Boolean> result = Map.of("exists", exists);

        ApiResponse<Map<String, Boolean>> response = ApiResponse.<Map<String, Boolean>>builder()
                .success(true)
                .data(result)
                .build();
        return ResponseEntity.ok(response);
    }

    /**
     * 사용자 프로필을 조회합니다.
     *
     * @param userId 사용자 ID
     * @return 사용자 프로필과 HTTP 200
     */
    @GetMapping("/profile")
    @Operation(summary = "사용자 프로필 조회", description = "사용자의 프로필 정보를 조회합니다")
    public ResponseEntity<ApiResponse<UserDto>> getUserProfile(@RequestParam(name = "userId") String userId) {
        log.info("GET /api/v1/users/profile - Getting profile for user: {}", userId);
        return userService.getUserById(userId)
                .map(user -> {
                    ApiResponse<UserDto> response = ApiResponse.<UserDto>builder()
                            .success(true)
                            .data(user)
                            .build();
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    ApiResponse<UserDto> response = ApiResponse.<UserDto>builder()
                            .success(false)
                            .message("사용자를 찾을 수 없습니다: " + userId)
                            .build();
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
                });
    }
}
