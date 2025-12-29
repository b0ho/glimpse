package com.glimpse.server.dto.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 공통 API 응답 포맷
 * NestJS 서버와 동일한 응답 구조 유지
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    
    @Builder.Default
    private boolean success = true;
    
    private String message;
    
    private T data;
    
    private ErrorDetails error;
    
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
    
    // 성공 응답
    @SuppressWarnings("unchecked")
    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setData(data);
        response.setTimestamp(LocalDateTime.now());
        return response;
    }
    
    @SuppressWarnings("unchecked")
    public static <T> ApiResponse<T> success(T data, String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setMessage(message);
        response.setData(data);
        response.setTimestamp(LocalDateTime.now());
        return response;
    }
    
    // 실패 응답
    @SuppressWarnings("unchecked")
    public static <T> ApiResponse<T> error(String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setSuccess(false);
        response.setMessage(message);
        response.setTimestamp(LocalDateTime.now());
        return response;
    }
    
    @SuppressWarnings("unchecked")
    public static <T> ApiResponse<T> error(String message, ErrorDetails errorDetails) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setSuccess(false);
        response.setMessage(message);
        response.setError(errorDetails);
        response.setTimestamp(LocalDateTime.now());
        return response;
    }
    
    /**
     * 에러 상세 정보
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ErrorDetails {
        private String code;
        private String field;
        private Object rejectedValue;
        private String detail;
    }
}