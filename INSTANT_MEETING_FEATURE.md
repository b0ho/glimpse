# 즉석 모임 기능 고도화 설계서

## 🎯 기능 개요

즉석 모임은 현재 같은 공간에 있는 사람들이 익명성을 유지하면서 서로의 특징(인상착의)을 통해 호감을 표현하고 매칭되는 기능입니다.

### 핵심 원칙
1. **완벽한 익명성**: 매칭 전까지 어떤 개인정보도 공개되지 않음
2. **특징 기반 매칭**: 외모나 착용 아이템 등 시각적 특징으로만 식별
3. **상호 호감 시에만 공개**: 양방향 관심 표현 시에만 연결
4. **독립적 프로필 관리**: 4종류 모임(공식/생성/즉석/위치)별 별도 프로필

## 📱 상세 시나리오

### 1. 즉석 모임 생성 (주최자)

```
상황: 카페에서 스터디 모임을 진행하는 김지은씨
행동:
1. 앱 실행 → 그룹 탭 → "즉석 모임 만들기"
2. 모임 정보 입력:
   - 모임명: "강남역 스터디 모임"
   - 유효시간: 3시간
   - 최대 인원: 20명
   - 위치: 현재 위치 자동 설정

3. 특징 카테고리 설정:
   - 기본 제공 카테고리 중 선택 (5-8개)
     ✓ 상의 색상
     ✓ 하의 종류
     ✓ 안경 착용
     ✓ 머리 스타일
     ✓ 액세서리
   - 커스텀 카테고리 추가 가능 (최대 2개)

4. 모임 코드 생성: "CAFE2024"
5. QR 코드 화면에 표시
```

### 2. 즉석 모임 참가 (참가자)

```
상황: 같은 카페에 있던 이준호씨가 모임 참가
행동:
1. QR 스캔 또는 코드 입력 "CAFE2024"
2. 즉석 프로필 생성:
   - 닉네임: "커피러버" (즉석 모임 전용)
   - 성별: 남성
   - 한 줄 소개: "개발자입니다"
   
3. 내 특징 입력 (선택사항):
   - 상의: 검은색 후드티
   - 하의: 청바지
   - 안경: 착용
   - 머리: 짧은 머리
   - 액세서리: 애플워치

4. 모임 입장 완료
```

### 3. 호감 표현 과정

```
참가자 시점:
1. 모임 화면에서 "호감 표현하기" 버튼 클릭
2. 시스템 안내:
   "주변을 둘러보고 마음에 드는 사람의 특징을 입력해주세요"

3. 특징 입력 인터페이스:
   - 상의 색상: [드롭다운] 흰색/검은색/회색/네이비/베이지...
   - 하의 종류: [드롭다운] 청바지/면바지/치마/반바지...
   - 안경: [토글] 착용/미착용
   - 머리 길이: [선택] 짧음/보통/긴머리
   - 특별한 특징: [텍스트] "빨간 가방" (선택사항)

4. 확인 메시지:
   "선택하신 특징과 일치하는 참가자가 3명 있습니다.
    모두에게 호감이 전달됩니다."

5. 호감 전송 완료
```

### 4. 매칭 알고리즘

```
시스템 로직:
1. A가 입력한 특징과 일치하는 참가자 필터링
2. 해당 참가자들에게 익명 호감 전달
3. B도 A의 특징을 입력했는지 확인
4. 양방향 매칭 시:
   - 두 사람에게만 매칭 알림
   - 즉석 채팅방 생성
   - 프로필 단계적 공개 옵션
```

### 5. 매칭 후 상호작용

```
매칭 성공 시:
1. 푸시 알림: "즉석 모임에서 매칭되었습니다!"
2. 매칭 확인 화면:
   - 상대 닉네임: "커피러버"
   - 공통 관심사 표시
   - "대화 시작하기" 버튼

3. 채팅방 입장:
   - 시스템 메시지: "즉석 모임에서 만났네요! 👋"
   - 익명 채팅 시작
   - 실제 프로필 공개는 선택사항
```

## 🔐 프라이버시 보호 시스템

### 1. 다중 프로필 구조

```typescript
interface UserProfiles {
  mainProfile: Profile;           // 메인 계정 프로필
  companyProfile?: Profile;       // 회사 그룹용 프로필
  hobbyProfile?: Profile;         // 취미 그룹용 프로필
  instantProfile?: InstantProfile; // 즉석 모임용 프로필
  locationProfile?: Profile;      // 위치 기반 프로필
}

interface InstantProfile {
  id: string;
  nickname: string;
  gender: Gender;
  bio?: string;
  createdAt: Date;
  expiresAt: Date;  // 24시간 후 자동 삭제
  features?: UserFeatures;
}

interface UserFeatures {
  upperColor?: string;
  lowerType?: string;
  glasses?: boolean;
  hairLength?: 'short' | 'medium' | 'long';
  accessories?: string[];
  customFeatures?: Record<string, string>;
}
```

### 2. 익명성 보장 레벨

```
Level 1 - 완전 익명:
- 모임 참가 시 임시 ID 생성
- 특징만으로 식별
- 프로필 사진 없음

Level 2 - 부분 공개 (매칭 후):
- 즉석 닉네임 공개
- 한 줄 소개 공개
- 실루엣 프로필 사진

Level 3 - 선택적 공개:
- 실제 프로필 연결 옵션
- 상호 동의 시에만 공개
```

## 💡 특징 카테고리 시스템

