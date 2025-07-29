# 익명 프로필 시스템 설계

## 🎭 4단계 프로필 분리 시스템

Glimpse는 사용자의 프라이버시를 최우선으로 하여, 각 그룹 유형별로 독립적인 프로필을 관리합니다.

### 1. 프로필 구조

```typescript
interface UserProfileSystem {
  // 메인 계정 (실명 기반)
  mainAccount: {
    id: string;
    phoneNumber: string;
    realName: string;
    birthDate: Date;
    gender: Gender;
    isVerified: boolean;
    createdAt: Date;
  };

  // 프로필 타입별 관리
  profiles: {
    official: OfficialProfile;      // 회사/대학 그룹용
    created: CreatedProfile;        // 생성된 그룹용
    instant: InstantProfile;        // 즉석 모임용
    location: LocationProfile;      // 위치 기반용
  };
}
```

### 2. 프로필별 상세 구조

#### 2.1 공식 그룹 프로필 (Official)
```typescript
interface OfficialProfile {
  id: string;
  userId: string;
  nickname: string;
  profileImage?: string;      // 블러 처리
  department?: string;        // 부서/학과
  position?: string;          // 직급/학년
  bio: string;
  interests: string[];
  isVerified: boolean;        // 회사/학교 인증 여부
  companyId: string;
  settings: {
    showDepartment: boolean;
    showPosition: boolean;
    allowMessageFromSameDept: boolean;
  };
}
```

#### 2.2 생성 그룹 프로필 (Created)
```typescript
interface CreatedProfile {
  id: string;
  userId: string;
  nickname: string;           // 그룹별 다른 닉네임 가능
  profileImage?: string;
  bio: string;
  interests: string[];
  groupSpecificInfo: Record<string, any>; // 그룹별 커스텀 정보
  joinedGroups: Array<{
    groupId: string;
    nickname: string;         // 그룹별 닉네임 오버라이드
    role: 'member' | 'admin' | 'creator';
    joinedAt: Date;
  }>;
}
```

#### 2.3 즉석 모임 프로필 (Instant)
```typescript
interface InstantProfile {
  id: string;
  userId: string;
  temporaryId: string;        // 모임별 임시 ID
  nickname: string;           // 즉석 닉네임
  gender: Gender;
  ageRange: '20s' | '30s' | '40s+';  // 나이대만 공개
  bio?: string;               // 짧은 소개
  features: {
    physical: PhysicalFeatures;
    style: StyleFeatures;
    custom: Record<string, string>;
  };
  activeUntil: Date;          // 자동 삭제 시간
  meetingHistory: Array<{
    meetingId: string;
    joinedAt: Date;
    matchCount: number;
  }>;
}

interface PhysicalFeatures {
  height?: 'short' | 'average' | 'tall';
  build?: 'slim' | 'average' | 'athletic';
  glasses?: boolean;
  hairLength?: 'short' | 'medium' | 'long';
  hairColor?: string;
}

interface StyleFeatures {
  upperWear?: string;
  lowerWear?: string;
  shoes?: string;
  accessories?: string[];
  bag?: string;
  overall?: 'casual' | 'formal' | 'sporty' | 'unique';
}
```

#### 2.4 위치 기반 프로필 (Location)
```typescript
interface LocationProfile {
  id: string;
  userId: string;
  nickname: string;
  currentLocation?: {
    lat: number;
    lng: number;
    accuracy: number;
  };
  frequentLocations: Array<{
    name: string;
    coordinate: Coordinate;
    visitCount: number;
  }>;
  locationPreferences: {
    showExactLocation: boolean;
    showFrequentPlaces: boolean;
    discoverable: boolean;
  };
  nearbyHistory: Array<{
    userId: string;
    timestamp: Date;
    location: string;
  }>;
}
```

## 🔐 프라이버시 보호 메커니즘

### 1. 데이터 격리
```typescript
class ProfileIsolationService {
  // 프로필 간 데이터 완전 격리
  async getProfile(userId: string, profileType: ProfileType, groupId?: string) {
    // 각 프로필은 독립적으로 저장/관리
    const profile = await this.profileRepo.findOne({
      userId,
      type: profileType,
      groupId: groupId || null
    });

    // 다른 프로필 정보는 절대 포함하지 않음
    return this.sanitizeProfile(profile, profileType);
  }

  // 프로필 간 연결 정보 차단
  private sanitizeProfile(profile: any, type: ProfileType) {
    const sanitized = { ...profile };
    
    // 메인 계정 정보 제거
    delete sanitized.phoneNumber;
    delete sanitized.realName;
    delete sanitized.mainUserId;
    
    // 다른 프로필 참조 제거
    delete sanitized.otherProfiles;
    
    return sanitized;
  }
}
```

### 2. 익명성 레벨 관리
```typescript
enum AnonymityLevel {
  FULL = 'FULL',               // 완전 익명 (즉석 모임)
  PARTIAL = 'PARTIAL',         // 부분 공개 (닉네임, 관심사)
  VERIFIED = 'VERIFIED',       // 인증된 익명 (회사/학교)
  REVEALED = 'REVEALED'        // 공개 (매칭 후)
}

interface AnonymitySettings {
  level: AnonymityLevel;
  revealableInfo: {
    nickname: boolean;
    age: boolean;
    interests: boolean;
    photo: boolean;
    realName: boolean;
  };
  conditions: {
    afterMatch: boolean;
    afterChat: boolean;
    mutualConsent: boolean;
    timeDelay?: number;        // 공개까지 대기 시간
  };
}
```

