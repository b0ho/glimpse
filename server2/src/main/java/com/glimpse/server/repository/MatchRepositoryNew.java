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

/**
 * Match 엔티티 Repository 인터페이스
 *
 * <p>매칭된 사용자 쌍의 정보를 관리하는 Repository입니다.
 * JPA 기본 쿼리와 Native Query를 조합하여 복잡한 매칭 조회와
 * 채팅 정보, 통계 데이터를 효율적으로 처리합니다.</p>
 *
 * <p>주요 기능:</p>
 * <ul>
 *   <li>사용자의 매칭 목록 조회 (채팅 정보 포함)</li>
 *   <li>매칭 통계 계산 (활성 매칭, 평균 매칭 유지 시간 등)</li>
 *   <li>상호 좋아요 기반 매칭 후보 탐색</li>
 *   <li>페이징 지원 매칭 조회</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Repository
public interface MatchRepositoryNew extends JpaRepository<Match, String> {
    
    /**
     * 두 사용자 ID로 매칭 조회
     *
     * @param user1Id 첫 번째 사용자 ID
     * @param user2Id 두 번째 사용자 ID
     * @return 매칭 정보 (존재하지 않으면 Empty)
     */
    Optional<Match> findByUser1IdAndUser2Id(String user1Id, String user2Id);
    
    /**
     * 사용자의 모든 활성 매칭을 상세 정보와 함께 조회
     *
     * <p>Native Query를 사용하여 매칭 정보와 함께 다음 데이터를 포함합니다:</p>
     * <ul>
     *   <li>상대방 닉네임 및 프로필 이미지</li>
     *   <li>읽지 않은 메시지 수</li>
     *   <li>마지막 메시지 내용 및 전송 시간</li>
     * </ul>
     *
     * @param userId 조회할 사용자 ID
     * @return 매칭 정보 배열 리스트 (최신 메시지 순 정렬)
     */
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
    
    /**
     * 사용자의 매칭 통계 정보 조회
     *
     * <p>다음 통계 정보를 계산합니다:</p>
     * <ul>
     *   <li>전체 매칭 수</li>
     *   <li>최근 매칭 수 (since 이후)</li>
     *   <li>활성 채팅 수 (메시지가 있는 매칭)</li>
     *   <li>평균 매칭 유지 시간 (시간 단위)</li>
     * </ul>
     *
     * @param userId 통계를 조회할 사용자 ID
     * @param since 최근 매칭 계산 기준 시간
     * @return 통계 데이터 객체
     */
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
    
    /**
     * 상호 좋아요가 있지만 아직 매칭되지 않은 사용자 쌍 조회
     *
     * <p>양방향으로 좋아요를 보낸 사용자 쌍을 찾아 자동 매칭 생성에 사용합니다.
     * 이미 매칭된 쌍은 제외됩니다.</p>
     *
     * @param since 조회 기준 시간 (이후에 생성된 좋아요만 고려)
     * @param limit 조회할 최대 쌍 개수
     * @return 사용자 ID 쌍 배열 리스트
     */
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
    
    /**
     * 사용자의 매칭 목록을 페이징하여 조회
     *
     * @param user1Id 첫 번째 사용자 ID로 검색
     * @param user2Id 두 번째 사용자 ID로 검색 (OR 조건)
     * @param pageable 페이징 정보 (페이지 번호, 크기, 정렬)
     * @return 페이징된 매칭 결과
     */
    Page<Match> findByUser1IdOrUser2Id(String user1Id, String user2Id, Pageable pageable);
}