### 기본 카테고리
```javascript
const DEFAULT_CATEGORIES = {
  upperWear: {
    name: '상의',
    options: ['흰색', '검은색', '회색', '네이비', '베이지', '패턴', '기타'],
    required: true
  },
  lowerWear: {
    name: '하의',
    options: ['청바지', '면바지', '반바지', '치마', '원피스', '기타'],
    required: true
  },
  glasses: {
    name: '안경',
    options: ['착용', '미착용'],
    required: false
  },
  hairStyle: {
    name: '머리 스타일',
    options: ['짧은머리', '중간머리', '긴머리', '묶은머리', '모자착용'],
    required: false
  },
  accessories: {
    name: '액세서리',
    options: ['시계', '목걸이', '귀걸이', '가방', '없음'],
    multiple: true,
    required: false
  }
};
```

### 상황별 카테고리 프리셋
```javascript
const CATEGORY_PRESETS = {
  cafe: {
    name: '카페/스터디',
    categories: ['upperWear', 'glasses', 'laptop', 'drinkType']
  },
  party: {
    name: '파티/모임',
    categories: ['upperWear', 'lowerWear', 'accessories', 'shoeType']
  },
  conference: {
    name: '컨퍼런스',
    categories: ['upperWear', 'glasses', 'lanyard', 'bagType']
  },
  outdoor: {
    name: '야외활동',
    categories: ['upperWear', 'hat', 'shoes', 'equipment']
  }
};
```

## 🎨 UI/UX 설계

### 1. 즉석 모임 생성 화면
```
[즉석 모임 만들기]

모임 정보
┌─────────────────────────┐
│ 모임 이름              │
│ [강남역 스터디 모임    ]│
│                         │
│ 유효 시간              │
│ [3시간 ▼]              │
│                         │
│ 최대 인원              │
│ [20명 ▼]               │
└─────────────────────────┘

특징 카테고리 선택
✓ 상의 색상
✓ 하의 종류
✓ 안경 착용
□ 머리 스타일
□ 액세서리

[프리셋 사용: 카페/스터디 ▼]

[모임 생성하기]
```

### 2. 호감 표현 화면
```
[마음에 드는 사람 찾기]

💡 주변을 둘러보고 특징을 입력해주세요

상의 색상 *
[선택하세요 ▼]

하의 종류 *
[선택하세요 ▼]

안경
( ) 착용  ( ) 미착용  (•) 상관없음

특별한 특징 (선택)
[예: 빨간 가방, 맥북 스티커]

⚠️ 3명이 일치합니다

[호감 보내기]
```

### 3. 매칭 알림 화면
```
🎉 매칭되었습니다!

서로 호감을 표현했어요

상대방: 커피러버
즉석 모임: 강남역 스터디 모임

[대화 시작하기]  [나중에]
```

## 📊 데이터베이스 설계

### 즉석 모임 테이블
```sql
-- 즉석 모임 정보
CREATE TABLE instant_meetings (
  id UUID PRIMARY KEY,
  code VARCHAR(10) UNIQUE,
  name VARCHAR(100),
  creator_id UUID REFERENCES users(id),
  location POINT,
  max_members INTEGER DEFAULT 30,
  feature_categories JSONB,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 즉석 프로필
CREATE TABLE instant_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  meeting_id UUID REFERENCES instant_meetings(id),
  nickname VARCHAR(50),
  gender VARCHAR(10),
  bio TEXT,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, meeting_id)
);

-- 즉석 호감 표현
CREATE TABLE instant_interests (
  id UUID PRIMARY KEY,
  from_profile_id UUID REFERENCES instant_profiles(id),
  meeting_id UUID REFERENCES instant_meetings(id),
  target_features JSONB,
  matched_profiles UUID[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- 즉석 매칭
CREATE TABLE instant_matches (
  id UUID PRIMARY KEY,
  meeting_id UUID REFERENCES instant_meetings(id),
  profile1_id UUID REFERENCES instant_profiles(id),
  profile2_id UUID REFERENCES instant_profiles(id),
  chat_room_id UUID,
  is_revealed BOOLEAN DEFAULT false,
  matched_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 API 엔드포인트

### 즉석 모임 관련
```typescript
// 즉석 모임 생성
POST /api/instant-meetings
{
  name: string;
  maxMembers: number;
  duration: number; // hours
  featureCategories: string[];
  customCategories?: CustomCategory[];
}

// 즉석 모임 참가
POST /api/instant-meetings/:code/join
{
  nickname: string;
  gender: string;
  bio?: string;
  features?: UserFeatures;
}

// 호감 표현
POST /api/instant-meetings/:meetingId/interests
{
  targetFeatures: UserFeatures;
}

// 매칭 확인
GET /api/instant-meetings/:meetingId/matches

// 프로필 공개
POST /api/instant-matches/:matchId/reveal
```

## 🛡️ 보안 및 프라이버시

### 1. 데이터 보호
- 즉석 프로필은 24시간 후 자동 삭제
- 메인 계정과 완전히 분리된 데이터
- 위치 정보는 모임 생성 시에만 사용

### 2. 매칭 보안
- 특징 조합이 너무 구체적일 경우 경고
- 최소 3명 이상 일치해야 호감 전송 가능
- 반복적인 추측 시도 방지 (레이트 리밋)

### 3. 사용자 보호
- 차단/신고 기능
- 즉석 모임별 독립적 차단 리스트
- 부적절한 특징 입력 필터링

## 📈 예상 효과

1. **익명성 보장으로 부담 없는 접근**
2. **실제 공간에서의 자연스러운 만남**
3. **게임같은 재미 요소로 참여도 증가**
4. **프라이버시 보호로 안전한 사용 환경**

---

이 설계를 바탕으로 즉석 모임 기능을 구현하면, 사용자들이 안전하고 재미있게 새로운 인연을 만날 수 있습니다.