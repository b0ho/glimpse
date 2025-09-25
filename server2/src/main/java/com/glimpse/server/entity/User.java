package com.glimpse.server.entity;

import com.glimpse.server.entity.enums.Gender;
import com.glimpse.server.entity.enums.PremiumLevel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.*;

/**
 * 사용자 Entity
 * Prisma User 모델과 1:1 매핑
 */
@Entity
@Table(name = "User")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {
    
    @Id
    @GeneratedValue(generator = "cuid")
    @GenericGenerator(name = "cuid", strategy = "com.glimpse.server.util.CuidGenerator")
    @Column(name = "id")
    private String id;
    
    @Column(name = "clerk_id", unique = true)
    private String clerkId;
    
    @Column(name = "anonymous_id", unique = true, nullable = false)
    private String anonymousId;
    
    @Column(name = "phone_number", unique = true, nullable = false)
    private String phoneNumber;
    
    @Column(name = "nickname")
    private String nickname;
    
    @Column(name = "age")
    private Integer age;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "gender")
    private Gender gender;
    
    @Column(name = "profile_image")
    private String profileImage;
    
    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;
    
    @Column(name = "is_verified")
    @Builder.Default
    private Boolean isVerified = false;
    
    @Column(name = "credits")
    @Builder.Default
    private Integer credits = 1;
    
    @Column(name = "is_premium")
    @Builder.Default
    private Boolean isPremium = false;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "premium_level")
    @Builder.Default
    private PremiumLevel premiumLevel = PremiumLevel.FREE;
    
    @Column(name = "premium_until")
    private LocalDateTime premiumUntil;
    
    @Column(name = "last_active")
    @Builder.Default
    private LocalDateTime lastActive = LocalDateTime.now();
    
    @Column(name = "last_online")
    private LocalDateTime lastOnline;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    @Column(name = "deletion_reason")
    private String deletionReason;
    
    // 추가 필드들
    @Column(name = "company_name")
    private String companyName;
    
    @Column(name = "education")
    private String education;
    
    @Column(name = "location")
    private String location;
    
    @Column(name = "height")
    private Integer height;
    
    @Column(name = "mbti")
    private String mbti;
    
    @Column(name = "drinking")
    private String drinking;
    
    @Column(name = "smoking")
    private String smoking;
    
    @Column(name = "birthdate")
    private String birthdate;
    
    @Column(name = "email")
    private String email;
    
    @Column(name = "real_name")
    private String realName;
    
    @Column(name = "school")
    private String school;
    
    @Column(name = "major")
    private String major;
    
    @Column(name = "department")
    private String department;
    
    // 위치 정보
    @Column(name = "last_latitude")
    private Double lastLatitude;
    
    @Column(name = "last_longitude")
    private Double lastLongitude;
    
    @Column(name = "last_location_update_at")
    private LocalDateTime lastLocationUpdateAt;
    
    @Column(name = "location_sharing_enabled")
    @Builder.Default
    private Boolean locationSharingEnabled = false;
    
    // JSON 필드들 (PostgreSQL JSON 타입)
    @Column(name = "privacy_settings", columnDefinition = "jsonb")
    private String privacySettings;
    
    @Column(name = "notification_settings", columnDefinition = "jsonb")
    private String notificationSettings;
    
    @Column(name = "persona_profile", columnDefinition = "jsonb")
    private String personaProfile;
    
    @Column(name = "persona_settings", columnDefinition = "jsonb")
    private String personaSettings;
    
    @Column(name = "game_ids", columnDefinition = "jsonb")
    private String gameIds;
    
    @Column(name = "platform_ids", columnDefinition = "jsonb")
    private String platformIds;
    
    @Column(name = "social_ids", columnDefinition = "jsonb")
    private String socialIds;
    
    @Column(name = "part_time_job", columnDefinition = "jsonb")
    private String partTimeJob;
    
    // 배열 필드들
    @ElementCollection
    @CollectionTable(name = "user_interests", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "interest")
    private List<String> interests = new ArrayList<>();
    
    @ElementCollection
    @CollectionTable(name = "user_groups", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "group_id")
    private List<String> groups = new ArrayList<>();
    
    // 관계 매핑
    @OneToMany(mappedBy = "user1", cascade = CascadeType.ALL)
    private List<Match> sentMatches = new ArrayList<>();
    
    @OneToMany(mappedBy = "user2", cascade = CascadeType.ALL)
    private List<Match> receivedMatches = new ArrayList<>();
    
    @OneToMany(mappedBy = "sender", cascade = CascadeType.ALL)
    private List<UserLike> sentLikes = new ArrayList<>();
    
    @OneToMany(mappedBy = "receiver", cascade = CascadeType.ALL)
    private List<UserLike> receivedLikes = new ArrayList<>();
    
    @OneToMany(mappedBy = "creator", cascade = CascadeType.ALL)
    private List<Group> createdGroups = new ArrayList<>();
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<GroupMember> groupMemberships = new ArrayList<>();
    
    @OneToMany(mappedBy = "sender", cascade = CascadeType.ALL)
    private List<ChatMessage> sentMessages = new ArrayList<>();
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Notification> notifications = new ArrayList<>();
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Payment> payments = new ArrayList<>();
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Subscription> subscriptions = new ArrayList<>();
    
    // 헬퍼 메소드
    public boolean isActive() {
        return deletedAt == null;
    }
    
    public boolean hasPremium() {
        return isPremium && premiumUntil != null && premiumUntil.isAfter(LocalDateTime.now());
    }
    
    public void updateLastActive() {
        this.lastActive = LocalDateTime.now();
        this.lastOnline = LocalDateTime.now();
    }
}