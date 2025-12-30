package com.glimpse.server.service;

import com.glimpse.server.dto.auth.OAuthUserInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * OAuth 서비스 구현체
 * 
 * <p>Google, Kakao, Naver OAuth API를 통해 사용자 정보를 조회합니다.</p>
 * 
 * @author Glimpse Team
 * @version 1.0
 */
@Slf4j
@Service
public class OAuthServiceImpl implements OAuthService {

    private static final String GOOGLE_USER_INFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
    private static final String KAKAO_USER_INFO_URL = "https://kapi.kakao.com/v2/user/me";
    private static final String NAVER_USER_INFO_URL = "https://openapi.naver.com/v1/nid/me";

    private final RestTemplate restTemplate;

    public OAuthServiceImpl() {
        this.restTemplate = new RestTemplate();
    }

    @Override
    public OAuthUserInfo getGoogleUserInfo(String accessToken) {
        log.info("Google 사용자 정보 조회");

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    GOOGLE_USER_INFO_URL,
                    HttpMethod.GET,
                    entity,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> data = response.getBody();
                
                return OAuthUserInfo.builder()
                        .provider("google")
                        .providerId((String) data.get("sub"))
                        .email((String) data.get("email"))
                        .name((String) data.get("name"))
                        .profileImage((String) data.get("picture"))
                        .build();
            }

            throw new RuntimeException("Google 사용자 정보 조회 실패");
        } catch (Exception e) {
            log.error("Google OAuth 오류: {}", e.getMessage());
            throw new RuntimeException("Google 인증 실패: " + e.getMessage());
        }
    }

    @Override
    public OAuthUserInfo getKakaoUserInfo(String accessToken) {
        log.info("Kakao 사용자 정보 조회");

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    KAKAO_USER_INFO_URL,
                    HttpMethod.GET,
                    entity,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> data = response.getBody();
                Map<String, Object> kakaoAccount = (Map<String, Object>) data.get("kakao_account");
                Map<String, Object> profile = kakaoAccount != null ? 
                        (Map<String, Object>) kakaoAccount.get("profile") : null;

                OAuthUserInfo.OAuthUserInfoBuilder builder = OAuthUserInfo.builder()
                        .provider("kakao")
                        .providerId(String.valueOf(data.get("id")));

                if (kakaoAccount != null) {
                    builder.email((String) kakaoAccount.get("email"));
                    builder.phoneNumber((String) kakaoAccount.get("phone_number"));
                    builder.gender((String) kakaoAccount.get("gender"));
                    builder.birthdate((String) kakaoAccount.get("birthday"));
                    builder.ageRange((String) kakaoAccount.get("age_range"));
                }

                if (profile != null) {
                    builder.name((String) profile.get("nickname"));
                    builder.profileImage((String) profile.get("profile_image_url"));
                }

                return builder.build();
            }

            throw new RuntimeException("Kakao 사용자 정보 조회 실패");
        } catch (Exception e) {
            log.error("Kakao OAuth 오류: {}", e.getMessage());
            throw new RuntimeException("Kakao 인증 실패: " + e.getMessage());
        }
    }

    @Override
    public OAuthUserInfo getNaverUserInfo(String accessToken) {
        log.info("Naver 사용자 정보 조회");

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    NAVER_USER_INFO_URL,
                    HttpMethod.GET,
                    entity,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> data = response.getBody();
                Map<String, Object> responseData = (Map<String, Object>) data.get("response");

                if (responseData != null) {
                    return OAuthUserInfo.builder()
                            .provider("naver")
                            .providerId((String) responseData.get("id"))
                            .email((String) responseData.get("email"))
                            .name((String) responseData.get("name"))
                            .profileImage((String) responseData.get("profile_image"))
                            .phoneNumber((String) responseData.get("mobile"))
                            .gender((String) responseData.get("gender"))
                            .birthdate((String) responseData.get("birthday"))
                            .ageRange((String) responseData.get("age"))
                            .build();
                }
            }

            throw new RuntimeException("Naver 사용자 정보 조회 실패");
        } catch (Exception e) {
            log.error("Naver OAuth 오류: {}", e.getMessage());
            throw new RuntimeException("Naver 인증 실패: " + e.getMessage());
        }
    }
}

