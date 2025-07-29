# 즉석 모임 자동 매칭 시스템

## 🎯 핵심 컨셉

특징을 입력하면 시스템이 자동으로 분석해서 매칭해주는 방식입니다. 별도의 호감 표현 과정 없이 양방향 특징 매칭이 이루어지면 자동으로 연결됩니다.

## 📱 시나리오

### 1. 모임 참가 및 특징 입력
```
1. 모임 참가 (닉네임만 입력)
2. 내 특징 입력:
   - 상의: 검은색 후드티
   - 하의: 청바지
   - 안경: 착용
   - 특별한 특징: 노트북에 개발 스티커
3. 찾는 사람 특징 입력:
   - 상의: 흰색 셔츠
   - 하의: 베이지 팬츠
   - 안경: 미착용
   - 특별한 특징: 분홍색 텀블러
```

### 2. 자동 매칭 프로세스
```
시스템이 백그라운드에서:
1. A가 입력한 "찾는 특징"과 B의 "내 특징" 비교
2. B가 입력한 "찾는 특징"과 A의 "내 특징" 비교
3. 양방향 일치 시 자동 매칭
4. 매칭 알림 전송
```

### 3. 매칭 후
```
1. "매칭되었습니다!" 알림
2. 상대방 닉네임만 공개
3. 익명 채팅 시작
```

## 🗄️ 데이터베이스 스키마 (수정)

```sql
-- 즉석 참가자 특징 (확장)
CREATE TABLE instant_participant_features (
  id UUID PRIMARY KEY,
  participant_id UUID REFERENCES instant_participants(id),
  -- 내 특징
  my_features JSONB NOT NULL,
  -- 찾는 사람 특징
  looking_for_features JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(participant_id)
);

-- 자동 매칭 테이블 (수정)
CREATE TABLE instant_auto_matches (
  id UUID PRIMARY KEY,
  meeting_id UUID REFERENCES instant_meetings(id),
  participant1_id UUID REFERENCES instant_participants(id),
  participant2_id UUID REFERENCES instant_participants(id),
  match_score FLOAT, -- 매칭 점수 (선택)
  chat_room_id UUID DEFAULT gen_random_uuid(),
  matched_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(participant1_id, participant2_id)
);

-- 매칭 시도 로그 (분석용)
CREATE TABLE instant_match_attempts (
  id UUID PRIMARY KEY,
  meeting_id UUID REFERENCES instant_meetings(id),
  participant_id UUID REFERENCES instant_participants(id),
  potential_matches INTEGER, -- 가능한 매칭 수
  successful_matches INTEGER, -- 성공한 매칭 수
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 자동 매칭 로직

```typescript
class AutoMatchingService {
  // 특징 입력/수정 시 자동 매칭 실행
  async updateFeaturesAndMatch(
    participantId: string,
    myFeatures: Features,
    lookingForFeatures: Features
  ) {
    // 1. 특징 저장
    await this.saveFeatures(participantId, myFeatures, lookingForFeatures);
    
    // 2. 자동 매칭 실행
    const matches = await this.findMatches(participantId);
    
    // 3. 매칭 결과 처리
    for (const match of matches) {
      await this.createAutoMatch(participantId, match.participantId);
    }
    
    return matches.length;
  }

  // 양방향 매칭 찾기
  private async findMatches(participantId: string): Promise<Match[]> {
    const myData = await this.getParticipantFeatures(participantId);
    const otherParticipants = await this.getOtherParticipants(
      myData.meetingId, 
      participantId
    );
    
    const matches = [];
    
    for (const other of otherParticipants) {
      // 양방향 체크
      const iMatch = this.checkFeatureMatch(
        myData.lookingFor, 
        other.myFeatures
      );
      const theyMatch = this.checkFeatureMatch(
        other.lookingFor, 
        myData.myFeatures
      );
      
      if (iMatch && theyMatch) {
        matches.push(other);
      }
    }
    
    return matches;
  }

