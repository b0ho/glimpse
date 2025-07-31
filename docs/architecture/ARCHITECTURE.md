# Glimpse 시스템 아키텍처

## 🏗 전체 아키텍처 개요

### 시스템 구성도

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Client Layer                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐ │
│  │   iOS App       │     │  Android App     │     │   Web Admin     │ │
│  │ (React Native)  │     │ (React Native)   │     │   (Next.js)     │ │
│  └────────┬────────┘     └────────┬─────────┘     └────────┬────────┘ │
│           │                       │                          │          │
└───────────┼───────────────────────┼──────────────────────────┼──────────┘
            │                       │                          │
            └───────────────────────┴──────────────────────────┘
                                   │
                                   │ HTTPS/WSS
                                   │
┌─────────────────────────────────┴─────────────────────────────────────┐
│                           API Gateway Layer                            │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │   Nginx      │    │ Load Balancer│    │   CloudFlare CDN    │  │
│  │ (Reverse     │────│   (AWS ALB)  │────│   (Static Assets)   │  │
│  │  Proxy)      │    └──────────────┘    └──────────────────────┘  │
│  └──────────────┘                                                    │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                   │
┌─────────────────────────────────┴─────────────────────────────────────┐
│                          Application Layer                             │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │  Express.js     │    │  Socket.IO   │    │  Background      │   │
│  │  REST API       │────│  WebSocket   │────│  Jobs (Bull)     │   │
│  │  Server         │    │  Server      │    │                  │   │
│  └─────────────────┘    └──────────────┘    └──────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Middleware Layer                          │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │ Auth │ Rate Limiter │ CORS │ Validator │ Error Handler     │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                   │
┌─────────────────────────────────┴─────────────────────────────────────┐
│                           Data Layer                                   │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐    ┌──────────────┐    ┌────────────────────┐    │
│  │ PostgreSQL   │    │    Redis     │    │   AWS S3           │    │
│  │ (Primary DB) │────│   (Cache/    │────│  (File Storage)    │    │
│  │              │    │   Sessions)  │    │                    │    │
│  └──────────────┘    └──────────────┘    └────────────────────┘    │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                   │
┌─────────────────────────────────┴─────────────────────────────────────┐
│                       External Services                                │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │
│  │    Clerk     │ │   Stripe/    │ │   Firebase   │ │  Kakao/    │ │
│  │    (Auth)    │ │ TossPay/Kakao│ │    (FCM)     │ │  Naver     │ │
│  │              │ │   (Payments) │ │              │ │   APIs     │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘ │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

## 🎯 핵심 설계 원칙

### 1. 모놀리식 모노레포 구조
- **단일 저장소**: 프론트엔드, 백엔드, 공통 코드 통합 관리
- **코드 재사용**: shared 패키지를 통한 타입 및 유틸리티 공유
- **일관된 개발 경험**: 통합된 빌드/테스트/배포 파이프라인

### 2. 타입 안정성
- **TypeScript 전체 적용**: 컴파일 타임 타입 체크
- **공유 타입 정의**: frontend-backend 간 API 계약 보장
- **Strict Mode**: 엄격한 타입 검사로 런타임 오류 최소화

### 3. 확장성 고려
- **수평적 확장**: 로드 밸런서를 통한 서버 인스턴스 확장
- **캐싱 전략**: Redis를 통한 성능 최적화
- **비동기 처리**: 백그라운드 작업 큐 활용

### 4. 보안 우선
- **인증/인가 분리**: Clerk + JWT 기반 보안
- **데이터 암호화**: 민감 정보 AES-GCM 암호화
- **API 보안**: Rate limiting, CORS, 입력 검증

## 🔧 기술 스택 상세

### Frontend (Mobile)
```typescript
// 핵심 기술
- React Native 0.79.x + Expo SDK 50
- TypeScript 5.x (strict mode)
- Zustand (상태 관리)
- React Navigation 6.x
- Socket.IO Client
- Expo SecureStore (보안 저장소)

// UI/UX
- React Native Reanimated 3
- React Native Gesture Handler
- React Native Paper (UI 컴포넌트)
- Lottie React Native (애니메이션)

// 개발 도구
- ESLint + Prettier
- Jest + React Native Testing Library
- Playwright (E2E)
```

