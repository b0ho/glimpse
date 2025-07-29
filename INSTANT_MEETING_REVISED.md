# 즉석 모임 기능 (수정본) - 완전 익명 시스템

## 🎯 핵심 원칙

1. **완전한 익명성**: 매칭 후에도 닉네임만 공개, 프로필 정보 없음
2. **이력 보존**: 모든 활동 기록은 보존되나 익명으로 관리
3. **구체적 특징 허용**: 1:1 매칭도 가능하도록 구체적 특징 입력 허용
4. **채팅만 가능**: 매칭 후에도 추가 정보 공개 없이 채팅만 진행

## 📱 단순화된 시나리오

### 1. 즉석 모임 생성
```
주최자 행동:
1. "즉석 모임 만들기" 선택
2. 모임 정보 입력:
   - 모임명: "스타벅스 강남점"
   - 유효시간: 3시간
   - 특징 카테고리 선택 (5-10개)
3. 모임 코드 생성: "CAFE2024"
4. QR 코드 공유
```

### 2. 모임 참가
```
참가자 행동:
1. QR 스캔 또는 코드 입력
2. 닉네임만 입력: "커피러버" (모임 전용)
3. 입장 완료
```

### 3. 호감 표현
```
1. "호감 표현하기" 탭
2. 특징 입력:
   - 상의: 검은색 후드티
   - 하의: 청바지
   - 안경: 착용
   - 특별한 특징: "맥북에 스티커 많음"
3. 전송 (1명만 매칭되어도 OK)
```

### 4. 매칭 및 채팅
```
1. 상호 매칭 시 알림
2. 채팅방 자동 생성
3. 서로의 닉네임만 표시
4. 익명 채팅 진행
5. 추가 정보 공개 없음
```

## 🗄️ 데이터베이스 설계 (수정)

### 즉석 모임 테이블
```sql
-- 즉석 모임 (변경 없음)
CREATE TABLE instant_meetings (
  id UUID PRIMARY KEY,
  code VARCHAR(10) UNIQUE,
  name VARCHAR(100),
  creator_id UUID REFERENCES users(id),
  location JSONB,
  feature_categories TEXT[],
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 즉석 참가 기록 (단순화)
CREATE TABLE instant_participants (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  meeting_id UUID REFERENCES instant_meetings(id),
  nickname VARCHAR(50),  -- 모임에서만 사용하는 닉네임
  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, meeting_id)
);

-- 즉석 호감 표현 (구체적 특징 허용)
CREATE TABLE instant_interests (
  id UUID PRIMARY KEY,
  from_participant_id UUID REFERENCES instant_participants(id),
  meeting_id UUID REFERENCES instant_meetings(id),
  target_features JSONB,  -- 구체적 특징도 허용
  created_at TIMESTAMP DEFAULT NOW()
);

-- 즉석 매칭 기록
CREATE TABLE instant_matches (
  id UUID PRIMARY KEY,
  meeting_id UUID REFERENCES instant_meetings(id),
  participant1_id UUID REFERENCES instant_participants(id),
  participant2_id UUID REFERENCES instant_participants(id),
  chat_room_id UUID,
  matched_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(participant1_id, participant2_id)
);

-- 채팅 메시지 (익명)
CREATE TABLE instant_messages (
  id UUID PRIMARY KEY,
  chat_room_id UUID,
  sender_participant_id UUID REFERENCES instant_participants(id),
  content TEXT,  -- 암호화
  message_type VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 활동 로그 (분석용)
CREATE TABLE instant_activity_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),  -- 내부 추적용
  meeting_id UUID REFERENCES instant_meetings(id),
  activity_type VARCHAR(50),  -- JOIN, LEAVE, INTEREST_SENT, MATCH, MESSAGE
  activity_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔐 익명성 보장 방식

### 1. 데이터 분리
```typescript
// 참가자 정보는 최소한으로
interface InstantParticipant {
  id: string;
  nickname: string;  // 오직 이것만 공개
  meetingId: string;
  // 프로필 정보 없음
}

