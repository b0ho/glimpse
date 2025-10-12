package com.glimpse.server.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

/**
 * 그룹 좋아요 엔티티
 *
 * <p>사용자가 특정 그룹에 관심을 표현하는 좋아요 기능을 관리합니다.
 * 사용자는 관심 있는 그룹에 좋아요를 눌러 해당 그룹을 북마크하거나
 * 나중에 쉽게 찾을 수 있도록 할 수 있습니다.</p>
 *
 * <p>주요 관계:</p>
 * <ul>
 *   <li>@ManyToOne - Group: 좋아요 대상 그룹 (LAZY 로딩, 필수)</li>
 *   <li>@ManyToOne - User: 좋아요를 누른 사용자 (LAZY 로딩, 필수)</li>
 * </ul>
 *
 * <p>주요 기능:</p>
 * <ul>
 *   <li>그룹 관심 표시 (좋아요/북마크)</li>
 *   <li>사용자의 관심 그룹 목록 관리</li>
 *   <li>그룹별 좋아요 수 집계</li>
 *   <li>인기 그룹 순위 산출 기준</li>
 *   <li>추천 알고리즘 데이터 소스</li>
 * </ul>
 *
 * <p>비즈니스 규칙:</p>
 * <ul>
 *   <li>한 사용자는 같은 그룹에 중복 좋아요 불가 (unique constraint 필요)</li>
 *   <li>좋아요는 삭제(취소) 가능</li>
 *   <li>좋아요 생성 시간(createdAt)을 통한 시계열 분석 가능</li>
 *   <li>그룹 멤버가 아니어도 좋아요 가능</li>
 * </ul>
 *
 * <p>사용 예시:</p>
 * <pre>{@code
 * // 그룹 좋아요 생성
 * GroupLike like = GroupLike.builder()
 *     .group(group)
 *     .user(user)
 *     .build();
 * groupLikeRepository.save(like);
 *
 * // 그룹의 좋아요 수 조회
 * long likeCount = groupLikeRepository.countByGroup(group);
 *
 * // 사용자가 좋아요한 그룹 목록
 * List<Group> likedGroups = groupLikeRepository.findByUser(user)
 *     .stream()
 *     .map(GroupLike::getGroup)
 *     .collect(Collectors.toList());
 * }</pre>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Entity
@Table(name = "GroupLike")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupLike extends BaseEntity {

    /**
     * 그룹 좋아요 고유 식별자
     * <p>CUID 생성 전략을 사용하여 충돌 없는 고유한 ID를 자동 생성합니다.
     * CUID는 분산 시스템에서도 안전하게 사용할 수 있는 정렬 가능한 고유 식별자입니다.</p>
     */
    @Id
    @GeneratedValue(generator = "cuid")
    @GenericGenerator(name = "cuid", strategy = "com.glimpse.server.util.CuidGenerator")
    @Column(name = "id")
    private String id;

    /**
     * 좋아요 대상 그룹
     * <p>사용자가 좋아요를 누른 그룹을 나타냅니다.
     * LAZY 로딩을 사용하여 좋아요 정보 조회 시 그룹 정보는 필요할 때만 로드됩니다.</p>
     *
     * <p>특징:</p>
     * <ul>
     *   <li>필수값: 모든 좋아요는 반드시 그룹과 연결되어야 함</li>
     *   <li>LAZY 로딩: 성능 최적화를 위한 지연 로딩</li>
     *   <li>CASCADE 없음: 그룹 삭제 시 좋아요는 CASCADE DELETE 또는 별도 처리 필요</li>
     *   <li>인덱스 권장: 그룹별 좋아요 수 집계 쿼리 최적화</li>
     * </ul>
     *
     * <p>사용 시나리오:</p>
     * <ul>
     *   <li>그룹의 인기도 측정</li>
     *   <li>추천 알고리즘 입력 데이터</li>
     *   <li>트렌딩 그룹 선정</li>
     * </ul>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    /**
     * 좋아요를 누른 사용자
     * <p>그룹에 좋아요를 표시한 사용자입니다.
     * LAZY 로딩을 사용하여 필요 시에만 사용자 정보를 로드합니다.</p>
     *
     * <p>특징:</p>
     * <ul>
     *   <li>필수값: 모든 좋아요는 반드시 사용자와 연결되어야 함</li>
     *   <li>LAZY 로딩: 성능 최적화를 위한 지연 로딩</li>
     *   <li>CASCADE 없음: 사용자 삭제 시 좋아요 처리 정책 필요</li>
     *   <li>인덱스 권장: 사용자별 좋아요 그룹 조회 최적화</li>
     * </ul>
     *
     * <p>사용 시나리오:</p>
     * <ul>
     *   <li>사용자의 관심사 분석</li>
     *   <li>"내가 좋아하는 그룹" 목록</li>
     *   <li>개인화 추천 시스템</li>
     * </ul>
     *
     * <p>데이터 정합성:</p>
     * <ul>
     *   <li>복합 유니크 제약: (user_id, group_id) 조합은 유니크해야 함</li>
     *   <li>중복 좋아요 방지를 위한 DB 제약조건 또는 애플리케이션 레벨 검증 필요</li>
     * </ul>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}