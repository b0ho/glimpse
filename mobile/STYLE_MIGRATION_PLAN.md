# 스타일 시스템 마이그레이션 계획

## 현재 상황
- NativeWind v2가 웹에서 제대로 작동하지 않음
- 기존 StyleSheet 시스템은 플랫폼별 일관성 부족
- 진정한 크로스 플랫폼 솔루션 필요

## 추천 솔루션: Tamagui

### 왜 Tamagui인가?
1. **완벽한 크로스 플랫폼 지원**: Web, iOS, Android 모두 동일하게 작동
2. **성능**: 컴파일 타임 최적화로 런타임 오버헤드 최소화
3. **개발자 경험**: TypeScript 완벽 지원, 자동완성
4. **스타일 문법**: Tailwind와 유사한 직관적 문법
5. **테마 시스템**: 다크모드, 커스텀 테마 내장

### 마이그레이션 단계

#### Phase 1: 설치 및 설정
```bash
# Tamagui 설치
npm install @tamagui/core @tamagui/config @tamagui/animations-react-native

# 필요한 의존성
npm install @tamagui/font-inter @tamagui/themes @tamagui/shorthands
```

#### Phase 2: 설정 파일
```typescript
// tamagui.config.ts
import { createTamagui } from '@tamagui/core'
import { config } from '@tamagui/config/v3'

const tamaguiConfig = createTamagui({
  ...config,
  themes: {
    light: {
      background: '#FFFFFF',
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      // Glimpse 브랜드 컬러
    },
    dark: {
      background: '#1A1A1A',
      primary: '#FF8A8A',
      secondary: '#66E0D5',
    }
  }
})

export default tamaguiConfig
```

#### Phase 3: 컴포넌트 예시
```typescript
// Tamagui 스타일 예시
import { YStack, XStack, Text, Button } from 'tamagui'

export const HomeScreen = () => {
  return (
    <YStack flex={1} backgroundColor="$background" padding="$4">
      <Text fontSize="$6" fontWeight="bold" color="$primary">
        Glimpse
      </Text>
      
      <XStack space="$2" marginTop="$3">
        <Button 
          backgroundColor="$primary"
          pressStyle={{ scale: 0.95 }}
          animation="quick"
        >
          근처 그룹
        </Button>
      </XStack>
    </YStack>
  )
}
```

### 장점
- ✅ 모든 플랫폼에서 100% 동일하게 작동
- ✅ 애니메이션 내장
- ✅ 반응형 디자인 지원
- ✅ 접근성 자동 처리
- ✅ 성능 최적화 (스타일이 컴파일 타임에 처리)

### 단점
- ⚠️ 초기 학습 곡선
- ⚠️ 번들 크기 증가 (약 100KB)
- ⚠️ 마이그레이션 작업 필요

## Option B: 기존 시스템 개선

### 통합 테마 시스템 구축
```typescript
// styles/unifiedTheme.ts
import { Platform } from 'react-native'

export const createStyle = (styles: any) => {
  return Platform.select({
    web: styles.web || styles.default,
    ios: styles.ios || styles.default,
    android: styles.android || styles.default,
  })
}

// 사용 예시
const styles = createStyle({
  default: {
    container: {
      flex: 1,
      backgroundColor: colors.BACKGROUND,
      padding: 16,
    }
  },
  web: {
    container: {
      flex: 1,
      backgroundColor: colors.BACKGROUND,
      padding: 16,
      maxWidth: 768,
      marginHorizontal: 'auto',
    }
  }
})
```

## 결정 가이드

### Tamagui를 선택해야 하는 경우:
- 장기적인 유지보수가 중요한 경우
- 일관된 디자인 시스템이 필수인 경우
- 웹 버전이 중요한 비중을 차지하는 경우

### 기존 시스템을 개선해야 하는 경우:
- 빠른 출시가 목표인 경우
- 팀이 이미 현재 시스템에 익숙한 경우
- 번들 크기가 중요한 경우

## 추천 결정
**Tamagui 도입을 강력히 추천합니다.**

이유:
1. Glimpse는 데이팅 앱으로 UI/UX 일관성이 매우 중요
2. 웹/모바일 모두 지원해야 하는 요구사항
3. 장기적으로 유지보수 비용 절감
4. 더 나은 사용자 경험 제공 가능