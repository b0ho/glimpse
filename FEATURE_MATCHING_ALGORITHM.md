# 특징 기반 매칭 알고리즘 설계

## 🎯 알고리즘 개요

특징 기반 매칭은 물리적 특징과 스타일을 조합하여 익명 상태에서 상호 관심을 확인하는 시스템입니다.

### 핵심 원칙
1. **모호성 보장**: 특징이 너무 구체적이면 1:1 특정 방지
2. **최소 매칭 수**: 3명 이상 일치해야 호감 전송
3. **양방향 검증**: 상호 특징 일치 시에만 매칭
4. **프라이버시 우선**: 개인 식별 불가능한 수준 유지

## 🔍 매칭 프로세스

### 1. 특징 입력 및 검증

```typescript
interface FeatureMatchingService {
  // 특징 입력 검증
  async validateFeatures(
    features: UserFeatures,
    meetingId: string
  ): Promise<ValidationResult> {
    // 1. 필수 특징 확인
    const requiredFeatures = await this.getRequiredFeatures(meetingId);
    const missingFeatures = this.checkMissingFeatures(features, requiredFeatures);
    
    if (missingFeatures.length > 0) {
      return {
        valid: false,
        message: `필수 특징을 입력해주세요: ${missingFeatures.join(', ')}`
      };
    }

    // 2. 특징 구체성 검증
    const specificityScore = this.calculateSpecificity(features);
    if (specificityScore > 0.8) {
      return {
        valid: false,
        message: '특징이 너무 구체적입니다. 일부를 수정해주세요.'
      };
    }

    // 3. 예상 매칭 수 확인
    const matchCount = await this.estimateMatches(features, meetingId);
    if (matchCount < 3) {
      return {
        valid: false,
        message: '특징이 너무 구체적입니다. 최소 3명이 일치해야 합니다.',
        suggestions: await this.getSuggestions(features, meetingId)
      };
    }

    return { valid: true, estimatedMatches: matchCount };
  }
}
```

### 2. 특징 매칭 알고리즘

```typescript
class FeatureMatchingAlgorithm {
  // 매칭 점수 계산
  async calculateMatchScore(
    targetFeatures: UserFeatures,
    candidateFeatures: UserFeatures,
    weights: FeatureWeights
  ): Promise<number> {
    let totalScore = 0;
    let totalWeight = 0;

    // 카테고리별 매칭 점수 계산
    for (const [category, weight] of Object.entries(weights)) {
      const targetValue = targetFeatures[category];
      const candidateValue = candidateFeatures[category];

      if (targetValue === undefined || targetValue === 'any') {
        continue; // 지정하지 않은 특징은 스킵
      }

      const score = this.compareFeatures(category, targetValue, candidateValue);
      totalScore += score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  // 특징 비교 로직
  private compareFeatures(
    category: string,
    target: any,
    candidate: any
  ): number {
    // 완전 일치
    if (target === candidate) return 1.0;

    // 카테고리별 유사도 계산
    switch (category) {
      case 'upperColor':
        return this.compareColors(target, candidate);
      
      case 'hairLength':
        return this.compareHairLength(target, candidate);
      
      case 'height':
        return this.compareHeight(target, candidate);
      
      case 'accessories':
        return this.compareAccessories(target, candidate);
      
      default:
        return target === candidate ? 1.0 : 0.0;
    }
  }

  // 색상 유사도 (비슷한 색상군 부분 점수)
  private compareColors(color1: string, color2: string): number {
    const colorGroups = {
      dark: ['black', 'darkgray', 'navy', 'darkblue'],
      light: ['white', 'beige', 'cream', 'lightgray'],
      warm: ['red', 'orange', 'yellow', 'pink'],
      cool: ['blue', 'green', 'purple']
    };

    for (const group of Object.values(colorGroups)) {
      if (group.includes(color1) && group.includes(color2)) {
        return 0.7; // 같은 색상군
      }
    }
    return 0.0;
  }
}
```

### 3. 매칭 실행 및 결과 처리

