package com.glimpse.server.dto.auth;

import lombok.*;

/**
 * OAuth 사용자 정보 DTO
 * 
 * <p>소셜 로그인 제공자에서 받아온 사용자 정보를 담습니다.</p>
 * 
 * @author Glimpse Team
 * @version 1.0
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OAuthUserInfo {

    /**
     * OAuth 제공자 (google, kakao, naver)
     */
    private String provider;

    /**
     * 제공자별 고유 ID
     */
    private String providerId;

    /**
     * 이메일 (선택)
     */
    private String email;

    /**
     * 이름/닉네임
     */
    private String name;

    /**
     * 프로필 이미지 URL
     */
    private String profileImage;

    /**
     * 전화번호 (선택, Kakao에서 제공)
     */
    private String phoneNumber;

    /**
     * 성별 (선택)
     */
    private String gender;

    /**
     * 생년월일 (선택, YYYYMMDD)
     */
    private String birthdate;

    /**
     * 연령대 (선택)
     */
    private String ageRange;
}

