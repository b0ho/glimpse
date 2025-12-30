package com.glimpse.server.repository;

import com.glimpse.server.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Refresh Token Repository
 * 
 * @author Glimpse Team
 * @version 1.0
 */
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, String> {

    /**
     * 토큰으로 RefreshToken 조회
     */
    Optional<RefreshToken> findByToken(String token);

    /**
     * 토큰으로 유효한 RefreshToken 조회
     */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.token = :token AND rt.revoked = false AND rt.expiresAt > :now")
    Optional<RefreshToken> findValidByToken(@Param("token") String token, @Param("now") LocalDateTime now);

    /**
     * 사용자의 모든 RefreshToken 조회
     */
    List<RefreshToken> findByUserId(String userId);

    /**
     * 사용자의 유효한 RefreshToken 조회
     */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.userId = :userId AND rt.revoked = false AND rt.expiresAt > :now")
    List<RefreshToken> findValidByUserId(@Param("userId") String userId, @Param("now") LocalDateTime now);

    /**
     * 사용자의 모든 토큰 폐기
     */
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.userId = :userId")
    int revokeAllByUserId(@Param("userId") String userId);

    /**
     * 특정 토큰 폐기
     */
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.token = :token")
    int revokeByToken(@Param("token") String token);

    /**
     * 만료된 토큰 삭제
     */
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :now")
    int deleteExpiredTokens(@Param("now") LocalDateTime now);

    /**
     * 폐기된 토큰 삭제
     */
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.revoked = true")
    int deleteRevokedTokens();

    /**
     * 사용자의 토큰 수 확인
     */
    long countByUserIdAndRevokedFalse(String userId);

    /**
     * 토큰 존재 여부 확인
     */
    boolean existsByToken(String token);
}

