# 즉석 모임 API 설계

## 🎯 API 엔드포인트 명세

### 1. 프로필 관리 API

#### 1.1 프로필 전환
```typescript
// 프로필 타입 전환
POST /api/v1/profiles/switch
Headers: {
  Authorization: Bearer {token}
}
Body: {
  profileType: 'OFFICIAL' | 'CREATED' | 'INSTANT' | 'LOCATION',
  groupId?: string  // 그룹별 프로필인 경우
}
Response: {
  profile: {
    id: string,
    profileType: string,
    nickname: string,
    anonymityLevel: string,
    features?: UserFeatures  // 즉석 프로필인 경우
  },
  token: string  // 새로운 세션 토큰
}
```

#### 1.2 프로필 조회
```typescript
// 현재 활성 프로필 조회
GET /api/v1/profiles/current
Headers: {
  Authorization: Bearer {token}
}
Response: {
  profile: UserProfile,
  profileType: ProfileType,
  groupContext?: {
    groupId: string,
    groupName: string,
    groupType: string
  }
}
```

### 2. 즉석 모임 관리 API

#### 2.1 즉석 모임 생성
```typescript
POST /api/v1/instant-meetings
Headers: {
  Authorization: Bearer {token}
}
Body: {
  name: string,
  duration: number,  // 시간 단위
  maxMembers: number,
  location?: {
    lat: number,
    lng: number,
    address: string
  },
  featureCategories: string[],
  customCategories?: {
    name: string,
    options: string[]
  }[]
}
Response: {
  meeting: {
    id: string,
    code: string,  // 6-8자리 고유 코드
    name: string,
    qrCode: string,  // QR 코드 이미지 URL
    expiresAt: string,
    featureCategories: FeatureCategory[]
  }
}
```

#### 2.2 즉석 모임 참가
```typescript
POST /api/v1/instant-meetings/join
Headers: {
  Authorization: Bearer {token}
}
Body: {
  code: string,  // 모임 코드 또는 QR 데이터
  profile: {
    nickname: string,
    gender: 'MALE' | 'FEMALE' | 'OTHER',
    ageRange: '20s' | '30s' | '40s+',
    bio?: string,
    features?: UserFeatures
  }
}
Response: {
  meeting: InstantMeeting,
  profile: InstantProfile,
  participants: {
    total: number,
    byGender: {
      male: number,
      female: number,
      other: number
    }
  }
}
```

#### 2.3 모임 상세 조회
```typescript
GET /api/v1/instant-meetings/:meetingId
Headers: {
  Authorization: Bearer {token}
}
Response: {
  meeting: InstantMeeting,
  myProfile: InstantProfile,
  participants: {
    total: number,
    active: number,
    byGender: Record<string, number>
  },
  myInterests: {
    sent: number,
    matches: number
  },
  isCreator: boolean
}
```

### 3. 특징 기반 매칭 API

#### 3.1 특징 검증 및 예상 매칭
```typescript
POST /api/v1/instant-meetings/:meetingId/validate-features
Headers: {
  Authorization: Bearer {token}
}
Body: {
  features: UserFeatures
}
Response: {
  valid: boolean,
  estimatedMatches: {
    min: number,
    max: number,
    display: string  // "3-5명", "5명 이상" 등
  },
  suggestions?: {
    message: string,
    recommendedChanges: string[]
  }[]
}
```

#### 3.2 호감 표현
```typescript
POST /api/v1/instant-meetings/:meetingId/interests
Headers: {
  Authorization: Bearer {token}
}
Body: {
  targetFeatures: UserFeatures,
  message?: string  // 선택적 메시지
}
Response: {
  success: boolean,
  result: {
    sentCount: number,  // 호감을 보낸 사람 수
    displayCount: string,  // "3-5명에게 전달"
    instantMatches: number,  // 즉시 매칭된 수
    dailyLimit?: {
      used: number,
      total: number
    }
  }
}
```

#### 3.3 매칭 확인
```typescript
GET /api/v1/instant-meetings/:meetingId/matches
Headers: {
  Authorization: Bearer {token}
}
Response: {
  matches: Array<{
    id: string,
    matchedAt: string,
    otherProfile: {
      nickname: string,
      gender: string,
      ageRange: string,
      bio?: string
    },
    revealStatus: {
      level: number,  // 0-3
      myRevealed: boolean,
      theirRevealed: boolean
    },
    chatRoom?: {
      id: string,
      lastMessage?: string,
      unreadCount: number
    }
  }>,
  pendingInterests: number  // 받은 호감 수 (프리미엄)
}
```

### 4. 프로필 공개 관리 API

