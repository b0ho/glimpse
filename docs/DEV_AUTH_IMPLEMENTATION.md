# 개발 모드 인증 우회 시스템 구현

## 개요
개발 환경에서 Clerk 인증을 우회하여 빠르게 테스트할 수 있는 시스템을 구현했습니다.

## 주요 특징

### 1. 환경 변수 기반 제어
```env
EXPO_PUBLIC_USE_DEV_AUTH=true
EXPO_PUBLIC_DEV_ACCOUNT_TYPE=admin-user
```

### 2. 3가지 슈퍼 계정
- `dev-user`: 일반 사용자 (무료)
- `premium-user`: 프리미엄 사용자
- `admin-user`: 관리자 (모든 권한)

### 3. 개발 모드 패널
- 화면 우측 하단 플로팅 버튼
- 실시간 계정 전환
- 디버그 정보 표시

## 구현 파일

### 1. `/mobile/config/dev.config.ts`
- 개발 모드 설정 및 슈퍼 계정 정의
- 환경 변수 확인 로직
- 계정 전환 지원 (localStorage)

### 2. `/mobile/hooks/useDevAuth.ts`
- Clerk useAuth를 대체하는 훅
- 조건부 인증 우회
- 개발/프로덕션 자동 전환

### 3. `/mobile/components/DevModePanel.tsx`
- 개발 모드 UI 컴포넌트
- 계정 정보 표시
- 계정 전환 기능

### 4. 수정된 파일들
- `App.tsx`: 개발 모드 패널 추가
- `AppNavigator.tsx`: useDevAuth 사용
- `ProfileScreen.tsx`: useDevAuth 사용
- `DeleteAccountScreen.tsx`: useDevAuth 사용
- `shared/types/index.ts`: isAdmin 필드 추가

## 사용 방법

1. **환경 변수 설정** (`.env`)
   ```
   EXPO_PUBLIC_USE_DEV_AUTH=true
   EXPO_PUBLIC_DEV_ACCOUNT_TYPE=admin-user
   ```

2. **앱 실행**
   ```bash
   npm run ios     # iOS
   npm run android # Android
   npm run web     # 웹 (Expo SDK 53에서는 제한적)
   ```

3. **계정 전환**
   - 개발 모드 패널의 계정 버튼 클릭
   - 또는 .env 파일 수정 후 재시작

## 보안 고려사항
- 프로덕션 빌드에서는 자동으로 비활성화
- 환경 변수로 on/off 제어
- 실제 인증 시스템에 영향 없음

## 향후 개선사항
- 더 많은 테스트 시나리오 추가
- 개발 모드 전용 API 모킹
- 테스트 데이터 자동 생성