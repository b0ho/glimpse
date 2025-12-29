package com.glimpse.server.repository;

import com.glimpse.server.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * User 엔티티 Repository 인터페이스
 *
 * <p>사용자 정보를 관리하고 복잡한 매칭 알고리즘을 지원하는 Repository입니다.
 * JPA 기본 쿼리와 Native Query를 조합하여 다양한 사용자 검색 및
 * 매칭 추천 기능을 제공합니다.</p>
 *
 * <p>주요 기능:</p>
 * <ul>
 *   <li>사용자 기본 CRUD 및 인증 관련 조회</li>
 *   <li>AI 기반 매칭 후보 추천 (그룹, 관심사, 위치 기반)</li>
 *   <li>근처 사용자 검색 (GPS 기반 거리 계산)</li>
 *   <li>프리미엄 사용자 관리 및 크레딧 시스템</li>
 *   <li>사용자 활동 시간 추적</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Repository
public interface UserRepositoryNew extends JpaRepository<User, String> {

    /**
     * 전화번호로 사용자 조회
     *
     * @param phoneNumber 조회할 전화번호 (한국 형식: +821012345678)
     * @return 사용자 정보 (존재하지 않으면 Empty)
     */
    Optional<User> findByPhoneNumber(String phoneNumber);

    /**
     * Clerk ID로 사용자 조회
     *
     * @param clerkId Clerk 인증 시스템의 사용자 ID
     * @return 사용자 정보 (존재하지 않으면 Empty)
     */
    Optional<User> findByClerkId(String clerkId);

    /**
     * 전화번호 존재 여부 확인
     *
     * @param phoneNumber 확인할 전화번호
     * @return 존재하면 true, 아니면 false
     */
    boolean existsByPhoneNumber(String phoneNumber);

    /**
     * 프리미엄 사용자 목록 조회
     *
     * @return 프리미엄 구독 중인 사용자 리스트
     */
    List<User> findByIsPremiumTrue();
    
