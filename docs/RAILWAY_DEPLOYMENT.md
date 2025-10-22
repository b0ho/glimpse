# Railway 배포 가이드

## 🚀 Railway 배포 절차

### 1. Railway 대시보드에서 프로젝트 연결

1. [Railway Dashboard](https://railway.app/dashboard)에 로그인
2. 기존 PostgreSQL이 있는 프로젝트 선택
3. "New Service" → "GitHub Repo" 클릭
4. 이 저장소 선택 (`glimpse`)

### 2. 서비스 설정

Railway가 자동으로 `railway.json` 파일을 감지하여 설정됩니다:
- Root Directory: `/` (모노레포 루트)
- Build Command: `cd server && npm install && npm run build`
- Start Command: `cd server && npm run start:prod`

### 3. 환경변수 설정

Railway 대시보드에서 다음 환경변수를 설정하세요:

#### 필수 환경변수

```bash
# Database (이미 Railway PostgreSQL이 있으면 자동 설정됨)
DATABASE_URL=postgresql://postgres:[자동생성]@[자동생성].railway.app:5432/railway

# Authentication
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# App Configuration
NODE_ENV=production
API_PREFIX=/api/v1

# Vercel Frontend URLs (CORS 허용)
FRONTEND_URL=https://glimpse-web.vercel.app
MOBILE_URL=https://glimpse-mobile.vercel.app
ADMIN_URL=https://glimpse-admin.vercel.app

# Feature Flags
USE_DEV_AUTH=false
```

#### 선택적 환경변수 (필요시 추가)

```bash
# AWS S3 (파일 업로드)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET_NAME=

# Firebase (푸시 알림)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Payment (결제)
TOSSPAY_CLIENT_KEY=
TOSSPAY_SECRET_KEY=
KAKAOPAY_ADMIN_KEY=
STRIPE_SECRET_KEY=

# Email Service
SENDGRID_API_KEY=
EMAIL_FROM=noreply@glimpse.app

# Redis (세션/캐시)
REDIS_URL=redis://...

# Kakao API (지도/OCR)
KAKAO_REST_API_KEY=
```

### 4. 배포 실행

1. 환경변수 설정 완료 후 "Deploy" 클릭
2. 빌드 로그 확인 (약 3-5분 소요)
3. 배포 완료 후 Railway가 제공하는 URL 확인

### 5. 도메인 설정

1. Railway 서비스 설정에서 "Generate Domain" 클릭
2. 생성된 URL: `https://glimpse-server-production.up.railway.app`
3. 또는 커스텀 도메인 연결 가능

### 6. 배포 확인

```bash
# Health Check
curl https://[your-railway-url]/health

# API Documentation
https://[your-railway-url]/docs
```

## 📁 모노레포 구조

Railway는 `railway.json` 설정으로 모노레포를 완벽하게 지원합니다:

```
glimpse/                 # Railway가 감지하는 루트
├── railway.json        # Railway 설정 파일
├── server/            # NestJS 백엔드 (배포 대상)
├── mobile/            # React Native (Vercel)
├── web/               # 랜딩 페이지 (Vercel)
├── admin/             # 관리자 대시보드 (Vercel)
└── shared/            # 공유 타입 (서버 빌드시 포함)
```

## 🔍 모니터링

Railway 대시보드에서 확인 가능:
- 실시간 로그
- 메트릭 (CPU, Memory, Network)
- 배포 히스토리
- 환경변수 관리

## 💰 예상 비용

- **Server**: $5-10/월 (Hobby Plan)
- **Database**: 이미 사용중인 PostgreSQL
- **총 비용**: 약 $10-15/월

## 🚨 주의사항

1. **WebSocket 지원**: Railway는 WebSocket을 완벽 지원
2. **빌드 캐시**: 첫 배포 후 npm 캐시로 빠른 재배포
3. **자동 배포**: GitHub push 시 자동 배포
4. **스케일링**: 필요시 인스턴스 수동 조절 가능

## 🔗 관련 링크

- [Railway Documentation](https://docs.railway.app)
- [Railway CLI](https://docs.railway.app/develop/cli)
- [Railway Pricing](https://railway.app/pricing)