package com.glimpse.server.dto.interest;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * My Interest Status DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MyInterestStatusDto {
    private String userId;
    private Integer remainingSearches;
    private Integer todaySearchCount;
    private Integer totalMatches;
    private Integer unrevealedMatches;
    private Boolean isPremium;
    private Boolean hasActiveSearch;
}