  // 특징 매칭 체크
  private checkFeatureMatch(
    lookingFor: Features,
    actual: Features
  ): boolean {
    // 필수 특징 체크
    if (lookingFor.upperWear && lookingFor.upperWear !== actual.upperWear) {
      return false;
    }
    if (lookingFor.lowerWear && lookingFor.lowerWear !== actual.lowerWear) {
      return false;
    }
    if (lookingFor.glasses !== null && lookingFor.glasses !== actual.glasses) {
      return false;
    }
    
    // 특별한 특징은 포함 여부로 체크
    if (lookingFor.specialFeatures) {
      const lookingWords = this.extractKeywords(lookingFor.specialFeatures);
      const actualWords = this.extractKeywords(actual.specialFeatures || '');
      
      // 키워드 매칭
      const matchCount = lookingWords.filter(word => 
        actualWords.includes(word)
      ).length;
      
      // 50% 이상 매칭 시 통과
      if (matchCount < lookingWords.length * 0.5) {
        return false;
      }
    }
    
    return true;
  }
}
```

## 📱 수정된 UI 플로우

### 1. 모임 참가 시 특징 입력
```
┌─────────────────────────────────┐
│  < 즉석 모임 참가          1/3  │
├─────────────────────────────────┤
│                                 │
│  닉네임을 입력해주세요          │
│  ┌─────────────────────────┐   │
│  │ 커피러버                 │   │
│  └─────────────────────────┘   │
│                                 │
│         [ 다음 ]                │
└─────────────────────────────────┘

↓

┌─────────────────────────────────┐
│  < 내 특징 입력           2/3   │
├─────────────────────────────────┤
│                                 │
│  다른 사람이 나를 찾을 수 있도록 │
│  현재 모습을 입력해주세요       │
│                                 │
│  상의: [검은색 후드티 ▼]        │
│  하의: [청바지 ▼]              │
│  안경: (•) 착용 ( ) 미착용     │
│                                 │
│  특별한 특징:                   │
│  [노트북에 개발 스티커         ]│
│                                 │
│         [ 다음 ]                │
└─────────────────────────────────┘

↓

┌─────────────────────────────────┐
│  < 찾는 사람 특징         3/3   │
├─────────────────────────────────┤
│                                 │
│  만나고 싶은 사람의 특징을      │
│  입력해주세요                   │
│                                 │
│  상의: [흰색 셔츠 ▼]           │
│  하의: [베이지 팬츠 ▼]         │
│  안경: ( ) 착용 (•) 미착용     │
│                                 │
│  특별한 특징:                   │
│  [분홍색 텀블러               ]│
│                                 │
│      [ 완료 ]                   │
└─────────────────────────────────┘
```

### 2. 모임 메인 화면 (수정)
```
┌─────────────────────────────────┐
│  < 스타벅스 강남점 모임    ⚙️   │
├─────────────────────────────────┤
│                                 │
│  참가자 12명 | 매칭 대기 중...  │
│                                 │
│  ┌─────────────────────────┐   │
│  │    🔄 자동 매칭 중       │   │
│  │                         │   │
│  │  내 특징과 찾는 사람     │   │
│  │  특징을 분석하고 있어요  │   │
│  └─────────────────────────┘   │
│                                 │
│  내 매칭: 0                     │
│  남은 시간: 2시간 15분          │
│                                 │
│  [ 특징 수정하기 ]              │
└─────────────────────────────────┘
```

### 3. 매칭 알림
```
┌─────────────────────────────────┐
│                                 │
│      🎉 매칭되었습니다!         │
│                                 │
│  서로의 특징이 일치했어요       │
│                                 │
│  매칭 상대: 책벌레              │
│                                 │
│  [ 채팅 시작하기 ]              │
└─────────────────────────────────┘
```

## 🔄 실시간 업데이트

```typescript
// WebSocket 이벤트
socket.on('instant:feature_updated', ({ participantId }) => {
  // 다른 참가자가 특징을 업데이트했을 때
  // 백그라운드에서 재매칭 시도
});

socket.on('instant:new_match', ({ matchId, nickname }) => {
  // 새로운 매칭 발생
  showNotification(`${nickname}님과 매칭되었습니다!`);
});

socket.on('instant:participant_joined', ({ count }) => {
  // 새 참가자 입장 시 자동 매칭 재시도
});
```

## 🛡️ 프라이버시 보호

1. **특징 데이터 보호**
   - 특징 정보는 모임 종료 후 24시간 내 삭제
   - 매칭된 상대에게도 구체적 특징 비공개
   - 닉네임만 공개

2. **매칭 알고리즘 보안**
   - 정확한 매칭 로직 비공개
   - 무작위 추측 방지
   - 과도한 특징 변경 제한

## 📊 통계 (내부용)

- 평균 매칭 시간
- 특징 조합별 성공률
- 가장 많이 사용되는 특징
- 매칭 성공률 향상을 위한 분석

---

이 시스템을 통해 사용자는 별도의 액션 없이도 자동으로 원하는 사람과 매칭될 수 있습니다.