package com.glimpse.server.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

/**
 * SMS 서비스 구현체 (솔라피 API)
 * 
 * <p>솔라피(Solapi) API를 사용하여 SMS를 발송합니다.</p>
 * <p>API 문서: https://docs.solapi.com/</p>
 * 
 * @author Glimpse Team
 * @version 1.0
 */
@Slf4j
@Service
public class SmsServiceImpl implements SmsService {

    private static final String SOLAPI_API_URL = "https://api.solapi.com/messages/v4/send";
    private static final String APP_NAME = "Glimpse";

    @Value("${sms.solapi.api-key:}")
    private String apiKey;

    @Value("${sms.solapi.api-secret:}")
    private String apiSecret;

    @Value("${sms.solapi.sender:}")
    private String senderNumber;

    @Value("${sms.enabled:false}")
    private boolean smsEnabled;

    private final RestTemplate restTemplate;

    public SmsServiceImpl() {
        this.restTemplate = new RestTemplate();
    }

    @Override
    public boolean sendSms(String phoneNumber, String message) {
        if (!isAvailable()) {
            log.warn("SMS 서비스가 비활성화되어 있습니다. (sms.enabled=false)");
            log.info("[개발모드] SMS 발송 시뮬레이션: {} -> {}", phoneNumber, message);
            return true; // 개발 모드에서는 성공으로 처리
        }

        try {
            // 전화번호 정규화
            String normalizedPhone = normalizePhoneNumber(phoneNumber);

            // 요청 헤더 생성
            HttpHeaders headers = createHeaders();

            // 요청 바디 생성
            Map<String, Object> requestBody = createRequestBody(normalizedPhone, message);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            log.info("SMS 발송 요청: to={}", normalizedPhone);

            ResponseEntity<Map> response = restTemplate.exchange(
                    SOLAPI_API_URL,
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("SMS 발송 성공: to={}", normalizedPhone);
                return true;
            } else {
                log.error("SMS 발송 실패: status={}, body={}", 
                        response.getStatusCode(), response.getBody());
                return false;
            }
        } catch (Exception e) {
            log.error("SMS 발송 중 오류 발생: {}", e.getMessage(), e);
            return false;
        }
    }

    @Override
    public boolean sendVerificationCode(String phoneNumber, String code) {
        String message = String.format("[%s] 인증번호: %s\n타인에게 절대 알려주지 마세요.", APP_NAME, code);
        return sendSms(phoneNumber, message);
    }

    @Override
    public boolean isAvailable() {
        return smsEnabled && 
               apiKey != null && !apiKey.isEmpty() &&
               apiSecret != null && !apiSecret.isEmpty() &&
               senderNumber != null && !senderNumber.isEmpty();
    }

    /**
     * 요청 헤더 생성 (HMAC-SHA256 서명)
     */
    private HttpHeaders createHeaders() {
        String timestamp = String.valueOf(Instant.now().toEpochMilli());
        String salt = UUID.randomUUID().toString().replace("-", "").substring(0, 32);
        String signature = generateSignature(timestamp, salt);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", String.format("HMAC-SHA256 apiKey=%s, date=%s, salt=%s, signature=%s",
                apiKey, timestamp, salt, signature));

        return headers;
    }

    /**
     * HMAC-SHA256 서명 생성
     */
    private String generateSignature(String timestamp, String salt) {
        try {
            String data = timestamp + salt;
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                    apiSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("서명 생성 실패", e);
        }
    }

    /**
     * 바이트 배열을 16진수 문자열로 변환
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    /**
     * 요청 바디 생성
     */
    private Map<String, Object> createRequestBody(String phoneNumber, String message) {
        Map<String, Object> messageInfo = new HashMap<>();
        messageInfo.put("to", phoneNumber);
        messageInfo.put("from", senderNumber);
        messageInfo.put("text", message);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("message", messageInfo);

        return requestBody;
    }

    /**
     * 전화번호 정규화 (한국 형식)
     */
    private String normalizePhoneNumber(String phoneNumber) {
        // 숫자만 추출
        String numbers = phoneNumber.replaceAll("[^0-9]", "");

        // +82 형식이면 변환
        if (numbers.startsWith("82")) {
            numbers = "0" + numbers.substring(2);
        }

        // 010으로 시작하지 않으면 010 추가
        if (!numbers.startsWith("0")) {
            numbers = "0" + numbers;
        }

        return numbers;
    }
}

