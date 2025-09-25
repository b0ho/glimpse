package com.glimpse.server.exception;

/**
 * 중복된 리소스가 있을 때 발생하는 예외
 */
public class DuplicateResourceException extends RuntimeException {
    
    public DuplicateResourceException(String message) {
        super(message);
    }
    
    public DuplicateResourceException(String message, Throwable cause) {
        super(message, cause);
    }
}