package com.glimpse.server.repository;

import com.glimpse.server.entity.UserLike;
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
 * UserLike Repository
 */
@Repository
public interface UserLikeRepository extends JpaRepository<UserLike, String> {
    
    boolean existsBySenderIdAndReceiverId(String senderId, String receiverId);
    
    Optional<UserLike> findBySenderIdAndReceiverId(String senderId, String receiverId);
    
    Page<UserLike> findByReceiverIdAndIsSeenFalse(String receiverId, Pageable pageable);
    
    List<UserLike> findBySenderId(String senderId);
    
    List<UserLike> findByReceiverId(String receiverId);
    
    @Query("SELECT ul FROM UserLike ul WHERE ul.receiver.id = :userId AND ul.isSeen = false")
    long countUnseenLikes(@Param("userId") String userId);
    
    @Query("SELECT ul FROM UserLike ul WHERE ul.expiresAt < :now AND ul.isMatched = false")
    List<UserLike> findExpiredLikes(@Param("now") LocalDateTime now);
    
    @Query("SELECT ul FROM UserLike ul WHERE ul.group.id = :groupId")
    List<UserLike> findByGroupId(@Param("groupId") String groupId);
}