```typescript
class InstantMatchingEngine {
  // 호감 표현 처리
  async expressInterest(
    fromProfileId: string,
    targetFeatures: UserFeatures,
    meetingId: string
  ): Promise<InterestResult> {
    // 1. 대상 후보 찾기
    const candidates = await this.findCandidates(targetFeatures, meetingId);
    
    // 2. 최소 인원 확인
    if (candidates.length < 3) {
      throw new Error('특징이 너무 구체적입니다. 조금 더 일반적으로 입력해주세요.');
    }

    // 3. 익명 호감 전송
    const interests = await this.sendAnonymousInterests(
      fromProfileId,
      candidates.map(c => c.profileId),
      targetFeatures
    );

    // 4. 즉시 역방향 매칭 확인
    const matches = await this.checkReverseMatches(fromProfileId, candidates);

    return {
      sentTo: candidates.length,
      immediateMatches: matches.length,
      message: matches.length > 0 
        ? '매칭이 성사되었습니다!' 
        : `${candidates.length}명에게 호감을 전달했습니다.`
    };
  }

  // 역방향 매칭 확인
  private async checkReverseMatches(
    profileId: string,
    candidates: CandidateProfile[]
  ): Promise<Match[]> {
    const myFeatures = await this.getProfileFeatures(profileId);
    const matches: Match[] = [];

    for (const candidate of candidates) {
      // 상대방이 나에게 보낸 호감 확인
      const reverseInterests = await this.getInterestsFrom(candidate.profileId);
      
      for (const interest of reverseInterests) {
        const matchScore = await this.calculateMatchScore(
          interest.targetFeatures,
          myFeatures,
          this.getDefaultWeights()
        );

        if (matchScore >= 0.7) { // 70% 이상 일치
          matches.push(await this.createMatch(profileId, candidate.profileId));
        }
      }
    }

    return matches;
  }
}
```

## 📊 매칭 가중치 시스템

### 1. 기본 가중치
```typescript
const DEFAULT_FEATURE_WEIGHTS: FeatureWeights = {
  // 의상 관련 (높은 가중치)
  upperColor: 0.25,
  lowerType: 0.20,
  
  // 신체 특징 (중간 가중치)
  glasses: 0.15,
  hairLength: 0.15,
  height: 0.10,
  
  // 액세서리 (낮은 가중치)
  accessories: 0.10,
  shoes: 0.05
};
```

### 2. 상황별 가중치 조정
```typescript
class DynamicWeightAdjuster {
  // 모임 유형별 가중치 조정
  adjustWeightsByContext(
    baseWeights: FeatureWeights,
    meetingContext: MeetingContext
  ): FeatureWeights {
    const adjusted = { ...baseWeights };

    switch (meetingContext.type) {
      case 'cafe_study':
        // 카페/스터디는 안경, 노트북 등에 가중치
        adjusted.glasses = 0.25;
        adjusted.hasLaptop = 0.20;
        break;

      case 'party':
        // 파티는 의상, 액세서리에 가중치
        adjusted.upperColor = 0.30;
        adjusted.accessories = 0.25;
        break;

      case 'outdoor':
        // 야외활동은 신발, 모자 등에 가중치
        adjusted.shoes = 0.25;
        adjusted.hat = 0.20;
        break;
    }

    return this.normalizeWeights(adjusted);
  }
}
```

## 🛡️ 프라이버시 보호 메커니즘

### 1. 특징 일반화
```typescript
class FeatureGeneralizer {
  // 너무 구체적인 특징 일반화
  generalizeFeatures(features: UserFeatures): UserFeatures {
    const generalized = { ...features };

    // 색상 일반화
    if (generalized.upperColor) {
      generalized.upperColor = this.generalizeColor(generalized.upperColor);
    }

    // 액세서리 일반화
    if (generalized.accessories && generalized.accessories.length > 2) {
      generalized.accessories = generalized.accessories.slice(0, 2);
    }

    // 커스텀 특징 제한
    if (generalized.customFeatures) {
      generalized.customFeatures = this.sanitizeCustomFeatures(
        generalized.customFeatures
      );
    }

    return generalized;
  }

  // 색상 일반화 (구체적 → 일반적)
  private generalizeColor(color: string): string {
    const colorMap = {
      'burgundy': 'red',
      'crimson': 'red',
      'scarlet': 'red',
      'navy': 'blue',
      'royal blue': 'blue',
      'charcoal': 'gray',
      'ash': 'gray'
    };

    return colorMap[color.toLowerCase()] || color;
  }
}
```

### 2. 매칭 난독화
```typescript
class MatchingObfuscator {
  // 매칭 결과 난독화
  async obfuscateMatches(
    matches: ProfileMatch[],
    minResults: number = 3
  ): Promise<ObfuscatedResult> {
    // 실제 매칭이 3명 미만이면 가짜 추가
    if (matches.length < minResults) {
      const fakeMatches = await this.generateFakeMatches(
        minResults - matches.length
      );
      matches = [...matches, ...fakeMatches];
    }

    // 순서 랜덤화
    const shuffled = this.shuffleArray(matches);

    // 정확한 수 숨기기
    const displayCount = this.getDisplayCount(matches.length);

    return {
      message: `${displayCount}명에게 호감을 전달했습니다`,
      hasMatches: matches.some(m => m.isReal && m.isMutual),
      exactCount: null // 정확한 수는 공개하지 않음
    };
  }

  // 표시할 대략적인 수
  private getDisplayCount(actual: number): string {
    if (actual <= 3) return '3';
    if (actual <= 5) return '3-5';
    if (actual <= 10) return '5-10';
    return '10명 이상의 사람';
  }
}
```