#### 4.1 단계별 프로필 공개
```typescript
POST /api/v1/instant-matches/:matchId/reveal
Headers: {
  Authorization: Bearer {token}
}
Body: {
  revealLevel: 1 | 2 | 3,  // 공개 수준
  revealData?: {
    realProfile?: boolean,  // 실제 프로필 연결
    socialMedia?: {
      instagram?: string,
      kakao?: string
    }
  }
}
Response: {
  success: boolean,
  myRevealStatus: RevealStatus,
  theirRevealStatus: RevealStatus,
  unlockedInfo?: {
    profile?: UserProfile,
    contact?: ContactInfo
  }
}
```

#### 4.2 매칭 거절/차단
```typescript
POST /api/v1/instant-matches/:matchId/reject
Headers: {
  Authorization: Bearer {token}
}
Body: {
  reason?: string,
  blockUser?: boolean
}
Response: {
  success: boolean
}
```

### 5. 즉석 채팅 API

#### 5.1 즉석 채팅방 생성
```typescript
POST /api/v1/instant-chats
Headers: {
  Authorization: Bearer {token}
}
Body: {
  matchId: string
}
Response: {
  chatRoom: {
    id: string,
    matchId: string,
    participants: Array<{
      profileId: string,
      nickname: string,
      online: boolean
    }>,
    settings: {
      autoDelete: boolean,
      deleteAfter: number  // 시간
    }
  }
}
```

#### 5.2 메시지 전송 (익명)
```typescript
POST /api/v1/instant-chats/:roomId/messages
Headers: {
  Authorization: Bearer {token}
}
Body: {
  content: string,
  type: 'TEXT' | 'IMAGE' | 'EMOJI',
  metadata?: any
}
Response: {
  message: {
    id: string,
    content: string,
    type: string,
    senderId: string,  // 임시 ID
    timestamp: string,
    delivered: boolean
  }
}
```

### 6. 통계 및 분석 API

#### 6.1 모임 통계 (주최자용)
```typescript
GET /api/v1/instant-meetings/:meetingId/analytics
Headers: {
  Authorization: Bearer {token}
}
Response: {
  participants: {
    total: number,
    active: number,
    joined: Array<{
      time: string,
      count: number
    }>
  },
  interactions: {
    totalInterests: number,
    totalMatches: number,
    matchRate: number
  },
  demographics: {
    byGender: Record<string, number>,
    byAgeRange: Record<string, number>
  }
}
```

#### 6.2 개인 활동 기록
```typescript
GET /api/v1/instant-meetings/:meetingId/my-activity
Headers: {
  Authorization: Bearer {token}
}
Response: {
  profile: InstantProfile,
  activity: {
    joinedAt: string,
    sentInterests: number,
    receivedInterests: number,  // 숫자만, 상세 내용 X
    matches: number,
    messages: number
  }
}
```

## 🔐 보안 및 인증

### 세션 격리
```typescript
// 프로필별 독립 토큰
interface ProfileToken {
  userId: string,
  profileId: string,
  profileType: ProfileType,
  groupId?: string,
  sessionId: string,
  expiresAt: number
}

// 토큰 검증 미들웨어
async function validateProfileToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 프로필 타입과 요청 경로 일치 확인
    if (req.path.includes('instant') && decoded.profileType !== 'INSTANT') {
      throw new Error('Invalid profile type for this request');
    }
    
    req.user = decoded;
    req.profileId = decoded.profileId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

### Rate Limiting
```typescript
// 특징 매칭 요청 제한
const featureMatchLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1분
  max: 10,  // 최대 10회
  message: '너무 많은 매칭 시도입니다. 잠시 후 다시 시도해주세요.'
});

// 호감 표현 제한
const interestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1시간
  max: 30,  // 최대 30회
  keyGenerator: (req) => `${req.profileId}:${req.params.meetingId}`
});
```

## 📱 WebSocket 이벤트

### 즉석 모임 실시간 이벤트
```typescript
// 클라이언트 → 서버
socket.emit('instant:join', { meetingId, profileId });
socket.emit('instant:leave', { meetingId, profileId });
socket.emit('instant:typing', { matchId, isTyping });

// 서버 → 클라이언트
socket.on('instant:participant_joined', { count, participant });
socket.on('instant:participant_left', { count });
socket.on('instant:new_match', { matchId, profile });
socket.on('instant:interest_received', { count });  // 숫자만
socket.on('instant:message', { message });
```

## 🔄 에러 처리

### 표준 에러 응답
```typescript
interface ErrorResponse {
  error: {
    code: string,
    message: string,
    details?: any
  }
}

// 에러 코드
const ERROR_CODES = {
  MEETING_NOT_FOUND: 'E001',
  MEETING_EXPIRED: 'E002',
  MEETING_FULL: 'E003',
  INVALID_FEATURES: 'E004',
  TOO_SPECIFIC: 'E005',
  ALREADY_JOINED: 'E006',
  NOT_PARTICIPANT: 'E007',
  RATE_LIMITED: 'E008',
  PROFILE_MISMATCH: 'E009'
};
```

---

이 API 설계를 통해 즉석 모임의 모든 기능을 안전하고 효율적으로 구현할 수 있습니다.