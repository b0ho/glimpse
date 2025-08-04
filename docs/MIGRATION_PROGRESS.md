# Express to NestJS Migration Progress

## Overview
서버를 Express에서 NestJS로 마이그레이션하는 진행 상황을 추적합니다.

## Migration Status

### ✅ Completed Modules

#### Core Infrastructure Services
- **EncryptionService** ✅
  - AES-256-GCM 암호화/복호화
  - 비밀번호 해싱 (PBKDF2)
  - HMAC 서명 생성/검증
  - 매칭 메시지 암호화
  - 토큰 생성
  - Location: `server/src/core/encryption/`

- **CacheService** ✅
  - Redis 기반 캐싱
  - 사용자/그룹/매칭별 캐시 관리
  - 캐시 무효화 패턴
  - Cacheable/InvalidateCache 데코레이터
  - Location: `server/src/core/cache/`

- **EmailService** ✅
  - 이메일 템플릿 시스템
  - 다중 프로바이더 지원 (SES, SendGrid, SMTP)
  - 템플릿 기반 이메일 (인증, 매칭, 알림 등)
  - 이메일 활동 로깅
  - Location: `server/src/core/email/`

- **SmsService** ✅
  - SMS 발송 시스템
  - 다중 프로바이더 지원 (Twilio, Aligo, Toast)
  - 인증 코드 발송 및 검증
  - SMS 활동 로깅
  - Location: `server/src/core/sms/`

- **FirebaseService** ✅
  - FCM 푸시 알림
  - 멀티 디바이스 지원
  - 토픽 기반 알림
  - 예약 알림
  - FCM 토큰 관리
  - Location: `server/src/core/firebase/`

- **MessageQueueService** ✅
  - Redis 기반 메시지 큐
  - 오프라인 메시지 저장
  - 실패한 작업 재시도
  - 배치 작업 큐
  - 지연된 작업 스케줄링
  - Location: `server/src/core/message-queue/`

- **CronService** ✅
  - 주기적 작업 스케줄링
  - 만료된 스토리 정리
  - 결제 재시도 처리
  - 일일 통계 업데이트
  - 크레딧 리셋
  - 프리미엄 만료 처리
  - Location: `server/src/core/cron/`

- **OcrService** ✅
  - 문서 인식 (Naver OCR, Google Vision)
  - 회사 카드 인증
  - 신분증 인증
  - 학생증 인증
  - 문서 품질 검증
  - Location: `server/src/core/ocr/`

- **CompanyVerificationService** ✅
  - 회사 이메일 도메인 인증
  - OCR 기반 문서 인증
  - 인증 코드 관리
  - 수동 검토 시스템
  - 인증 상태 캐싱
  - Location: `server/src/core/company-verification/`

#### Authentication & User Management
- **AuthService** ✅
  - 전화번호 인증 (SMS 서비스 통합)
  - Clerk 통합 (사용자 동기화)
  - JWT 토큰 생성/검증 (레거시 지원)
  - 세션 관리 및 캐싱
  - 사용자 생성/업데이트
  - Location: `server/src/auth/`
  
- **UserService** ✅
  - 사용자 프로필 관리
  - 사용자 추천 시스템 (호환성 점수 계산)
  - 크레딧/프리미엄 관리
  - 사용자 통계
  - 계정 삭제 (소프트 삭제)
  - Location: `server/src/user/`

- **AuthGuard** ✅
  - JWT/Clerk 토큰 검증
  - 자동 사용자 생성
  - Location: `server/src/auth/guards/`

- **Decorators** ✅
  - @CurrentUser() - 현재 사용자 정보
  - @CurrentUserId() - 현재 사용자 ID
  - Location: `server/src/auth/decorators/`

#### Payment System
- **PaymentService** ✅
  - TossPay 통합 (결제 생성, 처리, 환불)
  - KakaoPay 통합 (결제 생성, 처리, 환불)
  - Stripe 통합 (웹훅 처리)
  - 구독 관리 (생성, 취소, 조회)
  - 결제 웹훅 처리 (서명 검증 포함)
  - 크레딧 구매 시스템
  - 프리미엄 혜택 자동 적용
  - Location: `server/src/payment/`

