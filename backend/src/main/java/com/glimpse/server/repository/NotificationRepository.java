package com.glimpse.server.repository;

import com.glimpse.server.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Notification 엔티티 Repository 인터페이스
 *
 * <p>사용자 알림 정보를 관리하는 Repository입니다.
 * 알림 목록 조회, 읽지 않은 알림 필터링, 알림 수 계산 등의 기능을 제공합니다.</p>
 *
 * <p>주요 기능:</p>
 * <ul>
 *   <li>사용자별 알림 목록 조회 (최신순 정렬)</li>
 *   <li>읽지 않은 알림 필터링</li>
 *   <li>읽지 않은 알림 수 계산</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {

    /**
     * 사용자의 모든 알림을 최신순으로 조회
     *
     * @param userId 조회할 사용자 ID
     * @return 알림 리스트 (생성 시간 내림차순)
     */
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);

    /**
     * 사용자의 읽지 않은 알림만 조회
     *
     * @param userId 조회할 사용자 ID
     * @return 읽지 않은 알림 리스트
     */
    List<Notification> findByUserIdAndIsReadFalse(String userId);

    /**
     * 사용자의 읽지 않은 알림 개수 계산
     *
     * @param userId 조회할 사용자 ID
     * @return 읽지 않은 알림 수
     */
    long countByUserIdAndIsReadFalse(String userId);
}