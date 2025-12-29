package com.glimpse.server.service;

import com.glimpse.server.dto.auth.AuthResponseDto;
import com.glimpse.server.dto.auth.LoginDto;
import com.glimpse.server.dto.auth.RegisterDto;
import com.glimpse.server.dto.auth.TokenDto;

/**
 * Auth Service Interface
 *
 * <p>인증 및 권한 관련 비즈니스 로직을 처리하는 서비스입니다.</p>
 *
 * <p>주요 기능:</p>
 * <ul>
 *   <li>회원가입 및 로그인 처리</li>
 *   <li>JWT 토큰 발급 및 검증</li>
 *   <li>전화번호 인증 코드 발송 및 확인</li>
 *   <li>리프레시 토큰을 통한 액세스 토큰 갱신</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
public interface AuthService {

    /**
     * 회원가입을 처리합니다.
     *
     * @param registerDto 회원가입 정보
     * @return 인증 응답 (토큰 및 사용자 정보)
     * @throws IllegalArgumentException 이미 존재하는 전화번호이거나 인증 코드가 유효하지 않은 경우
     */
    AuthResponseDto register(RegisterDto registerDto);

    /**
     * 로그인을 처리합니다.
     *
     * @param loginDto 로그인 정보
     * @return 인증 응답 (토큰 및 사용자 정보)
     * @throws IllegalArgumentException 사용자를 찾을 수 없거나 인증 정보가 유효하지 않은 경우
     */
    AuthResponseDto login(LoginDto loginDto);

    /**
     * 리프레시 토큰으로 새로운 액세스 토큰을 발급합니다.
     *
     * @param refreshToken 리프레시 토큰
     * @return 새로운 토큰 정보
     * @throws IllegalArgumentException 리프레시 토큰이 유효하지 않은 경우
     */
    TokenDto refreshToken(String refreshToken);

    /**
     * 토큰의 유효성을 검증합니다.
     *
     * @param token JWT 토큰
     * @return 유효하면 true, 아니면 false
     */
    boolean validateToken(String token);

    /**
     * 전화번호로 인증 코드를 발송합니다.
     *
     * @param phoneNumber 전화번호
     * @throws IllegalArgumentException 전화번호 형식이 올바르지 않은 경우
     */
    void sendVerificationCode(String phoneNumber);

    /**
     * 인증 코드를 확인합니다.
     *
     * @param phoneNumber 전화번호
     * @param code 인증 코드
     * @return 인증 코드가 유효하면 true, 아니면 false
     */
    boolean verifyCode(String phoneNumber, String code);

    /**
     * 토큰에서 사용자 ID를 추출합니다.
     *
     * @param token JWT 토큰
     * @return 사용자 ID
     * @throws IllegalArgumentException 토큰이 유효하지 않은 경우
     */
    String getUserIdFromToken(String token);
}