### Backend (Server)
```typescript
// 핵심 기술
- Node.js 20.x LTS
- Express.js 4.x
- TypeScript 5.x
- Prisma ORM 5.x
- Socket.IO 4.x

// 데이터베이스
- PostgreSQL 14.x (메인 DB)
- Redis 7.x (캐시/세션)
- AWS S3 (파일 저장소)

// 보안/인증
- Clerk SDK
- JSON Web Tokens
- bcrypt (비밀번호 해싱)
- helmet (보안 헤더)

// 외부 서비스 연동
- Stripe SDK
- TossPay API
- Firebase Admin SDK
- AWS SDK
- Kakao/Naver API
```

## 📁 프로젝트 구조

### 모노레포 구조
```
glimpse-fe/
├── mobile/                 # React Native 앱
│   ├── components/        # 재사용 가능한 UI 컴포넌트
│   ├── screens/          # 화면 컴포넌트
│   ├── navigation/       # 네비게이션 설정
│   ├── services/         # API 및 외부 서비스
│   ├── store/           # Zustand 상태 관리
│   ├── utils/           # 유틸리티 함수
│   └── types/           # 모바일 전용 타입
│
├── server/                # Node.js 백엔드
│   ├── src/
│   │   ├── controllers/  # HTTP 요청 핸들러
│   │   ├── services/    # 비즈니스 로직
│   │   ├── middleware/  # Express 미들웨어
│   │   ├── routes/      # API 라우트 정의
│   │   ├── utils/       # 헬퍼 함수
│   │   └── index.ts     # 서버 진입점
│   ├── prisma/          # DB 스키마 및 마이그레이션
│   └── tests/           # 테스트 파일
│
├── shared/               # 공유 코드
│   ├── types/           # 공통 타입 정의
│   ├── constants/       # 공통 상수
│   └── utils/           # 공통 유틸리티
│
└── package.json         # 워크스페이스 설정
```

## 🔄 데이터 플로우

### 1. 인증 플로우
```
사용자 → SMS 인증 → Clerk → JWT 발급 → 앱 저장 → API 요청 시 포함
```

### 2. 매칭 플로우
```
좋아요 전송 → 익명 ID 생성 → DB 저장 → 상대방 알림
↓
상호 좋아요 확인 → 매칭 생성 → 닉네임 공개 → 채팅방 활성화
```

### 3. 실시간 메시징 플로우
```
메시지 작성 → 암호화 → Socket.IO 전송 → 서버 검증
↓
DB 저장 → 수신자에게 전달 → 복호화 → 화면 표시
```

### 4. 결제 플로우
```
구매 요청 → 결제 게이트웨이 → 웹훅 수신 → DB 업데이트
↓
사용자 권한 갱신 → 프리미엄 기능 활성화
```

## 🏗 주요 설계 패턴

### 1. Repository Pattern (Backend)
```typescript
// 데이터 접근 계층 추상화
class UserRepository {
  async findById(id: string): Promise<User> {
    return prisma.user.findUnique({ where: { id } });
  }
  
  async create(data: CreateUserDto): Promise<User> {
    return prisma.user.create({ data });
  }
}
```

### 2. Service Layer Pattern
```typescript
// 비즈니스 로직 캡슐화
class MatchingService {
  constructor(
    private userRepo: UserRepository,
    private likeRepo: LikeRepository
  ) {}
  
  async createMatch(user1Id: string, user2Id: string) {
    // 복잡한 매칭 로직
  }
}
```

### 3. Middleware Chain (Express)
```typescript
// 요청 처리 파이프라인
app.use(authenticate);    // 인증
app.use(validateInput);   // 입력 검증
app.use(rateLimiter);    // 속도 제한
app.use(errorHandler);   // 에러 처리
```

