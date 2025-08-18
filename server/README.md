# Glimpse Server

Glimpse 데이팅 앱의 백엔드 서버입니다.

## 기술 스택

- **프레임워크**: NestJS (Node.js)
- **데이터베이스**: Railway PostgreSQL + Prisma ORM  
- **인증**: Clerk + JWT
- **실시간 통신**: Socket.IO
- **파일 저장**: AWS S3
- **배포**: Vercel (서버리스)

## 환경 설정

### 필요한 환경변수

```bash
# Railway PostgreSQL Database
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@YOUR_HOST.proxy.rlwy.net:PORT/railway"

# Authentication  
CLERK_SECRET_KEY="sk_..."
JWT_SECRET="your-secret-key"
ENCRYPTION_KEY="your-32-byte-hex-key"

# AWS S3 (선택사항)
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET_NAME="..."

# Firebase (선택사항)
FIREBASE_PROJECT_ID="..."
```

## 개발 환경 설정

```bash
# 의존성 설치
npm install

# Railway 데이터베이스 마이그레이션
npm run db:migrate:railway

# 개발 서버 실행
npm run dev
```

## 주요 명령어

```bash
# 개발
npm run dev                 # 개발 서버 실행
npm run build              # 빌드
npm run typecheck          # 타입 체크
npm run lint               # 린트

# 데이터베이스 관리
npm run db:generate        # Prisma 클라이언트 생성
npm run db:push            # 스키마 동기화
npm run db:pull            # 스키마 가져오기
npm run db:studio          # DB 관리 UI
npm run db:migrate:railway # Railway 전체 마이그레이션 (generate + push)
npm run db:reset           # 데이터베이스 리셋

# 시드 데이터
npm run seed               # 기본 시드 데이터
npm run seed:domains       # 회사 도메인 데이터
npm run seed:english       # 영어 데이터
npm run seed:all           # 모든 시드 데이터
npm run seed:railway       # Railway 전체 테스트 데이터 (풍부한 데이터)
npm run seed:railway:quick # Railway 빠른 테스트 데이터 (30명 사용자)

# 테스트
npm run test               # 단위 테스트
npm run test:e2e           # E2E 테스트
```

## Railway PostgreSQL 설정

### 완전한 설정 (스키마 + 테스트 데이터)
```bash
# Railway URL 설정 후 전체 설정 (마이그레이션 + 시드 데이터)
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@YOUR_HOST.proxy.rlwy.net:PORT/railway"
npm run db:setup:railway
```

### 단계별 설정

#### 1. 마이그레이션만
```bash
# Railway URL 설정 후 스키마만 생성
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@YOUR_HOST.proxy.rlwy.net:PORT/railway"
npm run db:migrate:railway
```

#### 2. 테스트 데이터 추가
```bash
# 풍부한 테스트 데이터 생성 (전체 앱 시나리오 커버)
npm run seed:railway
```

### 수동 마이그레이션
```bash
# 1단계: 환경변수 설정
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@YOUR_HOST.proxy.rlwy.net:PORT/railway"

# 2단계: Prisma 클라이언트 생성
npm run db:generate

# 3단계: 스키마 적용
npm run db:push

# 4단계: 테스트 데이터 생성
npm run seed:railway

# 5단계: 확인 (선택사항)
npm run db:studio
```

### Railway 설정 확인
- **Dashboard**: https://railway.app/dashboard
- **무료 플랜**: 월 $5 크레딧, 500MB RAM
- **연결 상태 확인**: `/api/db-status`

## API 엔드포인트

### 서버 상태
- **Health Check**: `GET /api/health`
- **Database Status**: `GET /api/db-status`
- **Database Migration**: `POST /api/db-migrate`

### 주요 기능
- **Groups**: `GET /api/groups` (dev: `x-dev-auth: true` 헤더 필요)
- **Users**: `/api/users/*`
- **Matching**: `/api/matching/*`
- **Chat**: `/api/chat/*`

## 배포

### Vercel 배포
- **Production**: https://glimpse-server-psi.vercel.app/
- **자동 배포**: Git push 시 자동 트리거
- **환경변수**: Vercel Dashboard에서 설정

### Railway 데이터베이스
- **Provider**: Railway PostgreSQL
- **Connection**: 외부 URL (`.proxy.rlwy.net`)
- **스키마**: 42개 테이블 (User, Group, Match, Chat 등)

## 문제 해결

### 데이터베이스 연결 문제
```bash
# 연결 테스트
curl https://glimpse-server-psi.vercel.app/api/db-status

# Groups API 테스트
curl -H "x-dev-auth: true" https://glimpse-server-psi.vercel.app/api/groups
```

### Railway URL 확인
```bash
# Railway Dashboard → PostgreSQL → Connect 탭에서 확인
# PUBLIC URL 사용 (internal URL 아님)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@YOUR_HOST.proxy.rlwy.net:PORT/railway"
```

⚠️ **보안 주의사항**
- **절대 실제 데이터베이스 URL을 코드에 하드코딩하지 마세요**
- 환경변수 파일(.env)을 .gitignore에 추가하세요
- Vercel Dashboard에서만 환경변수를 설정하세요
- 로컬 개발: `.env` 파일 사용
- 프로덕션: Vercel 환경변수 사용

## 라이선스

MIT