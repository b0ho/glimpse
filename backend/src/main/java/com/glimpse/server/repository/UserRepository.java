package com.glimpse.server.repository;

import com.glimpse.server.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * User Repository
 */
@Repository
public interface UserRepository extends JpaRepository<User, String> {
    
    Optional<User> findByClerkId(String clerkId);
    
    Optional<User> findByPhoneNumber(String phoneNumber);
    
    Optional<User> findByAnonymousId(String anonymousId);
    
    Optional<User> findByEmail(String email);
    
    boolean existsByPhoneNumber(String phoneNumber);
    
    boolean existsByEmail(String email);
    
    boolean existsByNickname(String nickname);
    
    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL")
    List<User> findAllActive();
    
    @Query("SELECT u FROM User u WHERE u.isPremium = true AND u.premiumUntil > :now")
    List<User> findActivePremiumUsers(@Param("now") LocalDateTime now);
    
    @Query("SELECT u FROM User u WHERE u.lastActive > :since AND u.deletedAt IS NULL")
    List<User> findActiveUsersSince(@Param("since") LocalDateTime since);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.deletedAt IS NULL")
    long countActiveUsers();
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.isPremium = true AND u.premiumUntil > :now")
    long countPremiumUsers(@Param("now") LocalDateTime now);
}