### 4. Observer Pattern (Frontend)
```typescript
// Zustand를 통한 상태 관리
const useAuthStore = create((set) => ({
  user: null,
  login: async (credentials) => {
    const user = await authService.login(credentials);
    set({ user });
  }
}));
```

## 🔐 보안 아키텍처

### 1. 인증/인가
- **다단계 인증**: SMS → Clerk → JWT
- **토큰 관리**: Access Token (15분) + Refresh Token (7일)
- **권한 기반 접근 제어**: RBAC 구현

### 2. 데이터 보안
- **전송 암호화**: HTTPS/WSS 필수
- **저장 암호화**: 민감 데이터 AES-256
- **키 관리**: AWS KMS 또는 환경 변수

### 3. API 보안
- **Rate Limiting**: IP 기반 + 사용자 기반
- **CORS 정책**: 화이트리스트 도메인만 허용
- **입력 검증**: 모든 사용자 입력 sanitize

### 4. 익명성 보장
- **익명 ID 시스템**: 매칭 전 실제 ID 숨김
- **단계적 정보 공개**: 상호 동의 시에만 공개
- **데이터 최소화**: 필요한 정보만 수집

## 🚀 확장성 전략

### 1. 서버 확장
- **수평 확장**: 로드 밸런서 + 다중 인스턴스
- **오토 스케일링**: CPU/메모리 기반 자동 확장
- **무상태 설계**: 세션은 Redis에 저장

### 2. 데이터베이스 확장
- **읽기 복제본**: 읽기 전용 쿼리 분산
- **파티셔닝**: 시간/사용자 기반 테이블 분할
- **인덱싱 최적화**: 쿼리 성능 향상

### 3. 캐싱 전략
- **Redis 캐싱**: 자주 조회되는 데이터
- **CDN**: 정적 자산 글로벌 배포
- **브라우저 캐싱**: 적절한 캐시 헤더 설정

### 4. 비동기 처리
- **메시지 큐**: Bull/BullMQ 사용
- **백그라운드 작업**: 이메일, 푸시 알림
- **배치 처리**: 통계 집계, 정리 작업

## 📊 모니터링 및 관찰성

### 1. 애플리케이션 모니터링
- **APM**: New Relic 또는 DataDog
- **에러 추적**: Sentry
- **로그 집계**: ELK Stack 또는 CloudWatch

### 2. 인프라 모니터링
- **서버 메트릭**: CPU, 메모리, 디스크
- **데이터베이스 모니터링**: 쿼리 성능, 연결 풀
- **알림 설정**: 임계값 초과 시 알림

### 3. 비즈니스 메트릭
- **사용자 분석**: Mixpanel 또는 Amplitude
- **매칭 성공률**: 커스텀 대시보드
- **수익 추적**: 결제 게이트웨이 연동

## 🔄 CI/CD 파이프라인

### 1. 개발 워크플로우
```yaml
# GitHub Actions 예시
- 코드 푸시
- 자동 테스트 실행
- 타입 체크
- 린트 검사
- 빌드 성공 시 스테이징 배포
```

### 2. 배포 전략
- **Blue-Green 배포**: 무중단 배포
- **카나리 배포**: 점진적 롤아웃
- **롤백 전략**: 문제 발생 시 즉시 롤백

### 3. 환경 관리
- **개발**: 로컬 개발 환경
- **스테이징**: 프로덕션 유사 환경
- **프로덕션**: 실제 서비스 환경

## 🎯 성능 최적화

### 1. Frontend 최적화
- **코드 스플리팅**: 동적 import 활용
- **이미지 최적화**: WebP 포맷, lazy loading
- **번들 크기 최소화**: Tree shaking

### 2. Backend 최적화
- **쿼리 최적화**: N+1 문제 해결
- **연결 풀링**: DB 연결 재사용
- **압축**: gzip/brotli 응답 압축

### 3. 네트워크 최적화
- **HTTP/2**: 멀티플렉싱 활용
- **Keep-Alive**: 연결 재사용
- **CDN 활용**: 지역별 콘텐츠 배포