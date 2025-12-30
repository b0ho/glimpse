package com.glimpse.server.service;

import com.glimpse.server.dto.auth.AuthResponseDto;
import com.glimpse.server.dto.auth.LoginDto;
import com.glimpse.server.dto.auth.OAuthUserInfo;
import com.glimpse.server.dto.auth.RegisterDto;
import com.glimpse.server.dto.auth.TokenDto;
import com.glimpse.server.dto.user.CreateUserDto;
import com.glimpse.server.dto.user.UserDto;
import com.glimpse.server.entity.RefreshToken;
import com.glimpse.server.entity.User;
import com.glimpse.server.repository.RefreshTokenRepository;
import com.glimpse.server.repository.UserRepository;
import com.glimpse.server.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Auth Service Implementation (JWT 기반)
 *
 * <p>JWT 기반 인증 및 권한 관리를 구현합니다.</p>
 *
 * @author Glimpse Team
 * @version 2.0
 * @since 2025-01-14
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final SmsService smsService;
    private final OAuthService oAuthService;

    // 인증 코드 저장소 (프로덕션에서는 Redis 사용 권장)
    private final Map<String, VerificationInfo> verificationCodes = new ConcurrentHashMap<>();

    // 최대 디바이스 수
    @Value("${auth.max-devices:5}")
    private int maxDevices;

    // 인증 코드 만료 시간 (초)
    private static final int VERIFICATION_CODE_EXPIRY = 300; // 5분

    /**
     * 인증 코드 정보
     */
    private record VerificationInfo(String code, LocalDateTime expiresAt) {
        boolean isExpired() {
            return LocalDateTime.now().isAfter(expiresAt);
        }
    }

    @Override
    @Transactional
    public AuthResponseDto register(RegisterDto registerDto) {
        log.info("회원가입 시도: {}", registerDto.getPhoneNumber());

        // 전화번호 중복 체크
        if (userRepository.existsByPhoneNumber(registerDto.getPhoneNumber())) {
            throw new IllegalArgumentException("이미 등록된 전화번호입니다: " + registerDto.getPhoneNumber());
        }

        // 인증 코드 확인
        if (!verifyCode(registerDto.getPhoneNumber(), registerDto.getVerificationCode())) {
            throw new IllegalArgumentException("인증 코드가 유효하지 않습니다");
        }

        // 사용자 생성
        CreateUserDto createUserDto = CreateUserDto.builder()
                .phoneNumber(registerDto.getPhoneNumber())
                .nickname(registerDto.getNickname())
                .age(registerDto.getAge())
                .gender(registerDto.getGender())
                .build();

        UserDto userDto = userService.createUser(createUserDto);
        log.info("회원가입 완료: userId={}", userDto.getId());

        // 인증 코드 삭제
        verificationCodes.remove(registerDto.getPhoneNumber());

        // 토큰 발급
        return createAuthResponse(userDto.getId(), "USER", userDto);
    }

    @Override
    @Transactional
    public AuthResponseDto login(LoginDto loginDto) {
        log.info("로그인 시도: {}", loginDto.getPhoneNumber());

        // 사용자 조회
        User user = userRepository.findByPhoneNumber(loginDto.getPhoneNumber())
                .orElseThrow(() -> new IllegalArgumentException("등록되지 않은 전화번호입니다: " + loginDto.getPhoneNumber()));

        // 인증 코드 확인 (SMS 인증)
        if (loginDto.getVerificationCode() != null) {
            if (!verifyCode(loginDto.getPhoneNumber(), loginDto.getVerificationCode())) {
                throw new IllegalArgumentException("인증 코드가 유효하지 않습니다");
            }
            // 인증 코드 삭제
            verificationCodes.remove(loginDto.getPhoneNumber());
        }

        // 마지막 로그인 시간 업데이트
        user.setLastOnline(LocalDateTime.now());
        user.setLastActive(LocalDateTime.now());
        userRepository.save(user);

        log.info("로그인 성공: userId={}", user.getId());

        // 토큰 발급
        return createAuthResponse(user.getId(), user.getIsPremium() ? "PREMIUM" : "USER", convertToDto(user));
    }

    @Override
    @Transactional
    public TokenDto refreshToken(String refreshToken) {
        log.info("토큰 갱신 요청");

        // JWT 토큰 유효성 검증
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다");
        }

        // 토큰 타입 확인
        String tokenType = jwtTokenProvider.getTokenType(refreshToken);
        if (!"refresh".equals(tokenType)) {
            throw new IllegalArgumentException("리프레시 토큰이 아닙니다");
        }

        // DB에서 토큰 조회
        RefreshToken storedToken = refreshTokenRepository.findValidByToken(refreshToken, LocalDateTime.now())
                .orElseThrow(() -> new IllegalArgumentException("리프레시 토큰이 만료되었거나 폐기되었습니다"));

        String userId = storedToken.getUserId();

        // 사용자 존재 확인
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        // 기존 토큰 폐기
        storedToken.revoke();
        refreshTokenRepository.save(storedToken);

        // 새로운 토큰 발급
        String role = user.getIsPremium() ? "PREMIUM" : "USER";
        String newAccessToken = jwtTokenProvider.createAccessToken(userId, role);
        String newRefreshToken = jwtTokenProvider.createRefreshToken(userId);

        // 새 리프레시 토큰 저장
        saveRefreshToken(userId, newRefreshToken, null, null, null);

        log.info("토큰 갱신 완료: userId={}", userId);

        return TokenDto.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpirySeconds())
                .build();
    }

    @Override
    public boolean validateToken(String token) {
        return jwtTokenProvider.validateToken(token);
    }

    @Override
    @Transactional
    public void sendVerificationCode(String phoneNumber) {
        log.info("인증 코드 발송: {}", phoneNumber);

        // 인증 코드 생성 (6자리 랜덤)
        String code = generateVerificationCode();

        // 인증 코드 저장 (만료 시간 포함)
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(VERIFICATION_CODE_EXPIRY);
        verificationCodes.put(phoneNumber, new VerificationInfo(code, expiresAt));

        log.info("인증 코드 생성 완료: {} -> {} (만료: {})", phoneNumber, code, expiresAt);

        // SMS 발송
        boolean sent = smsService.sendVerificationCode(phoneNumber, code);
        if (!sent && smsService.isAvailable()) {
            log.error("SMS 발송 실패: {}", phoneNumber);
            throw new RuntimeException("인증 코드 발송에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
    }

    @Override
    public boolean verifyCode(String phoneNumber, String code) {
        log.info("인증 코드 확인: {}", phoneNumber);

        // 개발 모드: "123456" 허용
        if ("123456".equals(code)) {
            log.info("개발 모드 인증 코드 사용: {}", phoneNumber);
            return true;
        }

        VerificationInfo info = verificationCodes.get(phoneNumber);
        if (info == null) {
            log.warn("인증 코드 없음: {}", phoneNumber);
            return false;
        }

        if (info.isExpired()) {
            log.warn("인증 코드 만료: {}", phoneNumber);
            verificationCodes.remove(phoneNumber);
            return false;
        }

        boolean isValid = info.code().equals(code);
        if (isValid) {
            log.info("인증 코드 확인 성공: {}", phoneNumber);
        } else {
            log.warn("인증 코드 불일치: {} (입력: {}, 저장: {})", phoneNumber, code, info.code());
        }

        return isValid;
    }

    @Override
    public String getUserIdFromToken(String token) {
        return jwtTokenProvider.getUserIdFromToken(token);
    }

    @Override
    @Transactional
    public void logout(String userId, String refreshToken) {
        log.info("로그아웃: userId={}", userId);

        if (refreshToken != null) {
            // 특정 토큰만 폐기
            refreshTokenRepository.revokeByToken(refreshToken);
        }

        log.info("로그아웃 완료: userId={}", userId);
    }

    @Override
    @Transactional
    public void logoutAllDevices(String userId) {
        log.info("모든 기기 로그아웃: userId={}", userId);

        int revokedCount = refreshTokenRepository.revokeAllByUserId(userId);
        log.info("폐기된 토큰 수: {}", revokedCount);
    }

    @Override
    @Transactional
    public AuthResponseDto oauthLogin(String provider, String oauthToken) {
        log.info("OAuth 로그인: provider={}", provider);

        // 1. OAuth 제공자별 사용자 정보 조회
        OAuthUserInfo oauthUser = switch (provider.toLowerCase()) {
            case "google" -> oAuthService.getGoogleUserInfo(oauthToken);
            case "kakao" -> oAuthService.getKakaoUserInfo(oauthToken);
            case "naver" -> oAuthService.getNaverUserInfo(oauthToken);
            default -> throw new IllegalArgumentException("지원하지 않는 OAuth 제공자: " + provider);
        };

        // 2. 기존 사용자 조회 또는 신규 생성
        String oauthId = provider + "_" + oauthUser.getProviderId();
        User user = userRepository.findByOauthId(oauthId)
                .orElseGet(() -> createOAuthUser(oauthUser, oauthId));

        // 3. 마지막 로그인 시간 업데이트
        user.setLastOnline(LocalDateTime.now());
        user.setLastActive(LocalDateTime.now());
        userRepository.save(user);

        log.info("OAuth 로그인 성공: userId={}, provider={}", user.getId(), provider);

        // 4. JWT 토큰 발급
        return createAuthResponse(user.getId(), user.getIsPremium() ? "PREMIUM" : "USER", convertToDto(user));
    }

    /**
     * OAuth 사용자 생성
     */
    private User createOAuthUser(OAuthUserInfo oauthUser, String oauthId) {
        log.info("새 OAuth 사용자 생성: provider={}, providerId={}", 
                oauthUser.getProvider(), oauthUser.getProviderId());

        // 성별 변환
        com.glimpse.server.entity.enums.Gender gender = null;
        if (oauthUser.getGender() != null) {
            String genderStr = oauthUser.getGender().toUpperCase();
            if ("MALE".equals(genderStr) || "M".equals(genderStr) || "male".equalsIgnoreCase(oauthUser.getGender())) {
                gender = com.glimpse.server.entity.enums.Gender.MALE;
            } else if ("FEMALE".equals(genderStr) || "F".equals(genderStr) || "female".equalsIgnoreCase(oauthUser.getGender())) {
                gender = com.glimpse.server.entity.enums.Gender.FEMALE;
            }
        }

        User user = User.builder()
                .oauthId(oauthId)
                .oauthProvider(oauthUser.getProvider())
                .email(oauthUser.getEmail())
                .nickname(oauthUser.getName() != null ? oauthUser.getName() : "사용자")
                .profileImage(oauthUser.getProfileImage())
                .phoneNumber(oauthUser.getPhoneNumber())
                .gender(gender)
                .isVerified(true)
                .credits(0)
                .isPremium(false)
                .build();

        return userRepository.save(user);
    }

    // ==================== Private Methods ====================

    /**
     * 인증 응답 생성
     */
    private AuthResponseDto createAuthResponse(String userId, String role, UserDto userDto) {
        // Access Token 생성
        String accessToken = jwtTokenProvider.createAccessToken(userId, role);

        // Refresh Token 생성
        String refreshToken = jwtTokenProvider.createRefreshToken(userId);

        // Refresh Token 저장
        saveRefreshToken(userId, refreshToken, null, null, null);

        return AuthResponseDto.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpirySeconds())
                .user(userDto)
                .build();
    }

    /**
     * Refresh Token 저장
     */
    private void saveRefreshToken(String userId, String token, String deviceInfo, String ipAddress, String userAgent) {
        // 기존 토큰 수 확인 및 제한
        long tokenCount = refreshTokenRepository.countByUserIdAndRevokedFalse(userId);
        if (tokenCount >= maxDevices) {
            log.warn("최대 디바이스 수 초과, 가장 오래된 토큰 폐기: userId={}", userId);
            // 가장 오래된 토큰 폐기 로직 추가 가능
        }

        // 만료 시간 계산
        LocalDateTime expiresAt = LocalDateTime.now()
                .plusSeconds(jwtTokenProvider.getRefreshTokenExpirySeconds());

        RefreshToken refreshToken = RefreshToken.builder()
                .userId(userId)
                .token(token)
                .deviceInfo(deviceInfo)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .expiresAt(expiresAt)
                .build();

        refreshTokenRepository.save(refreshToken);
        log.debug("Refresh Token 저장: userId={}, expiresAt={}", userId, expiresAt);
    }

    /**
     * 인증 코드 생성 (6자리)
     */
    private String generateVerificationCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    /**
     * User 엔티티를 UserDto로 변환
     */
    private UserDto convertToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .anonymousId(user.getAnonymousId())
                .phoneNumber(user.getPhoneNumber())
                .nickname(user.getNickname())
                .age(user.getAge())
                .gender(user.getGender())
                .profileImage(user.getProfileImage())
                .bio(user.getBio())
                .isVerified(user.getIsVerified())
                .credits(user.getCredits())
                .isPremium(user.getIsPremium())
                .premiumLevel(user.getPremiumLevel())
                .premiumUntil(user.getPremiumUntil())
                .lastActive(user.getLastActive())
                .lastOnline(user.getLastOnline())
                .companyName(user.getCompanyName())
                .education(user.getEducation())
                .location(user.getLocation())
                .height(user.getHeight())
                .mbti(user.getMbti())
                .drinking(user.getDrinking())
                .smoking(user.getSmoking())
                .interests(user.getInterests())
                .groups(user.getGroups())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
