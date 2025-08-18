# Vercel 데이터베이스 및 Clerk 설정 가이드

## 1. 무료 PostgreSQL 데이터베이스 옵션

### 옵션 A: Supabase (추천)
1. https://supabase.com 에서 무료 계정 생성
2. 새 프로젝트 생성
3. Settings > Database 에서 Connection String 복사
   - `DATABASE_URL`: Connection string (Transaction mode)
   - `DIRECT_URL`: Connection string (Session mode)

### 옵션 B: Neon
1. https://neon.tech 에서 무료 계정 생성
2. 새 프로젝트 생성
3. Dashboard에서 Connection string 복사

### 옵션 C: Railway
1. https://railway.app 에서 계정 생성
2. PostgreSQL 서비스 추가
3. Variables 탭에서 DATABASE_URL 복사

## 2. Vercel 환경변수 설정

### 방법 1: Vercel Dashboard (추천)
1. https://vercel.com 로그인
2. 프로젝트 선택 (glimpse-server)
3. Settings > Environment Variables
4. 다음 변수 추가:

```
DATABASE_URL=[Supabase/Neon/Railway PostgreSQL URL]
DIRECT_URL=[Direct connection URL]
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CLERK_SECRET_KEY=sk_test_ahquE3eARWKYofKL7BQoMLfHl7474tiTuMSm1twG4C
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bGlrZWQtZG9nLTkzLmNsZXJrLmFjY291bnRzLmRldiQ
NODE_ENV=production
```

### 방법 2: Vercel CLI
```bash
# 로그인
vercel login

# 프로젝트 링크
vercel link

# 환경변수 추가
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production
vercel env add JWT_SECRET production
vercel env add CLERK_SECRET_KEY production
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
```

## 3. 데이터베이스 마이그레이션

```bash
# Prisma 스키마 푸시
npx prisma db push

# 시드 데이터 생성 (선택사항)
npx prisma db seed
```

## 4. 재배포

```bash
# Vercel 재배포
vercel --prod

# 또는 GitHub 푸시로 자동 배포
git push origin main
```

## 5. 테스트

```bash
# Health check
curl https://glimpse-server.vercel.app/health

# Database health check
curl https://glimpse-server.vercel.app/health/db

# API 테스트 (with dev auth)
curl https://glimpse-server.vercel.app/api/v1/groups \
  -H "x-dev-auth: true"
```

## 6. Clerk 인증 테스트

### Frontend 설정
모바일 앱의 `.env`에 추가:
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bGlrZWQtZG9nLTkzLmNsZXJrLmFjY291bnRzLmRldiQ
```

### 테스트 시나리오
1. 회원가입 테스트
2. 로그인 테스트
3. JWT 토큰 발급 확인
4. 보호된 API 엔드포인트 접근 테스트

## 현재 상태

- ✅ Vercel 배포 완료
- ✅ Clerk 환경변수 설정
- ⏳ PostgreSQL 데이터베이스 연결 필요
- ⏳ 데이터베이스 마이그레이션 필요
- ⏳ 전체 시스템 통합 테스트 필요

## 문제 해결

### 500 에러 발생 시
1. Vercel Functions 로그 확인
2. 환경변수 설정 확인
3. 데이터베이스 연결 확인

### 데이터베이스 연결 실패 시
1. Connection string 형식 확인
2. SSL 설정 확인 (`?sslmode=require` 추가)
3. IP 화이트리스트 확인 (Supabase/Neon)