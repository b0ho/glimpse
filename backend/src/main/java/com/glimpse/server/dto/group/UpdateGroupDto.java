package com.glimpse.server.dto.group;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 그룹 업데이트 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateGroupDto {

    @Size(min = 2, max = 50, message = "그룹 이름은 2-50자 사이여야 합니다")
    private String name;

    @Size(max = 500, message = "설명은 500자 이내로 작성해주세요")
    private String description;

    private String profileImage;

    private String coverImage;

    private Boolean verificationRequired;

    private String verificationMethod;

    @Min(value = 2, message = "최소 인원은 2명 이상이어야 합니다")
    @Max(value = 10000, message = "최대 인원은 10,000명을 초과할 수 없습니다")
    private Integer maxMembers;

    private Boolean isPublic;

    private String location;

    private List<String> tags;
}
