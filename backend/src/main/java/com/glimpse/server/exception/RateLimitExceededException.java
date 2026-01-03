package com.glimpse.server.exception;

/**
 * Rate Limit 초과 예외
 * 
 * <p>SMS 발송, API 호출 등의 Rate Limit 초과 시 발생합니다.</p>
 * 
 * @author Glimpse Team
 * @version 1.0
 */
public class RateLimitExceededException extends RuntimeException {

    public RateLimitExceededException(String message) {
        super(message);
    }

    public RateLimitExceededException(String message, Throwable cause) {
        super(message, cause);
    }
}

