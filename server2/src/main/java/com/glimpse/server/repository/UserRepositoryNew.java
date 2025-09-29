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

@Repository
public interface UserRepositoryNew extends JpaRepository<User, String> {
    
    // JPA 기본 쿼리 메서드
    Optional<User> findByPhoneNumber(String phoneNumber);
    Optional<User> findByClerkId(String clerkId);
    boolean existsByPhoneNumber(String phoneNumber);
    List<User> findByIsPremiumTrue();
    
    // Native Query - 복잡한 매칭 로직
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
    
    // Native Query - 근처 사용자 찾기
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
    
    // Native Query - 그룹 기반 추천
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
    
    // JPA 업데이트 쿼리
    @Modifying
    @Query("UPDATE User u SET u.lastActive = :now WHERE u.id = :userId")
    void updateLastActive(@Param("userId") String userId, @Param("now") LocalDateTime now);
    
    @Modifying
    @Query("UPDATE User u SET u.credits = u.credits + :amount WHERE u.id = :userId")
    void addCredits(@Param("userId") String userId, @Param("amount") int amount);
    
    @Modifying
    @Query("UPDATE User u SET u.isPremium = :isPremium, u.premiumLevel = :level, u.premiumUntil = :until WHERE u.id = :userId")
    void updatePremiumStatus(@Param("userId") String userId, 
                            @Param("isPremium") boolean isPremium,
                            @Param("level") String level,
                            @Param("until") LocalDateTime until);
}