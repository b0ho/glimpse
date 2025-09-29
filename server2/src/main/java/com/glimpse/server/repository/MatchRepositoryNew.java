package com.glimpse.server.repository;

import com.glimpse.server.entity.Match;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MatchRepositoryNew extends JpaRepository<Match, String> {
    
    // JPA 기본 쿼리
    Optional<Match> findByUser1IdAndUser2Id(String user1Id, String user2Id);
    
    // Native Query - 사용자의 모든 매치 조회 (양방향)
    @Query(value = """
        SELECT m.*, 
               CASE 
                 WHEN m.user1_id = :userId THEN u2.nickname
                 ELSE u1.nickname
               END as matched_user_nickname,
               CASE 
                 WHEN m.user1_id = :userId THEN u2.profile_image
                 ELSE u1.profile_image
               END as matched_user_image,
               (SELECT COUNT(*) FROM "ChatMessage" cm 
                WHERE cm.match_id = m.id 
                  AND cm.is_read = false 
                  AND cm.sender_id != :userId) as unread_count,
               (SELECT cm.content FROM "ChatMessage" cm 
                WHERE cm.match_id = m.id 
                ORDER BY cm.created_at DESC 
                LIMIT 1) as last_message,
               (SELECT cm.created_at FROM "ChatMessage" cm 
                WHERE cm.match_id = m.id 
                ORDER BY cm.created_at DESC 
                LIMIT 1) as last_message_time
        FROM "Match" m
        JOIN "User" u1 ON m.user1_id = u1.id
        JOIN "User" u2 ON m.user2_id = u2.id
        WHERE (m.user1_id = :userId OR m.user2_id = :userId)
          AND m.status = 'ACTIVE'
        ORDER BY last_message_time DESC NULLS LAST
        """, nativeQuery = true)
    List<Object[]> findUserMatchesWithDetails(@Param("userId") String userId);
    
    // Native Query - 매치 통계
    @Query(value = """
        SELECT 
            COUNT(DISTINCT m.id) as total_matches,
            COUNT(DISTINCT CASE WHEN m.created_at > :since THEN m.id END) as recent_matches,
            COUNT(DISTINCT CASE WHEN cm.id IS NOT NULL THEN m.id END) as active_chats,
            AVG(CASE WHEN m.created_at > :since 
                THEN EXTRACT(EPOCH FROM (NOW() - m.created_at))/3600 
                END) as avg_match_age_hours
        FROM "Match" m
        LEFT JOIN "ChatMessage" cm ON m.id = cm.match_id
        WHERE (m.user1_id = :userId OR m.user2_id = :userId)
          AND m.status = 'ACTIVE'
        """, nativeQuery = true)
    Object getMatchStatistics(@Param("userId") String userId, 
                             @Param("since") LocalDateTime since);
    
    // Native Query - 상호 좋아요로 매치 생성 가능한 쌍 찾기
    @Query(value = """
        SELECT ul1.sender_id, ul1.receiver_id
        FROM "UserLike" ul1
        JOIN "UserLike" ul2 ON ul1.sender_id = ul2.receiver_id 
                            AND ul1.receiver_id = ul2.sender_id
        LEFT JOIN "Match" m ON (m.user1_id = ul1.sender_id AND m.user2_id = ul1.receiver_id)
                             OR (m.user1_id = ul1.receiver_id AND m.user2_id = ul1.sender_id)
        WHERE m.id IS NULL
          AND ul1.created_at > :since
          AND ul2.created_at > :since
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findPendingMutualLikes(@Param("since") LocalDateTime since, 
                                          @Param("limit") int limit);
    
    // JPA 페이징
    Page<Match> findByUser1IdOrUser2Id(String user1Id, String user2Id, Pageable pageable);
}