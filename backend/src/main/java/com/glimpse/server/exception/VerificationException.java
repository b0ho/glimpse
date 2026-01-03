package com.glimpse.server.exception;

/**
 * 인증 관련 예외
 * 
 * <p>SMS 인증, 이메일 인증 등 인증 과정에서 발생하는 예외입니다.</p>
 * 
 * @author Glimpse Team
 * @version 1.0
 */
public class VerificationException extends RuntimeException {

    public VerificationException(String message) {
        super(message);
    }

    public VerificationException(String message, Throwable cause) {
        super(message, cause);
    }
}

