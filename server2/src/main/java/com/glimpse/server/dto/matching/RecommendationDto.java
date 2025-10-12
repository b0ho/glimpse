package com.glimpse.server.dto.matching;

import lombok.*;

/**
 * 매칭 추천 사용자 데이터 전송 객체
 *
 * <p>AI 기반 매칭 알고리즘에 의해 추천된 사용자 정보를 전달합니다.
 * 매칭 점수, 프로필 정보, 그룹 정보 등을 포함하여 사용자에게 최적의 매칭 후보를 제시합니다.</p>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationDto {
    /** 추천 사용자 고유 식별자 */
    private String userId;

    /** 추천 사용자 닉네임 */
    private String nickname;

    /** 추천 사용자 나이 */
    private Integer age;

    /** 프로필 이미지 URL */
    private String profileImage;

    /** 자기소개 */
    private String bio;

    /** AI 매칭 점수 (0.0 ~ 1.0) */
    private Double matchScore;

    /** 공통 그룹 ID */
    private String groupId;

    /** MBTI 성격 유형 */
    private String mbti;

    /** 위치 정보 */
    private String location;
}