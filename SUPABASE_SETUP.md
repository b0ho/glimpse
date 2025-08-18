# Supabase + Vercel 배포 설정 가이드

## 1. Vercel 환경변수 설정

Vercel 대시보드에서 다음 환경변수를 설정해야 합니다:

### 필수 환경변수 (Supabase)

Supabase 대시보드 > Settings > Database에서 확인할 수 있습니다:

```bash
# Supabase Database Connection
# Connection Pooling을 사용하면 Vercel 서버리스 환경에서 연결 제한 문제 해결
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

# DIRECT_URL은 선택사항 - 마이그레이션이 필요할 때만 사용
# DIRECT_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres
```

### 기타 필수 환경변수

```bash
# Server
NODE_ENV=production
JWT_SECRET=your_secure_jwt_secret_key

# Clerk (인증)
CLERK_SECRET_KEY=sk_live_xxxxx
CLERK_PUBLISHABLE_KEY=pk_live_xxxxx

# AWS S3 (파일 업로드)
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET_NAME=glimpse-uploads

# Firebase (푸시 알림)
FIREBASE_PROJECT_ID=xxxxx
FIREBASE_CLIENT_EMAIL=xxxxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nxxxxx\n-----END PRIVATE KEY-----\n"

# 이메일 서비스
SENDGRID_API_KEY=xxxxx
EMAIL_FROM=noreply@glimpse.app

# SMS 서비스
SMS_API_KEY=xxxxx
SMS_API_SECRET=xxxxx

# 결제 게이트웨이
TOSSPAY_CLIENT_KEY=xxxxx
TOSSPAY_SECRET_KEY=xxxxx
KAKAOPAY_ADMIN_KEY=xxxxx
KAKAOPAY_CID=xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Kakao API
KAKAO_REST_API_KEY=xxxxx
```

## 2. Supabase 프로젝트 설정

### 2.1 Connection Pooling 활성화

1. Supabase 대시보드 > Settings > Database
2. Connection Pooling 섹션에서 "Enable connection pooling" 활성화
3. Pool Mode: "Transaction" 선택

### 2.2 Row Level Security (RLS) 설정

보안을 위해 테이블별 RLS 정책 설정:

```sql
-- users 테이블 RLS 예시
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
ON users FOR SELECT 
USING (auth.uid()::text = clerk_id);

CREATE POLICY "Users can update their own profile" 
ON users FOR UPDATE 
USING (auth.uid()::text = clerk_id);
```

## 3. Vercel 배포 프로세스

### 3.1 자동 배포 설정

1. Vercel 대시보드에서 프로젝트 선택
2. Settings > Git > Deploy Hooks 설정
3. GitHub 레포지토리와 연결

### 3.2 빌드 설정

Vercel 대시보드 > Settings > General:

- **Framework Preset**: Other
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Root Directory**: `server` (모노레포 구조인 경우)

### 3.3 Functions 설정

Vercel 대시보드 > Settings > Functions:

- **Function Region**: `arn1` (Seoul)
- **Function Max Duration**: `30s` (Pro 플랜)

## 4. 데이터베이스 마이그레이션

### 로컬에서 마이그레이션 실행 (초기 설정)

```bash
# .env에 DIRECT_URL 설정 후
cd server
npx prisma migrate deploy
npx prisma db seed  # 초기 데이터가 필요한 경우
```

### Vercel 배포 시 자동 마이그레이션

`package.json`의 `vercel-build` 스크립트가 자동으로 처리:
- `prisma generate`: Prisma Client 생성
- `prisma db push`: 스키마 동기화 (production에서는 migrate deploy 권장)

## 5. 모니터링 및 디버깅

### 5.1 Vercel Functions 로그

```bash
vercel logs --follow
```

### 5.2 Supabase 로그

Supabase 대시보드 > Logs > API Logs에서 확인

### 5.3 연결 제한 모니터링

Supabase 무료 플랜 제한:
- 동시 연결: 50개
- Storage: 1GB
- Bandwidth: 2GB/월

## 6. 트러블슈팅

### 문제: "too many connections" 에러

**해결책**:
1. `DATABASE_URL`에 `?pgbouncer=true&connection_limit=1` 추가
2. Prisma Client 싱글톤 패턴 사용

### 문제: Prisma 스키마 동기화 실패

**해결책**:
1. `DIRECT_URL` 환경변수 확인
2. 로컬에서 `npx prisma db push --force-reset` 실행 (주의: 데이터 삭제됨)

### 문제: CORS 에러

**해결책**:
서버 코드에 CORS 설정 추가:
```typescript
app.enableCors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-app.vercel.app'] 
    : true,
  credentials: true,
});
```

## 7. 성능 최적화

### 7.1 Edge Functions 활용

자주 호출되는 간단한 API는 Edge Functions로 분리:

```typescript
// api/health.ts
export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  return new Response('OK', { status: 200 });
}
```

### 7.2 데이터베이스 인덱스

자주 쿼리되는 필드에 인덱스 추가:

```prisma
model User {
  @@index([phoneNumber])
  @@index([clerkId])
  @@index([createdAt])
}
```

## 8. 보안 체크리스트

- [ ] 모든 환경변수가 Vercel에 설정되었는지 확인
- [ ] RLS 정책이 모든 테이블에 적용되었는지 확인
- [ ] API Rate Limiting 설정
- [ ] SQL Injection 방지 (Prisma 사용)
- [ ] 민감한 정보 로깅 방지

## 9. 배포 후 확인사항

1. **Health Check**: `https://your-api.vercel.app/health`
2. **Database 연결**: 기본 CRUD 작업 테스트
3. **인증 플로우**: 회원가입/로그인 테스트
4. **파일 업로드**: S3 연동 테스트
5. **WebSocket**: Socket.IO 연결 테스트

## 10. 추가 리소스

- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Prisma + Supabase Guide](https://www.prisma.io/docs/guides/database/supabase)
- [Vercel + Prisma Guide](https://vercel.com/guides/using-prisma-with-vercel)