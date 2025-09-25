package com.glimpse.server.repository;

import com.glimpse.server.entity.Match;
import com.glimpse.server.entity.enums.MatchStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Match Repository
 */
@Repository
public interface MatchRepository extends JpaRepository<Match, String> {
    
    @Query("SELECT m FROM Match m WHERE (m.user1.id = :userId OR m.user2.id = :userId) AND m.status = :status")
    List<Match> findByUserIdAndStatus(@Param("userId") String userId, @Param("status") MatchStatus status);
    
    @Query("SELECT m FROM Match m WHERE (m.user1.id = :userId OR m.user2.id = :userId) AND m.status = 'MATCHED' AND m.unmatchedAt IS NULL")
    Page<Match> findActiveMatchesByUserId(@Param("userId") String userId, Pageable pageable);
    
    @Query("SELECT m FROM Match m WHERE " +
           "((m.user1.id = :user1Id AND m.user2.id = :user2Id) OR " +
           "(m.user1.id = :user2Id AND m.user2.id = :user1Id)) AND " +
           "m.status = 'MATCHED'")
    Optional<Match> findMatchBetweenUsers(@Param("user1Id") String user1Id, @Param("user2Id") String user2Id);
    
    @Query("SELECT m FROM Match m WHERE m.group.id = :groupId AND m.status = 'MATCHED'")
    List<Match> findByGroupId(@Param("groupId") String groupId);
    
    @Query("SELECT COUNT(m) FROM Match m WHERE (m.user1.id = :userId OR m.user2.id = :userId) AND m.status = 'MATCHED'")
    long countActiveMatchesByUserId(@Param("userId") String userId);
    
    @Query("SELECT m FROM Match m WHERE m.status = 'MATCHED' AND m.matchedAt > :since")
    List<Match> findRecentMatches(@Param("since") LocalDateTime since);
    
    @Query("SELECT m FROM Match m WHERE " +
           "(m.user1.id = :userId OR m.user2.id = :userId) AND " +
           "m.status = 'MATCHED' AND " +
           "(m.unreadCount1 > 0 OR m.unreadCount2 > 0)")
    List<Match> findMatchesWithUnreadMessages(@Param("userId") String userId);
    
    @Query("SELECT m FROM Match m WHERE " +
           "m.verificationExpiresAt IS NOT NULL AND " +
           "m.verificationExpiresAt < :now AND " +
           "m.verifiedAt IS NULL")
    List<Match> findExpiredVerifications(@Param("now") LocalDateTime now);
    
    boolean existsByUser1IdAndUser2Id(String user1Id, String user2Id);
}