## 📈 매칭 효율성 최적화

### 1. 인덱싱 전략
```sql
-- 특징 기반 검색 최적화 인덱스
CREATE INDEX idx_instant_features ON instant_profiles 
  USING GIN (features jsonb_path_ops);

-- 복합 인덱스 (모임 + 활성 상태)
CREATE INDEX idx_meeting_active ON instant_profiles 
  (meeting_id, is_active) 
  WHERE is_active = true;

-- 매칭 스코어 계산용 함수
CREATE OR REPLACE FUNCTION calculate_feature_match_score(
  target_features JSONB,
  candidate_features JSONB,
  weights JSONB
) RETURNS FLOAT AS $$
DECLARE
  score FLOAT := 0;
  total_weight FLOAT := 0;
  key TEXT;
  weight FLOAT;
BEGIN
  FOR key, weight IN 
    SELECT * FROM jsonb_each_text(weights)
  LOOP
    IF target_features->key IS NOT NULL 
       AND candidate_features->key IS NOT NULL THEN
      IF target_features->key = candidate_features->key THEN
        score := score + weight::FLOAT;
      END IF;
      total_weight := total_weight + weight::FLOAT;
    END IF;
  END LOOP;
  
  RETURN CASE 
    WHEN total_weight > 0 THEN score / total_weight 
    ELSE 0 
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### 2. 캐싱 전략
```typescript
class MatchingCache {
  // 특징 조합별 결과 캐싱
  private cache = new Map<string, CachedResult>();

  async getCachedMatches(
    features: UserFeatures,
    meetingId: string
  ): Promise<ProfileMatch[] | null> {
    const cacheKey = this.generateCacheKey(features, meetingId);
    const cached = this.cache.get(cacheKey);

    if (cached && cached.timestamp > Date.now() - 60000) { // 1분 캐시
      return cached.matches;
    }

    return null;
  }

  // 캐시 키 생성 (정규화된 특징)
  private generateCacheKey(
    features: UserFeatures,
    meetingId: string
  ): string {
    const normalized = this.normalizeFeatures(features);
    return `${meetingId}:${JSON.stringify(normalized)}`;
  }
}
```

## 🎮 사용자 경험 최적화

### 1. 실시간 피드백
```typescript
interface RealTimeFeedback {
  // 특징 입력 중 실시간 매칭 수 표시
  async getMatchPreview(
    partialFeatures: Partial<UserFeatures>,
    meetingId: string
  ): Promise<MatchPreview> {
    const estimatedCount = await this.estimateMatches(
      partialFeatures,
      meetingId
    );

    return {
      count: this.getRangeDisplay(estimatedCount),
      isSpecific: estimatedCount < 3,
      suggestions: estimatedCount < 3 
        ? await this.getSuggestions(partialFeatures)
        : null
    };
  }

  // 추천 제시
  async getSuggestions(
    features: Partial<UserFeatures>
  ): Promise<FeatureSuggestion[]> {
    return [
      {
        message: '상의 색상을 더 일반적으로 선택해보세요',
        example: '검은색 → 어두운 색상'
      },
      {
        message: '일부 특징을 "상관없음"으로 변경해보세요',
        features: ['accessories', 'shoes']
      }
    ];
  }
}
```

### 2. 매칭 성공 피드백
```typescript
class MatchingFeedback {
  // 매칭 성공 시 단계적 공개
  async handleMatchSuccess(
    match: InstantMatch
  ): Promise<MatchRevealProcess> {
    return {
      step1: {
        message: '서로 호감을 표현했어요! 🎉',
        reveal: ['nickname', 'gender', 'ageRange']
      },
      step2: {
        message: '대화를 시작해보세요',
        reveal: ['bio', 'interests']
      },
      step3: {
        message: '더 알고 싶다면 프로필을 공개할 수 있어요',
        reveal: ['photo', 'realProfile'],
        requiresConsent: true
      }
    };
  }
}
```

---

이 알고리즘을 통해 사용자는 익명성을 유지하면서도 효과적으로 관심있는 사람과 매칭될 수 있습니다.