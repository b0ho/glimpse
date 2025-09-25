package com.glimpse.server.dto.group;

import com.glimpse.server.entity.enums.GroupCategory;
import com.glimpse.server.entity.enums.GroupType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 그룹 생성 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateGroupDto {
    
    @NotBlank(message = "그룹 이름은 필수입니다")
    @Size(min = 2, max = 50, message = "그룹 이름은 2-50자 사이여야 합니다")
    private String name;
    
    @Size(max = 500, message = "설명은 500자 이내로 작성해주세요")
    private String description;
    
    @NotNull(message = "그룹 타입은 필수입니다")
    private GroupType type;
    
    private GroupCategory category;
    
    private String profileImage;
    
    private String coverImage;
    
    private Boolean verificationRequired;
    
    private String verificationMethod;
    
    @Min(value = 2, message = "최소 인원은 2명 이상이어야 합니다")
    @Max(value = 10000, message = "최대 인원은 10,000명을 초과할 수 없습니다")
    private Integer maxMembers;
    
    private Boolean isPublic;
    
    // 위치 기반 그룹용
    private String location;
    
    @DecimalMin(value = "-90.0", message = "위도는 -90 이상이어야 합니다")
    @DecimalMax(value = "90.0", message = "위도는 90 이하여야 합니다")
    private Double latitude;
    
    @DecimalMin(value = "-180.0", message = "경도는 -180 이상이어야 합니다")
    @DecimalMax(value = "180.0", message = "경도는 180 이하여야 합니다")
    private Double longitude;
    
    @Min(value = 0, message = "반경은 0 이상이어야 합니다")
    @Max(value = 100, message = "반경은 100km를 초과할 수 없습니다")
    private Double radius;
    
    private List<String> tags;
}