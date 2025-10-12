package com.glimpse.server.entity;

import com.glimpse.server.entity.enums.GroupType;
import com.glimpse.server.entity.enums.GroupCategory;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Group 엔티티
 *
 * <p>사용자들이 속할 수 있는 그룹을 나타내는 엔티티입니다.
 * 회사, 대학교, 취미 모임, 위치 기반 그룹 등 다양한 유형의 커뮤니티를 표현합니다.</p>
 *
 * <p>주요 관계:</p>
 * <ul>
 *   <li>@ManyToOne User (creator): 그룹을 생성한 사용자 (LAZY 로딩)</li>
 *   <li>@OneToMany GroupMember: 그룹에 속한 멤버들 (CASCADE ALL)</li>
 *   <li>@OneToMany GroupLike: 그룹에 대한 좋아요들 (CASCADE ALL)</li>
 *   <li>@OneToMany GroupInvite: 그룹 초대 내역들 (CASCADE ALL)</li>
 * </ul>
 *
 * <p>주요 기능:</p>
 * <ul>
 *   <li>4가지 그룹 유형 지원 (OFFICIAL, CREATED, INSTANCE, LOCATION)</li>
 *   <li>그룹 카테고리 관리 (COMPANY, UNIVERSITY, HOBBY 등)</li>
 *   <li>본인 인증 시스템 (이메일 도메인, 학생증 등)</li>
 *   <li>위치 기반 그룹 (위도, 경도, 반경)</li>
 *   <li>초대 코드 시스템</li>
 *   <li>그룹 통계 (멤버 수, 좋아요, 매칭, 활성 사용자)</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Entity
