package com.glimpse.server.entity;

import com.glimpse.server.entity.enums.Gender;
import com.glimpse.server.entity.enums.PremiumLevel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.*;

/**
 * User 엔티티
 *
 * <p>Glimpse 데이팅 앱의 사용자를 나타내는 핵심 엔티티입니다.
 * 익명 매칭 시스템의 기반이 되며, 프리미엄 구독, 그룹 가입, 매칭 등 모든 서비스의 주체입니다.</p>
 *
 * <p>주요 관계:</p>
 * <ul>
 *   <li>@OneToMany Match: 보낸/받은 매칭 관계 (양방향)</li>
 *   <li>@OneToMany UserLike: 보낸/받은 좋아요 (양방향)</li>
 *   <li>@OneToMany Group: 생성한 그룹들</li>
 *   <li>@OneToMany GroupMember: 가입한 그룹 멤버십</li>
 *   <li>@OneToMany ChatMessage: 보낸 채팅 메시지들</li>
 *   <li>@OneToMany Notification: 받은 알림들</li>
 *   <li>@OneToMany Payment: 결제 내역들</li>
 *   <li>@OneToMany Subscription: 구독 내역들</li>
 * </ul>
 *
 * <p>주요 기능:</p>
 * <ul>
 *   <li>익명 ID 기반 매칭 시스템</li>
 *   <li>프리미엄 구독 및 크레딧 관리</li>
 *   <li>프로필 정보 및 관심사 관리</li>
 *   <li>위치 기반 서비스 지원</li>
 *   <li>다양한 인증 방법 지원 (Clerk, 전화번호)</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    /**
     * 사용자 고유 식별자
     * <p>CUID 전략을 사용하여 자동 생성됩니다.</p>
     */
    @Id
    @GeneratedValue(generator = "cuid")
    @GenericGenerator(name = "cuid", strategy = "com.glimpse.server.util.CuidGenerator")
    @Column(name = "id")
    private String id;

    /**
     * Clerk 인증 시스템의 사용자 ID
     * <p>Clerk를 통한 인증 시 사용되는 외부 식별자입니다. Unique 제약조건이 있습니다.</p>
     */
    @Column(name = "clerk_id", unique = true)
    @Deprecated
    private String clerkId;

    /**
     * OAuth 고유 ID (provider_providerId 형식)
     * <p>예: google_123456789, kakao_987654321</p>
     */
    @Column(name = "oauth_id", unique = true)
    private String oauthId;

    /**
     * OAuth 제공자 (google, kakao, naver)
     */
    @Column(name = "oauth_provider", length = 20)
    private String oauthProvider;

    /**
     * 익명 매칭용 고유 ID
     * <p>매칭 전까지 사용자의 실제 정보를 숨기기 위한 익명 식별자입니다.
     * Nullable하지 않으며 Unique해야 합니다.</p>
     */
    @Column(name = "anonymous_id", unique = true, nullable = false)
    private String anonymousId;

    /**
     * 사용자 전화번호
     * <p>본인 인증 및 계정 복구에 사용됩니다. Unique 제약조건이 있습니다.</p>
     */
    @Column(name = "phone_number", unique = true, nullable = false)
    private String phoneNumber;

    /**
     * 사용자 닉네임
     * <p>매칭 성공 후 상대방에게 공개되는 이름입니다.</p>
     */
    @Column(name = "nickname")
    private String nickname;

    /**
     * 사용자 나이
     * <p>매칭 필터링 및 프로필 정보로 사용됩니다.</p>
     */
    @Column(name = "age")
    private Integer age;

    /**
     * 사용자 성별
     * <p>Gender enum 타입 (MALE, FEMALE, OTHER)을 사용합니다.</p>
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "gender")
    private Gender gender;

    /**
     * 프로필 이미지 URL
     * <p>S3 등 클라우드 스토리지에 저장된 이미지의 URL입니다.</p>
     */
    @Column(name = "profile_image")
    private String profileImage;

    /**
     * 사용자 자기소개
     * <p>TEXT 타입으로 긴 자기소개를 지원합니다.</p>
     */
    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    /**
     * 본인 인증 여부
     * <p>회사 이메일, 학생증 등을 통한 인증 완료 여부입니다. 기본값: false</p>
     */
    @Column(name = "is_verified")
    @Builder.Default
    private Boolean isVerified = false;

    /**
     * 보유 크레딧 수
     * <p>좋아요를 보내는데 사용되는 크레딧입니다. 기본값: 1</p>
     */
    @Column(name = "credits")
    @Builder.Default
    private Integer credits = 1;

    /**
     * 프리미엄 구독 여부
     * <p>프리미엄 기능 사용 가능 여부를 나타냅니다. 기본값: false</p>
     */
    @Column(name = "is_premium")
    @Builder.Default
    private Boolean isPremium = false;

    /**
     * 프리미엄 등급
     * <p>PremiumLevel enum (FREE, BASIC, PREMIUM, VIP). 기본값: FREE</p>
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "premium_level")
    @Builder.Default
    private PremiumLevel premiumLevel = PremiumLevel.FREE;

    /**
     * 프리미엄 만료 일시
     * <p>프리미엄 구독의 만료 시각입니다. 이 시각 이후에는 isPremium이 false로 변경됩니다.</p>
     */
    @Column(name = "premium_until")
    private LocalDateTime premiumUntil;

    /**
     * 마지막 활동 시각
     * <p>사용자의 마지막 앱 활동 시각입니다. 기본값: 현재 시각</p>
     */
    @Column(name = "last_active")
    @Builder.Default
    private LocalDateTime lastActive = LocalDateTime.now();

    /**
     * 마지막 온라인 시각
     * <p>사용자가 마지막으로 온라인이었던 시각입니다.</p>
     */
    @Column(name = "last_online")
    private LocalDateTime lastOnline;

    /**
     * 계정 삭제 일시
     * <p>Soft delete를 위한 필드입니다. null이면 활성 계정입니다.</p>
     */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /**
     * 계정 삭제 사유
     * <p>사용자가 계정을 삭제한 이유를 저장합니다.</p>
     */
    @Column(name = "deletion_reason")
    private String deletionReason;

    /**
     * 회사명
     * <p>회사 그룹 가입 시 사용되는 소속 회사명입니다.</p>
     */
    @Column(name = "company_name")
    private String companyName;

    /**
     * 학력 정보
     * <p>최종 학력 또는 재학 중인 학교 정보입니다.</p>
     */
    @Column(name = "education")
    private String education;

    /**
     * 거주 지역
     * <p>사용자가 설정한 거주 지역 정보입니다.</p>
     */
    @Column(name = "location")
    private String location;

    /**
     * 키 (cm)
     * <p>사용자의 키 정보입니다. 센티미터 단위입니다.</p>
     */
    @Column(name = "height")
    private Integer height;

    /**
     * MBTI 성격 유형
     * <p>16가지 MBTI 유형 중 하나 (예: ENFP, ISTJ)입니다.</p>
     */
    @Column(name = "mbti")
    private String mbti;

    /**
     * 음주 습관
     * <p>음주 빈도 및 선호도 정보입니다.</p>
     */
    @Column(name = "drinking")
    private String drinking;

    /**
     * 흡연 여부
     * <p>흡연 습관 정보입니다.</p>
     */
    @Column(name = "smoking")
    private String smoking;

    /**
     * 생년월일
     * <p>문자열 형식으로 저장된 생년월일입니다.</p>
     */
    @Column(name = "birthdate")
    private String birthdate;

    /**
     * 이메일 주소
     * <p>회사 인증 또는 연락용 이메일입니다.</p>
     */
    @Column(name = "email")
    private String email;

    /**
     * 실명
     * <p>본인 인증에 사용되는 실제 이름입니다.</p>
     */
    @Column(name = "real_name")
    private String realName;

    /**
     * 학교명
     * <p>대학교 그룹 가입 시 사용되는 학교 이름입니다.</p>
     */
    @Column(name = "school")
    private String school;

    /**
     * 전공
     * <p>대학 전공 정보입니다.</p>
     */
    @Column(name = "major")
    private String major;

    /**
     * 학과
     * <p>세부 학과 정보입니다.</p>
     */
    @Column(name = "department")
    private String department;

    /**
     * 마지막 위치 - 위도
     * <p>위치 기반 매칭을 위한 마지막 위도 정보입니다.</p>
     */
    @Column(name = "last_latitude")
    private Double lastLatitude;

    /**
     * 마지막 위치 - 경도
     * <p>위치 기반 매칭을 위한 마지막 경도 정보입니다.</p>
     */
    @Column(name = "last_longitude")
    private Double lastLongitude;

    /**
     * 위치 정보 업데이트 시각
     * <p>마지막으로 위치 정보가 업데이트된 시각입니다.</p>
     */
    @Column(name = "last_location_update_at")
    private LocalDateTime lastLocationUpdateAt;

    /**
     * 위치 공유 활성화 여부
     * <p>사용자가 위치 기반 기능 사용을 동의했는지 여부입니다. 기본값: false</p>
     */
    @Column(name = "location_sharing_enabled")
    @Builder.Default
    private Boolean locationSharingEnabled = false;

    /**
     * 개인정보 설정 (JSON)
     * <p>PostgreSQL JSONB 타입으로 저장되는 개인정보 보호 관련 설정입니다.</p>
     */
    @Column(name = "privacy_settings", columnDefinition = "jsonb")
    private String privacySettings;

    /**
     * 알림 설정 (JSON)
     * <p>PostgreSQL JSONB 타입으로 저장되는 알림 수신 설정입니다.</p>
     */
    @Column(name = "notification_settings", columnDefinition = "jsonb")
    private String notificationSettings;

    /**
     * 페르소나 프로필 (JSON)
     * <p>AI 매칭을 위한 사용자 성향 프로필입니다.</p>
     */
    @Column(name = "persona_profile", columnDefinition = "jsonb")
    private String personaProfile;

    /**
     * 페르소나 설정 (JSON)
     * <p>페르소나 기능 관련 사용자 설정입니다.</p>
     */
    @Column(name = "persona_settings", columnDefinition = "jsonb")
    private String personaSettings;

    /**
     * 게임 ID 목록 (JSON)
     * <p>사용자의 게임 플랫폼 ID들입니다.</p>
     */
    @Column(name = "game_ids", columnDefinition = "jsonb")
    private String gameIds;

    /**
     * 플랫폼 ID 목록 (JSON)
     * <p>각종 SNS 및 플랫폼 ID들입니다.</p>
     */
    @Column(name = "platform_ids", columnDefinition = "jsonb")
    private String platformIds;

    /**
     * 소셜 미디어 ID 목록 (JSON)
     * <p>소셜 미디어 계정 ID들입니다.</p>
     */
    @Column(name = "social_ids", columnDefinition = "jsonb")
    private String socialIds;

    /**
     * 아르바이트 정보 (JSON)
     * <p>사용자의 아르바이트 경력 및 관련 정보입니다.</p>
     */
    @Column(name = "part_time_job", columnDefinition = "jsonb")
    private String partTimeJob;

    /**
     * 관심사 목록
     * <p>별도 테이블(user_interests)에 저장되는 관심사 문자열 목록입니다.
     * @ElementCollection을 통해 자동으로 매핑됩니다.</p>
     */
    @ElementCollection
    @CollectionTable(name = "user_interests", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "interest")
    private List<String> interests = new ArrayList<>();

    /**
     * 가입한 그룹 ID 목록
     * <p>별도 테이블(user_groups)에 저장되는 그룹 ID 목록입니다.
     * @ElementCollection을 통해 자동으로 매핑됩니다.</p>
     */
    @ElementCollection
    @CollectionTable(name = "user_groups", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "group_id")
    private List<String> groups = new ArrayList<>();

    /**
     * 내가 보낸 매칭 요청들
     * <p>Match 엔티티의 user1 필드와 매핑됩니다.
     * CascadeType.ALL로 인해 User 삭제 시 관련 Match도 함께 삭제됩니다.</p>
     */
    @OneToMany(mappedBy = "user1", cascade = CascadeType.ALL)
    private List<Match> sentMatches = new ArrayList<>();

    /**
     * 내가 받은 매칭 요청들
     * <p>Match 엔티티의 user2 필드와 매핑됩니다.
     * CascadeType.ALL로 인해 User 삭제 시 관련 Match도 함께 삭제됩니다.</p>
     */
    @OneToMany(mappedBy = "user2", cascade = CascadeType.ALL)
    private List<Match> receivedMatches = new ArrayList<>();

    /**
     * 내가 보낸 좋아요들
     * <p>UserLike 엔티티의 sender 필드와 매핑됩니다.
     * CascadeType.ALL로 인해 User 삭제 시 관련 좋아요도 함께 삭제됩니다.</p>
     */
    @OneToMany(mappedBy = "sender", cascade = CascadeType.ALL)
    private List<UserLike> sentLikes = new ArrayList<>();

    /**
     * 내가 받은 좋아요들
     * <p>UserLike 엔티티의 receiver 필드와 매핑됩니다.
     * CascadeType.ALL로 인해 User 삭제 시 관련 좋아요도 함께 삭제됩니다.</p>
     */
    @OneToMany(mappedBy = "receiver", cascade = CascadeType.ALL)
    private List<UserLike> receivedLikes = new ArrayList<>();

    /**
     * 내가 생성한 그룹들
     * <p>Group 엔티티의 creator 필드와 매핑됩니다.
     * CascadeType.ALL로 인해 User 삭제 시 생성한 그룹도 함께 삭제됩니다.</p>
     */
    @OneToMany(mappedBy = "creator", cascade = CascadeType.ALL)
    private List<Group> createdGroups = new ArrayList<>();

    /**
     * 가입한 그룹 멤버십들
     * <p>GroupMember 엔티티의 user 필드와 매핑됩니다.
     * CascadeType.ALL로 인해 User 삭제 시 그룹 멤버십도 함께 삭제됩니다.</p>
     */
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<GroupMember> groupMemberships = new ArrayList<>();

    /**
     * 내가 보낸 채팅 메시지들
     * <p>ChatMessage 엔티티의 sender 필드와 매핑됩니다.
     * CascadeType.ALL로 인해 User 삭제 시 보낸 메시지도 함께 삭제됩니다.</p>
     */
    @OneToMany(mappedBy = "sender", cascade = CascadeType.ALL)
    private List<ChatMessage> sentMessages = new ArrayList<>();

    /**
     * 받은 알림들
     * <p>Notification 엔티티의 user 필드와 매핑됩니다.
     * CascadeType.ALL로 인해 User 삭제 시 알림도 함께 삭제됩니다.</p>
     */
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Notification> notifications = new ArrayList<>();

    /**
     * 결제 내역들
     * <p>Payment 엔티티의 user 필드와 매핑됩니다.
     * CascadeType.ALL로 인해 User 삭제 시 결제 내역도 함께 삭제됩니다.</p>
     */
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Payment> payments = new ArrayList<>();

    /**
     * 구독 내역들
     * <p>Subscription 엔티티의 user 필드와 매핑됩니다.
     * CascadeType.ALL로 인해 User 삭제 시 구독 내역도 함께 삭제됩니다.</p>
     */
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Subscription> subscriptions = new ArrayList<>();

    /**
     * 계정이 활성 상태인지 확인합니다.
     *
     * <p>deletedAt이 null이면 활성 계정으로 간주합니다.</p>
     *
     * @return 활성 계정이면 true, 삭제된 계정이면 false
     */
    public boolean isActive() {
        return deletedAt == null;
    }

    /**
     * 프리미엄 구독이 유효한지 확인합니다.
     *
     * <p>isPremium이 true이고 premiumUntil이 현재 시각 이후인 경우 유효합니다.</p>
     *
     * @return 프리미엄 구독이 유효하면 true, 그렇지 않으면 false
     */
    public boolean hasPremium() {
        return isPremium && premiumUntil != null && premiumUntil.isAfter(LocalDateTime.now());
    }

    /**
     * 사용자의 마지막 활동 시각을 현재 시각으로 업데이트합니다.
     *
     * <p>lastActive와 lastOnline을 모두 현재 시각으로 설정합니다.</p>
     */
    public void updateLastActive() {
        this.lastActive = LocalDateTime.now();
        this.lastOnline = LocalDateTime.now();
    }
}