    /**
     * 현재 사용자와 매칭 가능한 잠재적 후보 조회
     *
     * <p>다음 조건을 모두 만족하는 사용자를 찾습니다:</p>
     * <ul>
     *   <li>이미 매칭되지 않은 사용자</li>
     *   <li>같은 그룹에 속한 사용자</li>
     *   <li>양방향으로 좋아요를 보낸 사용자</li>
     *   <li>삭제되지 않은 활성 사용자</li>
     * </ul>
     *
     * @param currentUserId 현재 사용자 ID
     * @param limit 조회할 최대 사용자 수
     * @return 매칭 가능한 사용자 리스트 (최근 활동순)
     */
    @Query(value = """
        SELECT DISTINCT u.* FROM "User" u
        WHERE u.id != :currentUserId
        AND u.deleted_at IS NULL
        AND NOT EXISTS (
            -- 이미 매칭된 사용자 제외
            SELECT 1 FROM "Match" m 
            WHERE (m.user1_id = :currentUserId AND m.user2_id = u.id)
               OR (m.user2_id = :currentUserId AND m.user1_id = u.id)
        )
        AND EXISTS (
            -- 같은 그룹에 속한 사용자
            SELECT 1 FROM "GroupMember" gm1
            JOIN "GroupMember" gm2 ON gm1.group_id = gm2.group_id
            WHERE gm1.user_id = :currentUserId 
              AND gm2.user_id = u.id
              AND gm1.is_active = true
              AND gm2.is_active = true
        )
        AND EXISTS (
            -- 양방향 좋아요 체크
            SELECT 1 FROM "UserLike" ul1
            JOIN "UserLike" ul2 ON ul1.receiver_id = ul2.sender_id
            WHERE ul1.sender_id = :currentUserId
              AND ul1.receiver_id = u.id
              AND ul2.sender_id = u.id
              AND ul2.receiver_id = :currentUserId
        )
        ORDER BY u.last_active DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<User> findPotentialMatches(@Param("currentUserId") String currentUserId, 
                                    @Param("limit") int limit);
    
    /**
     * GPS 기반 근처 사용자 검색
     *
     * <p>Haversine 공식을 사용하여 두 지점 간 거리를 계산하고,
     * 지정된 반경 내의 사용자를 찾습니다.</p>
     *
     * <p>조건:</p>
     * <ul>
     *   <li>위치 공유를 활성화한 사용자</li>
     *   <li>최근에 위치를 업데이트한 사용자 (since 이후)</li>
     *   <li>지정된 반경(radiusKm) 내의 사용자</li>
     * </ul>
     *
     * @param userId 현재 사용자 ID (검색 결과에서 제외)
     * @param latitude 현재 위치의 위도
     * @param longitude 현재 위치의 경도
     * @param radiusKm 검색 반경 (킬로미터)
     * @param since 위치 업데이트 기준 시간 (이후 업데이트된 사용자만)
     * @param limit 조회할 최대 사용자 수
     * @return 사용자 정보와 거리 정보 배열 리스트 (거리순 정렬)
     */
    @Query(value = """
        SELECT u.*, 
               (6371 * acos(cos(radians(:latitude)) 
                * cos(radians(u.last_latitude)) 
                * cos(radians(u.last_longitude) - radians(:longitude)) 
                + sin(radians(:latitude)) 
                * sin(radians(u.last_latitude)))) AS distance
        FROM "User" u
        WHERE u.id != :userId
          AND u.deleted_at IS NULL
          AND u.location_sharing_enabled = true
          AND u.last_latitude IS NOT NULL
          AND u.last_longitude IS NOT NULL
          AND u.last_location_update_at > :since
        HAVING distance < :radiusKm
        ORDER BY distance
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findNearbyUsers(@Param("userId") String userId,
                                   @Param("latitude") Double latitude,
                                   @Param("longitude") Double longitude,
                                   @Param("radiusKm") Double radiusKm,
                                   @Param("since") LocalDateTime since,
                                   @Param("limit") int limit);
    
    /**
     * 그룹 기반 사용자 추천
     *
     * <p>현재 사용자와 공통 그룹이 있는 사용자를 찾아 추천합니다.
     * 선호하는 성별과 나이 범위를 기준으로 필터링하며,
     * 공통 그룹이 많을수록 높은 우선순위를 부여합니다.</p>
     *
     * @param userId 현재 사용자 ID
     * @param preferredGender 선호하는 성별 (MALE, FEMALE, OTHER)
     * @param minAge 최소 나이
     * @param maxAge 최대 나이
     * @param limit 조회할 최대 사용자 수
     * @return 사용자 정보와 공통 그룹 수 배열 리스트 (공통 그룹 많은 순, 최근 활동순)
     */
    @Query(value = """
        WITH user_groups AS (
            SELECT group_id FROM "GroupMember" 
            WHERE user_id = :userId AND is_active = true
        ),
        group_users AS (
            SELECT DISTINCT gm.user_id, COUNT(*) as common_groups
            FROM "GroupMember" gm
            WHERE gm.group_id IN (SELECT group_id FROM user_groups)
              AND gm.user_id != :userId
              AND gm.is_active = true
            GROUP BY gm.user_id
        )
        SELECT u.*, gu.common_groups
        FROM "User" u
        JOIN group_users gu ON u.id = gu.user_id
        WHERE u.deleted_at IS NULL
          AND u.gender = :preferredGender
          AND u.age BETWEEN :minAge AND :maxAge
        ORDER BY gu.common_groups DESC, u.last_active DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> recommendUsersByGroups(@Param("userId") String userId,
                                          @Param("preferredGender") String preferredGender,
                                          @Param("minAge") int minAge,
                                          @Param("maxAge") int maxAge,
                                          @Param("limit") int limit);
    
    /**
     * 사용자의 마지막 활동 시간 업데이트
     *
     * @param userId 업데이트할 사용자 ID
     * @param now 현재 시간
     */
    @Modifying
    @Query("UPDATE User u SET u.lastActive = :now WHERE u.id = :userId")
    void updateLastActive(@Param("userId") String userId, @Param("now") LocalDateTime now);

    /**
     * 사용자 크레딧 추가
     *
     * <p>현재 크레딧에 지정된 양을 더합니다. (음수 전달 시 차감)</p>
     *
     * @param userId 대상 사용자 ID
     * @param amount 추가할 크레딧 양 (음수 가능)
     */
    @Modifying
    @Query("UPDATE User u SET u.credits = u.credits + :amount WHERE u.id = :userId")
    void addCredits(@Param("userId") String userId, @Param("amount") int amount);

    /**
     * 프리미엄 구독 상태 업데이트
     *
     * @param userId 대상 사용자 ID
     * @param isPremium 프리미엄 활성화 여부
     * @param level 프리미엄 레벨 (MONTHLY, YEARLY 등)
     * @param until 프리미엄 만료 시간
     */
    @Modifying
    @Query("UPDATE User u SET u.isPremium = :isPremium, u.premiumLevel = :level, u.premiumUntil = :until WHERE u.id = :userId")
    void updatePremiumStatus(@Param("userId") String userId,
                            @Param("isPremium") boolean isPremium,
                            @Param("level") String level,
                            @Param("until") LocalDateTime until);
}