@Table(name = "Group")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Group extends BaseEntity {

    /**
     * 그룹 고유 식별자
     * <p>CUID 전략을 사용하여 자동 생성됩니다.</p>
     */
    @Id
    @GeneratedValue(generator = "cuid")
    @GenericGenerator(name = "cuid", strategy = "com.glimpse.server.util.CuidGenerator")
    @Column(name = "id")
    private String id;

    /**
     * 그룹 이름
     * <p>그룹의 고유한 명칭입니다. Nullable하지 않습니다.</p>
     */
    @Column(name = "name", nullable = false)
    private String name;

    /**
     * 그룹 설명
     * <p>그룹에 대한 상세 설명입니다. TEXT 타입으로 긴 내용을 지원합니다.</p>
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * 그룹 유형
     * <p>GroupType enum (OFFICIAL, CREATED, INSTANCE, LOCATION). Nullable하지 않습니다.</p>
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private GroupType type;

    /**
     * 그룹 카테고리
     * <p>GroupCategory enum (COMPANY, UNIVERSITY, HOBBY 등)으로 그룹의 성격을 분류합니다.</p>
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "category")
    private GroupCategory category;

    /**
     * 프로필 이미지 URL
     * <p>그룹의 대표 이미지입니다.</p>
     */
    @Column(name = "profile_image")
    private String profileImage;

    /**
     * 커버 이미지 URL
     * <p>그룹 페이지 상단에 표시되는 배경 이미지입니다.</p>
     */
    @Column(name = "cover_image")
    private String coverImage;

    /**
     * 본인 인증 필수 여부
     * <p>그룹 가입 시 본인 인증이 필요한지 여부입니다. 기본값: false</p>
     */
    @Column(name = "verification_required")
    @Builder.Default
    private Boolean verificationRequired = false;

    /**
     * 본인 인증 방법
     * <p>어떤 방법으로 본인 인증을 하는지 설명합니다 (예: 회사 이메일, 학생증 등).</p>
     */
    @Column(name = "verification_method")
    private String verificationMethod;

    /**
     * 현재 멤버 수
     * <p>그룹에 가입한 활성 멤버의 수입니다. 기본값: 0</p>
     */
    @Column(name = "member_count")
    @Builder.Default
    private Integer memberCount = 0;

    /**
     * 최대 멤버 수
     * <p>그룹에 가입할 수 있는 최대 인원입니다. null이면 제한 없음입니다.</p>
     */
    @Column(name = "max_members")
    private Integer maxMembers;

    /**
     * 공개 그룹 여부
     * <p>누구나 검색하고 가입 요청할 수 있는 공개 그룹인지 여부입니다. 기본값: true</p>
     */
    @Column(name = "is_public")
    @Builder.Default
    private Boolean isPublic = true;

    /**
     * 활성 그룹 여부
     * <p>그룹이 현재 활성화되어 있는지 여부입니다. 기본값: true</p>
     */
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    /**
     * 공식 그룹 여부
     * <p>Glimpse 운영팀이 인증한 공식 그룹인지 여부입니다. 기본값: false</p>
     */
    @Column(name = "is_official")
    @Builder.Default
    private Boolean isOfficial = false;

    /**
     * 위치 이름
     * <p>그룹의 지리적 위치를 나타내는 주소 또는 장소명입니다.</p>
     */
    @Column(name = "location")
    private String location;

    /**
     * 위도
     * <p>위치 기반 그룹의 중심 위도입니다.</p>
     */
    @Column(name = "latitude")
    private Double latitude;

    /**
     * 경도
     * <p>위치 기반 그룹의 중심 경도입니다.</p>
     */
    @Column(name = "longitude")
    private Double longitude;

    /**
     * 반경 (미터)
     * <p>위치 기반 그룹의 유효 반경입니다. 이 범위 내의 사용자만 가입 가능합니다.</p>
     */
    @Column(name = "radius")
    private Double radius;

    /**
     * 초대 코드
     * <p>비공개 그룹 가입을 위한 고유한 초대 코드입니다. Unique 제약조건이 있습니다.</p>
     */
    @Column(name = "invite_code", unique = true)
    private String inviteCode;

    /**
     * 초대 코드 만료 일시
     * <p>초대 코드의 유효 기간입니다.</p>
     */
    @Column(name = "invite_code_expires_at")
    private LocalDateTime inviteCodeExpiresAt;

    /**
     * 그룹 설정 (JSON)
     * <p>PostgreSQL JSONB 타입으로 저장되는 그룹 설정 정보입니다.</p>
     */
    @Column(name = "settings", columnDefinition = "jsonb")
    private String settings;

    /**
     * 그룹 규칙 (JSON)
     * <p>PostgreSQL JSONB 타입으로 저장되는 그룹 규칙 및 가이드라인입니다.</p>
     */
    @Column(name = "rules", columnDefinition = "jsonb")
    private String rules;

    /**
     * 메타데이터 (JSON)
     * <p>PostgreSQL JSONB 타입으로 저장되는 추가 정보입니다.</p>
     */
    @Column(name = "metadata", columnDefinition = "jsonb")
    private String metadata;

    /**
     * 총 좋아요 수
     * <p>이 그룹 내에서 발생한 총 좋아요 수입니다. 기본값: 0</p>
     */
    @Column(name = "total_likes")
    @Builder.Default
    private Integer totalLikes = 0;

    /**
     * 총 매칭 수
     * <p>이 그룹 내에서 성사된 총 매칭 수입니다. 기본값: 0</p>
     */
    @Column(name = "total_matches")
    @Builder.Default
    private Integer totalMatches = 0;

    /**
     * 일일 활성 사용자 수
     * <p>최근 24시간 내 활동한 사용자 수입니다. 기본값: 0</p>
     */
    @Column(name = "daily_active_users")
    @Builder.Default
    private Integer dailyActiveUsers = 0;

    /**
     * 주간 활성 사용자 수
     * <p>최근 7일 내 활동한 사용자 수입니다. 기본값: 0</p>
     */
    @Column(name = "weekly_active_users")
    @Builder.Default
    private Integer weeklyActiveUsers = 0;

    /**
     * 그룹 생성자
     * <p>이 그룹을 생성한 사용자입니다. LAZY 로딩으로 성능을 최적화합니다.</p>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", referencedColumnName = "id")
    private User creator;

    /**
     * 그룹 멤버들
     * <p>GroupMember 엔티티의 group 필드와 매핑됩니다.
     * CascadeType.ALL로 인해 Group 삭제 시 모든 멤버십도 함께 삭제됩니다.</p>
     */
    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL)
    private List<GroupMember> members = new ArrayList<>();

    /**
     * 그룹에 대한 좋아요들
     * <p>GroupLike 엔티티의 group 필드와 매핑됩니다.
     * CascadeType.ALL로 인해 Group 삭제 시 모든 좋아요도 함께 삭제됩니다.</p>
     */
    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL)
    private List<GroupLike> groupLikes = new ArrayList<>();

    /**
     * 그룹 초대 내역들
     * <p>GroupInvite 엔티티의 group 필드와 매핑됩니다.
     * CascadeType.ALL로 인해 Group 삭제 시 모든 초대도 함께 삭제됩니다.</p>
     */
    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL)
    private List<GroupInvite> invites = new ArrayList<>();

    /**
     * 그룹 태그 목록
     * <p>별도 테이블(group_tags)에 저장되는 태그 문자열 목록입니다.
     * @ElementCollection을 통해 자동으로 매핑됩니다.</p>
     */
    @ElementCollection
    @CollectionTable(name = "group_tags", joinColumns = @JoinColumn(name = "group_id"))
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();

    /**
     * 그룹 가입이 가능한지 확인합니다.
     *
     * <p>활성 상태이고 공개 그룹이며, 최대 인원에 도달하지 않은 경우 가입 가능합니다.</p>
     *
     * @return 가입 가능하면 true, 그렇지 않으면 false
     */
    public boolean canJoin() {
        return isActive && isPublic &&
               (maxMembers == null || memberCount < maxMembers);
    }

    /**
     * 위치 기반 그룹인지 확인합니다.
     *
     * <p>그룹 타입이 LOCATION이고 위도/경도 정보가 있는 경우 위치 기반 그룹입니다.</p>
     *
     * @return 위치 기반 그룹이면 true, 그렇지 않으면 false
     */
    public boolean isNearbyGroup() {
        return type == GroupType.LOCATION && latitude != null && longitude != null;
    }

    /**
     * 멤버 수를 1 증가시킵니다.
     *
     * <p>새로운 멤버가 그룹에 가입할 때 호출됩니다.</p>
     */
    public void incrementMemberCount() {
        this.memberCount++;
    }

    /**
     * 멤버 수를 1 감소시킵니다.
     *
     * <p>멤버가 그룹에서 탈퇴할 때 호출됩니다. 0 미만으로는 감소하지 않습니다.</p>
     */
    public void decrementMemberCount() {
        if (this.memberCount > 0) {
            this.memberCount--;
        }
    }
}
