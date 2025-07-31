# 프로젝트 구조 최적화 계획

## 현재 문제점 분석

### 1. 중복 파일
- **EncryptionService**: `EncryptionService.ts`와 `EncryptionServiceEnhanced.ts` 중복
- **User Routes**: `users.ts`와 `users-documented.ts` 중복
- **Auth Routes**: `auth.ts`와 `auth-secure.ts` 중복

### 2. 구조적 문제
- server/src/models 디렉토리가 비어있음 (Prisma 사용으로 불필요)
- 일부 서비스가 너무 크고 책임이 분산되어 있음
- mobile의 서비스 파일들이 중복된 구조를 가짐

### 3. 타입 정의 분산
- mobile/types와 shared/types에 타입 정의가 분산됨
- 일부 타입이 중복 정의되어 있을 가능성

## 최적화 방안

### 1. 중복 파일 통합
```
# EncryptionService 통합
- EncryptionServiceEnhanced.ts의 기능을 EncryptionService.ts로 통합
- 향상된 기능만 유지하고 레거시 코드 제거

# Routes 통합
- users-documented.ts를 users.ts로 통합 (Swagger 문서화 포함)
- auth-secure.ts의 보안 기능을 auth.ts로 통합
```

### 2. 폴더 구조 개선
```
📁 server/src/
├── 📁 api/                  # API 관련 (controllers + routes 통합)
│   ├── 📁 auth/
│   │   ├── controller.ts
│   │   ├── routes.ts
│   │   └── validation.ts
│   ├── 📁 users/
│   ├── 📁 groups/
│   ├── 📁 matches/
│   ├── 📁 chat/
│   ├── 📁 payments/
│   └── index.ts            # 라우트 통합
├── 📁 core/                # 핵심 비즈니스 로직
│   ├── 📁 services/
│   ├── 📁 repositories/   # DB 접근 계층 (옵션)
│   └── 📁 domain/         # 도메인 로직
├── 📁 infrastructure/     # 인프라 관련
│   ├── 📁 config/
│   ├── 📁 middleware/
│   ├── 📁 database/
│   └── 📁 external/       # 외부 서비스 통합
└── 📁 shared/             # 공통 유틸리티
    ├── 📁 utils/
    ├── 📁 constants/
    └── 📁 types/
```

### 3. Mobile 구조 개선
```
📁 mobile/
├── 📁 src/                 # 소스 디렉토리 추가
│   ├── 📁 features/       # 기능별 그룹화
│   │   ├── 📁 auth/
│   │   ├── 📁 chat/
│   │   ├── 📁 groups/
│   │   └── 📁 premium/
│   ├── 📁 shared/         # 공통 컴포넌트
│   └── 📁 core/           # 핵심 서비스
└── 📁 __tests__/          # 테스트 최상위로 이동
```

### 4. 서비스 레이어 리팩토링
- 큰 서비스를 작은 단위로 분할
- 단일 책임 원칙 적용
- 의존성 주입 패턴 도입 고려

### 5. 타입 시스템 통합
- shared/types를 단일 진실의 원천으로
- 자동 생성되는 Prisma 타입과 통합
- API 응답/요청 타입 자동 생성 도구 도입

## 실행 계획

### Phase 1: 중복 제거 (즉시)
1. EncryptionService 통합
2. 중복 라우트 파일 통합
3. 불필요한 파일 제거

### Phase 2: 구조 개선 (1주)
1. API 폴더 구조 재구성
2. Mobile src 디렉토리 도입
3. 테스트 파일 재배치

### Phase 3: 서비스 리팩토링 (2주)
1. 큰 서비스 분할
2. 의존성 주입 도입
3. 레포지토리 패턴 적용

### Phase 4: 타입 시스템 (1주)
1. 타입 정의 통합
2. 자동 생성 도구 설정
3. 타입 검증 강화

## 예상 효과
- 코드 중복 50% 감소
- 빌드 시간 20% 단축
- 유지보수성 향상
- 새 기능 개발 속도 30% 향상