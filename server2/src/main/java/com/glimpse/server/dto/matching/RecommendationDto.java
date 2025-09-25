package com.glimpse.server.dto.matching;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationDto {
    private String userId;
    private String nickname;
    private Integer age;
    private String profileImage;
    private String bio;
    private Double matchScore;
    private String groupId;
    private String mbti;
    private String location;
}