package com.glimpse.server.service;

import com.glimpse.server.exception.RateLimitExceededException;
import com.glimpse.server.exception.VerificationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * SMS 인증 서비스 (프로덕션 수준)
 * 
 * <p>Redis 기반 인증 코드 관리 및 Rate Limiting을 제공합니다.</p>
 * 
 * <h3>보안 기능:</h3>
 * <ul>
 *   <li>전화번호당 시간당/일일 발송 제한</li>
 *   <li>IP당 요청 제한</li>
 *   <li>재전송 쿨다운</li>
 *   <li>인증 실패 횟수 제한</li>
 *   <li>차단 번호 관리</li>
 * </ul>
 * 
 * @author Glimpse Team
 * @version 2.0
 * @since 2026-01-03
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SmsVerificationService {

    private final RedisTemplate<String, String> redisTemplate;
    private final SmsService smsService;

    // Redis Key 접두사
    private static final String KEY_VERIFY = "sms:verify:";           // 인증 코드
    private static final String KEY_ATTEMPTS = "sms:attempts:";       // 인증 시도 횟수
    private static final String KEY_COOLDOWN = "sms:cooldown:";       // 재전송 쿨다운
    private static final String KEY_RATE_HOURLY = "sms:rate:hourly:"; // 시간당 발송 횟수
    private static final String KEY_RATE_DAILY = "sms:rate:daily:";   // 일일 발송 횟수
    private static final String KEY_IP_RATE = "sms:ip:";              // IP당 요청 횟수
    private static final String KEY_BLACKLIST = "sms:blacklist";      // 차단 번호 목록
    private static final String KEY_BLOCKED = "sms:blocked:";         // 임시 차단

    // 설정값
    @Value("${sms.rate-limit.max-per-phone-hourly:5}")
    private int maxPerPhoneHourly;

    @Value("${sms.rate-limit.max-per-phone-daily:10}")
    private int maxPerPhoneDaily;

    @Value("${sms.rate-limit.max-per-ip-hourly:20}")
    private int maxPerIpHourly;

    @Value("${sms.rate-limit.cooldown-seconds:60}")
    private int cooldownSeconds;

    @Value("${sms.rate-limit.max-attempts:5}")
    private int maxAttempts;

    @Value("${sms.rate-limit.block-duration-minutes:10}")
    private int blockDurationMinutes;

    @Value("${sms.verification.code-length:6}")
    private int codeLength;

    @Value("${sms.verification.expiry-seconds:300}")
    private int expirySeconds;

    @Value("${sms.dev-mode:false}")
    private boolean devMode;

    @Value("${sms.dev-code:123456}")
    private String devCode;

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * 인증 코드 발송
     * 
     * @param phoneNumber 전화번호
     * @param ipAddress 요청 IP 주소
     * @throws RateLimitExceededException Rate Limit 초과 시
     * @throws VerificationException 발송 실패 시
     */
    public void sendVerificationCode(String phoneNumber, String ipAddress) {
        log.info("인증 코드 발송 요청: phoneNumber={}, ip={}", 
                maskPhoneNumber(phoneNumber), maskIpAddress(ipAddress));

        // 1. 전화번호 정규화
        String normalizedPhone = normalizePhoneNumber(phoneNumber);

        // 2. 차단 여부 확인
        checkBlocked(normalizedPhone);

        // 3. 차단 번호 확인
        checkBlacklist(normalizedPhone);

        // 4. Rate Limiting 확인
        checkRateLimits(normalizedPhone, ipAddress);

        // 5. 쿨다운 확인
        checkCooldown(normalizedPhone);

        // 6. 인증 코드 생성
        String code = generateVerificationCode();

        // 7. Redis에 저장
        saveVerificationCode(normalizedPhone, code);

        // 8. Rate Limit 카운터 증가
        incrementRateLimitCounters(normalizedPhone, ipAddress);

        // 9. 쿨다운 설정
        setCooldown(normalizedPhone);

        // 10. SMS 발송
        if (!devMode) {
            boolean sent = smsService.sendVerificationCode(normalizedPhone, code);
            if (!sent && smsService.isAvailable()) {
                log.error("SMS 발송 실패: {}", maskPhoneNumber(normalizedPhone));
                throw new VerificationException("인증 코드 발송에 실패했습니다. 잠시 후 다시 시도해주세요.");
            }
        } else {
            log.info("[개발모드] 인증 코드 생성: {} -> {}", maskPhoneNumber(normalizedPhone), code);
        }

        log.info("인증 코드 발송 완료: phoneNumber={}", maskPhoneNumber(normalizedPhone));
    }

    /**
     * 인증 코드 검증
     * 
     * @param phoneNumber 전화번호
     * @param code 인증 코드
     * @return 검증 성공 여부
     * @throws RateLimitExceededException 시도 횟수 초과 시
     */
    public boolean verifyCode(String phoneNumber, String code) {
        String normalizedPhone = normalizePhoneNumber(phoneNumber);
        log.info("인증 코드 검증: phoneNumber={}", maskPhoneNumber(normalizedPhone));

        // 1. 차단 여부 확인
        checkBlocked(normalizedPhone);

        // 2. 개발 모드 코드 확인
        if (devMode && devCode.equals(code)) {
            log.info("개발 모드 인증 코드 사용: {}", maskPhoneNumber(normalizedPhone));
            clearVerificationData(normalizedPhone);
            return true;
        }

        // 3. 시도 횟수 확인
        int attempts = incrementAttempts(normalizedPhone);
        if (attempts > maxAttempts) {
            log.warn("인증 시도 횟수 초과: phoneNumber={}, attempts={}", 
                    maskPhoneNumber(normalizedPhone), attempts);
            blockTemporarily(normalizedPhone);
            throw new RateLimitExceededException(
                    String.format("인증 시도 횟수를 초과했습니다. %d분 후 다시 시도해주세요.", blockDurationMinutes));
        }

        // 4. 저장된 코드 조회
        String storedCode = redisTemplate.opsForValue().get(KEY_VERIFY + normalizedPhone);
        if (storedCode == null) {
            log.warn("인증 코드 없음 또는 만료: {}", maskPhoneNumber(normalizedPhone));
            return false;
        }

        // 5. 코드 검증
        boolean isValid = storedCode.equals(code);
        if (isValid) {
            log.info("인증 코드 검증 성공: {}", maskPhoneNumber(normalizedPhone));
            clearVerificationData(normalizedPhone);
        } else {
            log.warn("인증 코드 불일치: phoneNumber={}, 남은 시도={}", 
                    maskPhoneNumber(normalizedPhone), maxAttempts - attempts);
        }

        return isValid;
    }

    /**
     * 남은 재전송 대기 시간 조회
     * 
     * @param phoneNumber 전화번호
     * @return 남은 초 (쿨다운 없으면 0)
     */
    public long getRemainingCooldown(String phoneNumber) {
        String normalizedPhone = normalizePhoneNumber(phoneNumber);
        Long ttl = redisTemplate.getExpire(KEY_COOLDOWN + normalizedPhone, TimeUnit.SECONDS);
        return ttl != null && ttl > 0 ? ttl : 0;
    }

    /**
     * 남은 인증 시도 횟수 조회
     * 
     * @param phoneNumber 전화번호
     * @return 남은 시도 횟수
     */
    public int getRemainingAttempts(String phoneNumber) {
        String normalizedPhone = normalizePhoneNumber(phoneNumber);
        String attemptsStr = redisTemplate.opsForValue().get(KEY_ATTEMPTS + normalizedPhone);
        int attempts = attemptsStr != null ? Integer.parseInt(attemptsStr) : 0;
        return Math.max(0, maxAttempts - attempts);
    }

    /**
     * 번호를 블랙리스트에 추가
     * 
     * @param phoneNumber 전화번호
     */
    public void addToBlacklist(String phoneNumber) {
        String normalizedPhone = normalizePhoneNumber(phoneNumber);
        redisTemplate.opsForSet().add(KEY_BLACKLIST, normalizedPhone);
        log.info("블랙리스트 추가: {}", maskPhoneNumber(normalizedPhone));
    }

    /**
     * 번호를 블랙리스트에서 제거
     * 
     * @param phoneNumber 전화번호
     */
    public void removeFromBlacklist(String phoneNumber) {
        String normalizedPhone = normalizePhoneNumber(phoneNumber);
        redisTemplate.opsForSet().remove(KEY_BLACKLIST, normalizedPhone);
        log.info("블랙리스트 제거: {}", maskPhoneNumber(normalizedPhone));
    }

    // ==================== Private Methods ====================

    /**
     * 인증 코드 생성 (보안 랜덤)
     */
    private String generateVerificationCode() {
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < codeLength; i++) {
            code.append(secureRandom.nextInt(10));
        }
        return code.toString();
    }

    /**
     * 인증 코드 저장
     */
    private void saveVerificationCode(String phoneNumber, String code) {
        redisTemplate.opsForValue().set(
                KEY_VERIFY + phoneNumber,
                code,
                Duration.ofSeconds(expirySeconds)
        );
        // 시도 횟수 초기화
        redisTemplate.delete(KEY_ATTEMPTS + phoneNumber);
    }

    /**
     * 인증 데이터 삭제
     */
    private void clearVerificationData(String phoneNumber) {
        redisTemplate.delete(KEY_VERIFY + phoneNumber);
        redisTemplate.delete(KEY_ATTEMPTS + phoneNumber);
    }

    /**
     * 차단 여부 확인
     */
    private void checkBlocked(String phoneNumber) {
        Boolean isBlocked = redisTemplate.hasKey(KEY_BLOCKED + phoneNumber);
        if (Boolean.TRUE.equals(isBlocked)) {
            Long ttl = redisTemplate.getExpire(KEY_BLOCKED + phoneNumber, TimeUnit.MINUTES);
            throw new RateLimitExceededException(
                    String.format("일시적으로 차단되었습니다. %d분 후 다시 시도해주세요.", ttl));
        }
    }

    /**
     * 블랙리스트 확인
     */
    private void checkBlacklist(String phoneNumber) {
        Boolean isBlacklisted = redisTemplate.opsForSet().isMember(KEY_BLACKLIST, phoneNumber);
        if (Boolean.TRUE.equals(isBlacklisted)) {
            log.warn("블랙리스트 번호 시도: {}", maskPhoneNumber(phoneNumber));
            throw new VerificationException("해당 번호로는 인증할 수 없습니다.");
        }
    }

    /**
     * Rate Limiting 확인
     */
    private void checkRateLimits(String phoneNumber, String ipAddress) {
        // 전화번호 시간당 제한
        String hourlyCount = redisTemplate.opsForValue().get(KEY_RATE_HOURLY + phoneNumber);
        if (hourlyCount != null && Integer.parseInt(hourlyCount) >= maxPerPhoneHourly) {
            throw new RateLimitExceededException("시간당 최대 발송 횟수를 초과했습니다. 1시간 후 다시 시도해주세요.");
        }

        // 전화번호 일일 제한
        String dailyCount = redisTemplate.opsForValue().get(KEY_RATE_DAILY + phoneNumber);
        if (dailyCount != null && Integer.parseInt(dailyCount) >= maxPerPhoneDaily) {
            throw new RateLimitExceededException("일일 최대 발송 횟수를 초과했습니다. 내일 다시 시도해주세요.");
        }

        // IP 시간당 제한
        if (ipAddress != null) {
            String ipCount = redisTemplate.opsForValue().get(KEY_IP_RATE + ipAddress);
            if (ipCount != null && Integer.parseInt(ipCount) >= maxPerIpHourly) {
                log.warn("IP Rate Limit 초과: ip={}", maskIpAddress(ipAddress));
                throw new RateLimitExceededException("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
            }
        }
    }

    /**
     * 쿨다운 확인
     */
    private void checkCooldown(String phoneNumber) {
        Boolean hasCooldown = redisTemplate.hasKey(KEY_COOLDOWN + phoneNumber);
        if (Boolean.TRUE.equals(hasCooldown)) {
            Long ttl = redisTemplate.getExpire(KEY_COOLDOWN + phoneNumber, TimeUnit.SECONDS);
            throw new RateLimitExceededException(
                    String.format("%d초 후에 다시 시도해주세요.", ttl));
        }
    }

    /**
     * Rate Limit 카운터 증가
     */
    private void incrementRateLimitCounters(String phoneNumber, String ipAddress) {
        // 전화번호 시간당
        redisTemplate.opsForValue().increment(KEY_RATE_HOURLY + phoneNumber);
        redisTemplate.expire(KEY_RATE_HOURLY + phoneNumber, 1, TimeUnit.HOURS);

        // 전화번호 일일
        redisTemplate.opsForValue().increment(KEY_RATE_DAILY + phoneNumber);
        redisTemplate.expire(KEY_RATE_DAILY + phoneNumber, 1, TimeUnit.DAYS);

        // IP 시간당
        if (ipAddress != null) {
            redisTemplate.opsForValue().increment(KEY_IP_RATE + ipAddress);
            redisTemplate.expire(KEY_IP_RATE + ipAddress, 1, TimeUnit.HOURS);
        }
    }

    /**
     * 쿨다운 설정
     */
    private void setCooldown(String phoneNumber) {
        redisTemplate.opsForValue().set(
                KEY_COOLDOWN + phoneNumber,
                "1",
                Duration.ofSeconds(cooldownSeconds)
        );
    }

    /**
     * 시도 횟수 증가
     */
    private int incrementAttempts(String phoneNumber) {
        Long attempts = redisTemplate.opsForValue().increment(KEY_ATTEMPTS + phoneNumber);
        redisTemplate.expire(KEY_ATTEMPTS + phoneNumber, expirySeconds, TimeUnit.SECONDS);
        return attempts != null ? attempts.intValue() : 1;
    }

    /**
     * 임시 차단
     */
    private void blockTemporarily(String phoneNumber) {
        redisTemplate.opsForValue().set(
                KEY_BLOCKED + phoneNumber,
                "1",
                Duration.ofMinutes(blockDurationMinutes)
        );
        log.warn("임시 차단: phoneNumber={}, duration={}분", 
                maskPhoneNumber(phoneNumber), blockDurationMinutes);
    }

    /**
     * 전화번호 정규화
     */
    private String normalizePhoneNumber(String phoneNumber) {
        String numbers = phoneNumber.replaceAll("[^0-9]", "");
        
        // +82 형식 변환
        if (numbers.startsWith("82")) {
            numbers = "0" + numbers.substring(2);
        }
        
        // 010으로 시작하지 않으면 0 추가
        if (!numbers.startsWith("0")) {
            numbers = "0" + numbers;
        }
        
        return numbers;
    }

    /**
     * 전화번호 마스킹 (로그용)
     */
    private String maskPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.length() < 4) {
            return "***";
        }
        return phoneNumber.substring(0, 3) + "****" + 
               phoneNumber.substring(phoneNumber.length() - 4);
    }

    /**
     * IP 마스킹 (로그용)
     */
    private String maskIpAddress(String ipAddress) {
        if (ipAddress == null) {
            return "unknown";
        }
        String[] parts = ipAddress.split("\\.");
        if (parts.length == 4) {
            return parts[0] + "." + parts[1] + ".*.*";
        }
        return ipAddress.substring(0, Math.min(ipAddress.length(), 10)) + "...";
    }
}

