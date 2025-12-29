package com.glimpse.server.service;

import com.glimpse.server.dto.interest.InterestMatchDto;
import com.glimpse.server.dto.interest.InterestSearchDto;
import com.glimpse.server.dto.interest.MyInterestStatusDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Interest Service
 *
 * <p>관심 표시 및 매칭 관련 비즈니스 로직을 처리하는 서비스입니다.</p>
 */
@Slf4j
@Service
public class InterestService {

    /**
     * 활성화된 관심 검색 목록 조회
     *
     * @param userId 사용자 ID
     * @return 관심 검색 목록
     */
    public List<InterestSearchDto> getActiveSearches(String userId) {
        log.info("Getting active searches for user: {}", userId);

        // 샘플 데이터 반환 (실제로는 DB에서 조회)
        List<InterestSearchDto> searches = new ArrayList<>();

        searches.add(InterestSearchDto.builder()
                .id("search-1")
                .userId("user-2")
                .nickname("김서강")
                .profileImage("https://i.pravatar.cc/150?img=1")
                .groupId("group-1")
                .groupName("서강대학교")
                .description("운동 좋아하는 사람 찾아요")
                .isActive(true)
                .expiresAt(LocalDateTime.now().plusDays(1))
                .createdAt(LocalDateTime.now().minusHours(2))
                .updatedAt(LocalDateTime.now().minusHours(2))
                .build());

        searches.add(InterestSearchDto.builder()
                .id("search-2")
                .userId("user-3")
                .nickname("이연대")
                .profileImage("https://i.pravatar.cc/150?img=2")
                .groupId("group-2")
                .groupName("삼성전자")
                .description("카페 투어 같이 할 사람")
                .isActive(true)
                .expiresAt(LocalDateTime.now().plusDays(2))
                .createdAt(LocalDateTime.now().minusHours(5))
                .updatedAt(LocalDateTime.now().minusHours(5))
                .build());

        searches.add(InterestSearchDto.builder()
                .id("search-3")
                .userId("user-4")
                .nickname("박고려")
                .profileImage("https://i.pravatar.cc/150?img=3")
                .groupId("group-3")
                .groupName("독서 모임")
                .description("같은 책 읽고 이야기 나눠요")
                .isActive(true)
                .expiresAt(LocalDateTime.now().plusDays(3))
                .createdAt(LocalDateTime.now().minusDays(1))
                .updatedAt(LocalDateTime.now().minusDays(1))
                .build());

        return searches;
    }

    /**
     * 매칭된 목록 조회
     *
     * @param userId 사용자 ID
     * @return 매칭 목록
     */
    public List<InterestMatchDto> getMatches(String userId) {
        log.info("Getting matches for user: {}", userId);

        // 샘플 데이터 반환 (실제로는 DB에서 조회)
        List<InterestMatchDto> matches = new ArrayList<>();

        matches.add(InterestMatchDto.builder()
                .id("match-1")
                .userId(userId)
                .matchedUserId("user-5")
                .matchedUserNickname("최한양")
                .matchedUserProfileImage("https://i.pravatar.cc/150?img=5")
                .groupId("group-1")
                .groupName("서강대학교")
                .isRevealed(true)
                .matchedAt(LocalDateTime.now().minusDays(1))
                .createdAt(LocalDateTime.now().minusDays(1))
                .build());

        matches.add(InterestMatchDto.builder()
                .id("match-2")
                .userId(userId)
                .matchedUserId("user-6")
                .matchedUserNickname("정이대")
                .matchedUserProfileImage("https://i.pravatar.cc/150?img=6")
                .groupId("group-4")
                .groupName("카카오")
                .isRevealed(false)
                .matchedAt(LocalDateTime.now().minusHours(3))
                .createdAt(LocalDateTime.now().minusHours(3))
                .build());

        return matches;
    }

    /**
     * 내 관심 상태 조회
     *
     * @param userId 사용자 ID
     * @return 관심 상태
     */
    public MyInterestStatusDto getMyStatus(String userId) {
        log.info("Getting interest status for user: {}", userId);

        // 샘플 데이터 반환 (실제로는 DB에서 조회 및 계산)
        return MyInterestStatusDto.builder()
                .userId(userId)
                .remainingSearches(5)
                .todaySearchCount(3)
                .totalMatches(12)
                .unrevealedMatches(2)
                .isPremium(false)
                .hasActiveSearch(true)
                .build();
    }
}
