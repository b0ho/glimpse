package com.glimpse.server.service;

import com.glimpse.server.dto.auth.AuthResponseDto;
import com.glimpse.server.dto.auth.LoginDto;
import com.glimpse.server.dto.auth.RegisterDto;
import com.glimpse.server.dto.auth.TokenDto;
import com.glimpse.server.dto.user.CreateUserDto;
import com.glimpse.server.dto.user.UserDto;
import com.glimpse.server.entity.User;
import com.glimpse.server.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Auth Service Implementation
 *
 * <p>인증 및 권한 관련 비즈니스 로직을 구현하는 서비스입니다.</p>
 *
 * <p>개발 모드에서는 간단한 토큰 기반 인증을 사용하며,
 * 프로덕션 모드에서는 JWT 기반 인증을 사용합니다.</p>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final UserService userService;

    // 개발 모드: 인증 코드 저장소 (전화번호 -> 코드)
    private final Map<String, String> verificationCodes = new ConcurrentHashMap<>();

    // 개발 모드: 토큰 저장소 (토큰 -> 사용자 ID)
    private final Map<String, String> tokenStore = new ConcurrentHashMap<>();

    // 토큰 만료 시간 (초): 24시간
    private static final Long ACCESS_TOKEN_EXPIRY = 86400L;
    // 리프레시 토큰 만료 시간 (초): 7일
    private static final Long REFRESH_TOKEN_EXPIRY = 604800L;

    @Override
    @Transactional
    public AuthResponseDto register(RegisterDto registerDto) {
        log.info("회원가입 시도: {}", registerDto.getPhoneNumber());

        // 전화번호 중복 체크
        if (userRepository.existsByPhoneNumber(registerDto.getPhoneNumber())) {
            throw new IllegalArgumentException("이미 등록된 전화번호입니다: " + registerDto.getPhoneNumber());
        }

        // 인증 코드 확인 (개발 모드에서는 "123456" 또는 저장된 코드)
        if (!verifyCode(registerDto.getPhoneNumber(), registerDto.getVerificationCode())) {
            throw new IllegalArgumentException("인증 코드가 유효하지 않습니다");
        }

        // 사용자 생성
        CreateUserDto createUserDto = CreateUserDto.builder()
                .phoneNumber(registerDto.getPhoneNumber())
                .nickname(registerDto.getNickname())
                .age(registerDto.getAge())
                .gender(registerDto.getGender())
                .clerkId(registerDto.getClerkId())
                .build();

        UserDto userDto = userService.createUser(createUserDto);
        log.info("회원가입 완료: userId={}", userDto.getId());

        // 토큰 발급
        String accessToken = generateAccessToken(userDto.getId());
        String refreshToken = generateRefreshToken(userDto.getId());

        // 인증 코드 삭제
        verificationCodes.remove(registerDto.getPhoneNumber());

        return AuthResponseDto.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(ACCESS_TOKEN_EXPIRY)
                .user(userDto)
                .build();
    }

    @Override
    @Transactional
    public AuthResponseDto login(LoginDto loginDto) {
        log.info("로그인 시도: {}", loginDto.getPhoneNumber());

        // 사용자 조회
        User user = userRepository.findByPhoneNumber(loginDto.getPhoneNumber())
                .orElseThrow(() -> new IllegalArgumentException("등록되지 않은 전화번호입니다: " + loginDto.getPhoneNumber()));

        // 개발 모드: password나 clerkToken 검증 생략
        // 프로덕션 모드에서는 여기에 비밀번호 검증 또는 Clerk 토큰 검증 로직 추가

        // 마지막 로그인 시간 업데이트
        user.setLastOnline(LocalDateTime.now());
        user.setLastActive(LocalDateTime.now());
        userRepository.save(user);

        // 토큰 발급
        String accessToken = generateAccessToken(user.getId());
        String refreshToken = generateRefreshToken(user.getId());

        log.info("로그인 성공: userId={}", user.getId());

        return AuthResponseDto.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(ACCESS_TOKEN_EXPIRY)
                .user(convertToDto(user))
                .build();
    }

    @Override
    public TokenDto refreshToken(String refreshToken) {
        log.info("토큰 갱신 요청");

        if (!validateToken(refreshToken)) {
            throw new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다");
        }

        String userId = getUserIdFromToken(refreshToken);

        // 사용자 존재 확인
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다");
        }

        // 새로운 액세스 토큰 발급
        String newAccessToken = generateAccessToken(userId);
        String newRefreshToken = generateRefreshToken(userId);

        log.info("토큰 갱신 완료: userId={}", userId);

        return TokenDto.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(ACCESS_TOKEN_EXPIRY)
                .build();
    }

    @Override
    public boolean validateToken(String token) {
        if (token == null || token.isEmpty()) {
            return false;
        }

        // 개발 모드: 토큰 저장소에서 확인
        return tokenStore.containsKey(token);
    }

    @Override
    public void sendVerificationCode(String phoneNumber) {
        log.info("인증 코드 발송: {}", phoneNumber);

        // 인증 코드 생성 (개발 모드: 고정값 "123456", 프로덕션: 랜덤 6자리)
        String code = "123456";

        // 개발 모드에서는 메모리에 저장
        verificationCodes.put(phoneNumber, code);

        log.info("인증 코드 발송 완료: {} -> {}", phoneNumber, code);

        // 프로덕션 모드에서는 실제 SMS API 호출
        // smsService.sendSms(phoneNumber, "Glimpse 인증 코드: " + code);
    }

    @Override
    public boolean verifyCode(String phoneNumber, String code) {
        log.info("인증 코드 확인: {}", phoneNumber);

        // 개발 모드: "123456" 또는 저장된 코드 확인
        String storedCode = verificationCodes.get(phoneNumber);
        boolean isValid = "123456".equals(code) || code.equals(storedCode);

        if (isValid) {
            log.info("인증 코드 확인 성공: {}", phoneNumber);
        } else {
            log.warn("인증 코드 확인 실패: {} (입력: {}, 저장: {})", phoneNumber, code, storedCode);
        }

        return isValid;
    }

    @Override
    public String getUserIdFromToken(String token) {
        if (token == null || token.isEmpty()) {
            throw new IllegalArgumentException("토큰이 비어있습니다");
        }

        // 개발 모드: 토큰 저장소에서 사용자 ID 조회
        String userId = tokenStore.get(token);
        if (userId == null) {
            throw new IllegalArgumentException("유효하지 않은 토큰입니다");
        }

        return userId;
    }

    /**
     * 액세스 토큰을 생성합니다.
     *
     * @param userId 사용자 ID
     * @return 액세스 토큰
     */
    private String generateAccessToken(String userId) {
        // 개발 모드: 간단한 UUID 기반 토큰
        String token = "access_" + UUID.randomUUID().toString();
        tokenStore.put(token, userId);

        log.debug("액세스 토큰 생성: userId={}, token={}", userId, token);

        return token;

        // 프로덕션 모드에서는 JWT 라이브러리 사용:
        // return Jwts.builder()
        //     .setSubject(userId)
        //     .setIssuedAt(new Date())
        //     .setExpiration(new Date(System.currentTimeMillis() + ACCESS_TOKEN_EXPIRY * 1000))
        //     .signWith(SignatureAlgorithm.HS512, jwtSecret)
        //     .compact();
    }

    /**
     * 리프레시 토큰을 생성합니다.
     *
     * @param userId 사용자 ID
     * @return 리프레시 토큰
     */
    private String generateRefreshToken(String userId) {
        // 개발 모드: 간단한 UUID 기반 토큰
        String token = "refresh_" + UUID.randomUUID().toString();
        tokenStore.put(token, userId);

        log.debug("리프레시 토큰 생성: userId={}, token={}", userId, token);

        return token;

        // 프로덕션 모드에서는 JWT 라이브러리 사용
    }

    /**
     * User 엔티티를 UserDto로 변환합니다.
     *
     * @param user User 엔티티
     * @return UserDto
     */
    private UserDto convertToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .clerkId(user.getClerkId())
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