- **PaymentController** ✅
  - 결제 생성/처리 엔드포인트
  - 구독 관리 엔드포인트
  - 웹훅 핸들러 (Toss, Kakao, Stripe)
  - 결제 콜백 처리
  - Location: `server/src/payment/`

#### Chat & Real-time
- **ChatService** ✅
  - 메시지 암호화/복호화
  - 채팅 요약 및 읽지 않은 메시지 수
  - 메시지 반응 시스템
  - 타이핑 상태 관리 (Redis 기반)
  - 채팅 백업 생성
  - Location: `server/src/chat/`

- **ChatController** ✅
  - 메시지 CRUD 엔드포인트
  - 읽음 처리 및 통계
  - 메시지 검색
  - Location: `server/src/chat/`

- **ChatGateway** ✅
  - Socket.IO WebSocket 게이트웨이
  - 실시간 메시지 전송
  - 타이핑 상태 브로드캐스트
  - 읽음 표시 실시간 업데이트
  - 메시지 반응 실시간 업데이트
  - Location: `server/src/chat/`

- **WsAuthGuard** ✅
  - WebSocket 연결 인증
  - JWT/Clerk 토큰 검증
  - Location: `server/src/auth/guards/`

### 🚧 In Progress

(현재 그룹 및 매칭 서비스 마이그레이션 진행 예정)

### ❌ Not Started
  
#### Group & Matching
- **GroupService**
  - 그룹 CRUD
  - 그룹 타입 관리
  
- **MatchingService**
  - 매칭 알고리즘
  - 좋아요 시스템
  - 매칭 통계

#### File & Media
- **FileUploadService**
  - AWS S3 통합
  - 이미지 처리
  
- **StoryService**
  - 스토리 업로드
  - 스토리 만료 관리

#### Admin & Moderation
- **AdminService**
  - 관리자 대시보드
  - 사용자 관리
  
- **ContentFilterService**
  - 콘텐츠 필터링
  - 신고 관리

#### Location & Communication
- **LocationService**
  - 위치 기반 매칭
  - Kakao Maps 통합
  
- **VideoCallService**
  - 영상통화 기능
  - WebRTC 통합

## Migration Guidelines

### 1. Module Structure
```
server/src/
├── core/               # 핵심 인프라 서비스
│   ├── cache/
│   ├── encryption/
│   ├── email/
│   ├── sms/
│   ├── firebase/
│   ├── message-queue/
│   ├── cron/
│   ├── ocr/
│   ├── company-verification/
│   └── prisma/
├── auth/              # 인증 관련
├── user/              # 사용자 관리
├── payment/           # 결제 시스템
├── chat/              # 채팅
├── group/             # 그룹
├── match/             # 매칭
└── ...
```

### 2. Service Migration Pattern
1. NestJS 모듈 생성: `nest g module [name]`
2. NestJS 서비스 생성: `nest g service [name]`
3. Express 서비스 로직 마이그레이션
4. 의존성 주입 패턴 적용
5. 테스트 작성
6. 문서 업데이트

### 3. Common Changes
- `process.env` → `ConfigService` 
- Singleton 패턴 → NestJS DI
- Express 미들웨어 → NestJS Guards/Interceptors
- 콜백 → async/await
- `prisma` 직접 사용 → `PrismaService` 주입

### 4. Testing Strategy
- 각 서비스별 유닛 테스트
- 통합 테스트
- E2E 테스트

## Next Steps
1. ~~인프라 서비스 마이그레이션~~ ✅
2. ~~인증 시스템 (Auth, User) 마이그레이션~~ ✅
3. 결제 시스템 마이그레이션
4. 실시간 서비스 (Chat, Notification) 마이그레이션
5. 비즈니스 로직 (Group, Match) 마이그레이션
6. 파일 업로드 및 미디어 서비스 마이그레이션
7. 관리자 및 모더레이션 서비스 마이그레이션
8. 위치 및 커뮤니케이션 서비스 마이그레이션

## Notes
- 마이그레이션 중 기존 Express 서버는 유지
- 점진적 마이그레이션 전략 사용
- 각 모듈 완료 시 테스트 필수
- Global 모듈 사용으로 의존성 주입 간소화
- 환경 변수는 ConfigService를 통해 접근