### 3. 프로필 전환 보안
```typescript
class ProfileSwitchingService {
  // 프로필 전환 시 보안 검증
  async switchProfile(
    userId: string, 
    fromType: ProfileType, 
    toType: ProfileType,
    groupId?: string
  ) {
    // 세션 격리
    await this.clearCurrentSession(userId, fromType);
    
    // 새 프로필 로드
    const newProfile = await this.loadProfile(userId, toType, groupId);
    
    // 활동 기록 격리
    await this.isolateActivityHistory(userId, toType);
    
    // 새 세션 생성
    return this.createIsolatedSession(newProfile);
  }

  // 교차 프로필 추적 방지
  private async preventCrossProfileTracking(userId: string) {
    // 쿠키/토큰 재생성
    const newToken = await this.generateIsolatedToken(userId);
    
    // 캐시 클리어
    await this.clearProfileCache(userId);
    
    // 활동 로그 격리
    await this.isolateActivityLogs(userId);
    
    return newToken;
  }
}
```

## 📊 데이터베이스 설계

### 프로필 테이블 구조
```sql
-- 메인 사용자 계정 (최소 정보만 보관)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE,
  phone_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 프로필 타입별 테이블
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  profile_type VARCHAR(20), -- 'official', 'created', 'instant', 'location'
  group_id UUID,
  nickname VARCHAR(50),
  bio TEXT,
  profile_data JSONB,       -- 타입별 특화 데이터
  anonymity_settings JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,     -- 즉석 프로필용
  UNIQUE(user_id, profile_type, group_id)
);

-- 프로필 격리 인덱스
CREATE INDEX idx_profile_isolation ON user_profiles(user_id, profile_type);
CREATE INDEX idx_profile_group ON user_profiles(group_id, profile_type);

-- 프로필 활동 기록 (격리)
CREATE TABLE profile_activities (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES user_profiles(id),
  activity_type VARCHAR(50),
  activity_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 프로필 간 매칭 (격리된 참조)
CREATE TABLE profile_matches (
  id UUID PRIMARY KEY,
  profile1_id UUID REFERENCES user_profiles(id),
  profile2_id UUID REFERENCES user_profiles(id),
  match_type VARCHAR(20),
  reveal_status JSONB,      -- 단계별 공개 상태
  matched_at TIMESTAMP DEFAULT NOW()
);
```

## 🛡️ 보안 정책

### 1. 프로필 접근 제어
```typescript
class ProfileAccessControl {
  // 프로필 접근 권한 검증
  async canAccessProfile(
    requesterId: string,
    targetProfileId: string,
    accessType: 'view' | 'message' | 'match'
  ): Promise<boolean> {
    // 같은 그룹 멤버인지 확인
    const sameGroup = await this.checkSameGroup(requesterId, targetProfileId);
    if (!sameGroup) return false;

    // 프로필 타입별 접근 규칙
    const targetProfile = await this.getProfile(targetProfileId);
    switch (targetProfile.type) {
      case 'instant':
        // 즉석 모임은 매칭 전 프로필 접근 불가
        return accessType === 'match' || await this.isMatched(requesterId, targetProfileId);
      
      case 'official':
        // 회사/학교는 같은 조직 내에서만
        return await this.checkSameOrganization(requesterId, targetProfileId);
      
      default:
        return true;
    }
  }
}
```

### 2. 데이터 보존 정책
```typescript
interface DataRetentionPolicy {
  instant: {
    profileLifetime: 24,        // 시간
    activityHistory: 7,         // 일
    matchHistory: 30           // 일
  };
  created: {
    profileLifetime: null,      // 무제한
    activityHistory: 90,        // 일
    inactiveDelete: 180        // 일 (비활성 시)
  };
  official: {
    profileLifetime: null,      // 무제한
    activityHistory: 365,       // 일
    afterLeaveCompany: 30      // 일
  };
  location: {
    locationHistory: 30,        // 일
    nearbyHistory: 7,          // 일
    heatmapData: 90           // 일
  };
}
```

## 🎯 사용 시나리오

### 1. 즉석 모임 참가 시
```
1. 사용자가 즉석 모임 참가
2. 시스템이 즉석 프로필 자동 생성
3. 기존 프로필과 완전 격리된 임시 신원
4. 24시간 후 자동 삭제
```

### 2. 회사 그룹 활동 시
```
1. 회사 인증 완료
2. 회사 전용 프로필 생성
3. 부서/직급 정보는 선택적 공개
4. 퇴사 시 30일 후 자동 비활성화
```

### 3. 프로필 전환 시
```
1. 그룹 타입 변경 시 자동 프로필 전환
2. 이전 활동 내역 완전 격리
3. 새로운 세션으로 시작
4. 교차 추적 불가능
```

---

이 시스템을 통해 사용자는 각 상황에 맞는 적절한 수준의 익명성을 유지하면서도 안전하게 서비스를 이용할 수 있습니다.