// 사용자 추적은 백엔드에서만
interface InternalTracking {
  userId: string;      // 실제 사용자 ID
  participantId: string;  // 익명 참가자 ID
  // 프론트엔드에 절대 노출하지 않음
}
```

### 2. 특징 매칭 로직 (수정)
```typescript
class InstantMatchingService {
  async expressInterest(
    fromParticipantId: string,
    targetFeatures: any  // 구체적 특징 허용
  ): Promise<void> {
    // 1. 특징과 일치하는 참가자 찾기
    const matches = await this.findMatches(targetFeatures);
    
    // 2. 1명이든 여러명이든 모두에게 전송
    for (const match of matches) {
      await this.saveInterest(fromParticipantId, match.id, targetFeatures);
      
      // 3. 즉시 역방향 확인
      const reverseMatch = await this.checkReverseMatch(
        fromParticipantId, 
        match.id
      );
      
      if (reverseMatch) {
        await this.createMatch(fromParticipantId, match.id);
      }
    }
  }
}
```

## 📱 단순화된 UI/UX

### 1. 모임 참가 화면
```
┌─────────────────────────────────┐
│  < 즉석 모임 참가               │
├─────────────────────────────────┤
│                                 │
│  닉네임을 입력해주세요          │
│  (이 모임에서만 사용됩니다)     │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 커피러버                 │   │
│  └─────────────────────────┘   │
│                                 │
│         [ 입장하기 ]            │
└─────────────────────────────────┘
```

### 2. 호감 표현 화면
```
┌─────────────────────────────────┐
│  < 호감 표현하기                │
├─────────────────────────────────┤
│                                 │
│  마음에 드는 사람의 특징을      │
│  입력해주세요                   │
│                                 │
│  상의 색상                      │
│  [검은색 후드티 ▼]             │
│                                 │
│  하의 종류                      │
│  [청바지 ▼]                    │
│                                 │
│  안경                           │
│  (•) 착용  ( ) 미착용          │
│                                 │
│  특별한 특징                    │
│  ┌─────────────────────────┐   │
│  │ 맥북에 개발 스티커 많음  │   │
│  └─────────────────────────┘   │
│                                 │
│        [ 호감 보내기 ]          │
└─────────────────────────────────┘
```

### 3. 매칭 후 채팅
```
┌─────────────────────────────────┐
│  < 커피러버                     │
├─────────────────────────────────┤
│                                 │
│  🎉 서로 호감을 표현했어요!      │
│                                 │
│  안녕하세요!                    │
│                      반가워요!   │
│                                 │
│  혹시 개발자신가요?              │
│                    네 맞아요!    │
│                                 │
├─────────────────────────────────┤
│ 😊 | 메시지 입력...        전송 │
└─────────────────────────────────┘
```

## 🔧 API 수정사항

### 1. 모임 참가 (단순화)
```typescript
POST /api/v1/instant-meetings/join
Body: {
  code: string,
  nickname: string  // 이것만 필요
}
```

### 2. 호감 표현 (구체적 특징 허용)
```typescript
POST /api/v1/instant-meetings/:meetingId/interests
Body: {
  targetFeatures: {
    upperWear: "검은색 후드티",
    lowerWear: "청바지", 
    glasses: true,
    customFeatures: {
      special: "맥북에 개발 스티커 많음"
    }
  }
}
```

### 3. 매칭 정보 (최소 정보만)
```typescript
GET /api/v1/instant-meetings/:meetingId/matches
Response: {
  matches: [{
    id: string,
    participantNickname: string,  // 닉네임만
    chatRoomId: string,
    matchedAt: string
  }]
}
```

## 📊 통계 및 분석

### 사용자에게 보이는 정보
- 내가 보낸 호감 수
- 내가 받은 호감 수 (숫자만)
- 매칭 성공 수

### 내부 분석용 (사용자에게 비공개)
- 모임별 참가 이력
- 매칭 성공률
- 활동 패턴 분석
- 안전 관련 모니터링

## 🛡️ 프라이버시 강화

1. **프론트엔드**
   - 실제 user ID 노출 안함
   - participant ID만 사용
   - 닉네임 외 정보 표시 안함

2. **백엔드**
   - user_id ↔ participant_id 매핑은 서버에서만 관리
   - 로그는 보존하되 익명화하여 저장
   - 채팅 내용 암호화

3. **매칭 후에도**
   - 프로필 공개 옵션 없음
   - 오직 채팅만 가능
   - 실명이나 연락처 교환은 자율

---

이렇게 수정하면 Glimpse의 익명성 컨셉에 완벽하게 부합하면서도 즉석 모임 기능을 제공할 수 있습니다.