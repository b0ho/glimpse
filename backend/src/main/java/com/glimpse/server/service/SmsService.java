package com.glimpse.server.service;

/**
 * SMS 서비스 인터페이스
 * 
 * <p>SMS 발송 기능을 정의합니다.</p>
 * 
 * @author Glimpse Team
 * @version 1.0
 */
public interface SmsService {

    /**
     * SMS 발송
     * 
     * @param phoneNumber 수신자 전화번호
     * @param message 메시지 내용
     * @return 발송 성공 여부
     */
    boolean sendSms(String phoneNumber, String message);

    /**
     * 인증 코드 SMS 발송
     * 
     * @param phoneNumber 수신자 전화번호
     * @param code 인증 코드
     * @return 발송 성공 여부
     */
    boolean sendVerificationCode(String phoneNumber, String code);

    /**
     * SMS 발송 가능 여부 확인
     * 
     * @return 발송 가능 여부
     */
    boolean isAvailable();
}

