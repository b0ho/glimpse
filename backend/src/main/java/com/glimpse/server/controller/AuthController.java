package com.glimpse.server.controller;

import com.glimpse.server.dto.common.ApiResponse;
import com.glimpse.server.dto.auth.AuthResponseDto;
import com.glimpse.server.dto.auth.LoginDto;
import com.glimpse.server.dto.auth.RegisterDto;
import com.glimpse.server.dto.auth.TokenDto;
import com.glimpse.server.dto.user.UserDto;
import com.glimpse.server.service.AuthService;
import com.glimpse.server.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Auth Controller
 *
 * <p>인증 관련 REST API 엔드포인트를 제공합니다.</p>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "인증 관리 API")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/register")
    @Operation(summary = "회원가입", description = "새로운 사용자를 등록합니다")
    public ResponseEntity<ApiResponse<AuthResponseDto>> register(
            @Valid @RequestBody RegisterDto registerDto
    ) {
        log.info("회원가입 요청: phoneNumber={}", registerDto.getPhoneNumber());

        try {
            AuthResponseDto response = authService.register(registerDto);
            return ResponseEntity.ok(ApiResponse.success(response, "회원가입이 완료되었습니다"));
        } catch (IllegalArgumentException e) {
            log.error("회원가입 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(e.getMessage())
            );
        }
    }

    @PostMapping("/login")
    @Operation(summary = "로그인", description = "사용자 로그인을 처리합니다")
    public ResponseEntity<ApiResponse<AuthResponseDto>> login(
            @Valid @RequestBody LoginDto loginDto
    ) {
        log.info("로그인 요청: phoneNumber={}", loginDto.getPhoneNumber());

        try {
            AuthResponseDto response = authService.login(loginDto);
            return ResponseEntity.ok(ApiResponse.success(response, "로그인 성공"));
        } catch (IllegalArgumentException e) {
            log.error("로그인 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(e.getMessage())
            );
        }
    }

    @PostMapping("/refresh")
    @Operation(summary = "토큰 갱신", description = "리프레시 토큰으로 새로운 액세스 토큰을 발급합니다")
    public ResponseEntity<ApiResponse<TokenDto>> refreshToken(
            @RequestBody Map<String, String> request
    ) {
        String refreshToken = request.get("refreshToken");
        log.info("토큰 갱신 요청");

        try {
            TokenDto response = authService.refreshToken(refreshToken);
            return ResponseEntity.ok(ApiResponse.success(response, "토큰 갱신 완료"));
        } catch (IllegalArgumentException e) {
            log.error("토큰 갱신 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(e.getMessage())
            );
        }
    }

    @PostMapping("/verify/send")
    @Operation(summary = "인증 코드 발송", description = "전화번호로 인증 코드를 발송합니다")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> sendVerificationCode(
            @RequestBody Map<String, String> request
    ) {
        String phoneNumber = request.get("phoneNumber");
        log.info("인증 코드 발송 요청: phoneNumber={}", phoneNumber);

        try {
            authService.sendVerificationCode(phoneNumber);
            return ResponseEntity.ok(
                    ApiResponse.success(Map.of("sent", true), "인증 코드가 발송되었습니다")
            );
        } catch (Exception e) {
            log.error("인증 코드 발송 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(e.getMessage())
            );
        }
    }

    @PostMapping("/verify/check")
    @Operation(summary = "인증 코드 확인", description = "전화번호와 인증 코드를 확인합니다")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> verifyCode(
            @RequestBody Map<String, String> request
    ) {
        String phoneNumber = request.get("phoneNumber");
        String code = request.get("code");
        log.info("인증 코드 확인 요청: phoneNumber={}", phoneNumber);

        boolean isValid = authService.verifyCode(phoneNumber, code);

        if (isValid) {
            return ResponseEntity.ok(
                    ApiResponse.success(Map.of("valid", true), "인증 코드가 확인되었습니다")
            );
        } else {
            return ResponseEntity.badRequest().body(
                    ApiResponse.success(Map.of("valid", false), "인증 코드가 유효하지 않습니다")
            );
        }
    }

    @GetMapping("/me")
    @Operation(summary = "현재 사용자 정보 조회", description = "토큰으로 현재 로그인한 사용자 정보를 조회합니다")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(
            @Parameter(description = "액세스 토큰 (Bearer 형식)")
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        log.info("현재 사용자 정보 조회 요청");

        try {
            // Bearer 토큰에서 실제 토큰 추출
            String token = null;
            if (authorization != null && authorization.startsWith("Bearer ")) {
                token = authorization.substring(7);
            }

            if (token == null || token.isEmpty()) {
                return ResponseEntity.badRequest().body(
                        ApiResponse.error("인증 토큰이 필요합니다")
                );
            }

            // 토큰 검증
            if (!authService.validateToken(token)) {
                return ResponseEntity.badRequest().body(
                        ApiResponse.error("유효하지 않은 토큰입니다")
                );
            }

            // 사용자 ID 추출 및 사용자 정보 조회
            String userId = authService.getUserIdFromToken(token);
            UserDto user = userService.getUserById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

            return ResponseEntity.ok(ApiResponse.success(user, "사용자 정보 조회 성공"));
        } catch (IllegalArgumentException e) {
            log.error("사용자 정보 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(e.getMessage())
            );
        }
    }

    @PostMapping("/validate")
    @Operation(summary = "토큰 유효성 검증", description = "토큰의 유효성을 확인합니다")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> validateToken(
            @RequestBody Map<String, String> request
    ) {
        String token = request.get("token");
        log.info("토큰 유효성 검증 요청");

        boolean isValid = authService.validateToken(token);

        return ResponseEntity.ok(
                ApiResponse.success(
                        Map.of("valid", isValid),
                        isValid ? "유효한 토큰입니다" : "유효하지 않은 토큰입니다"
                )
        );
    }
}
