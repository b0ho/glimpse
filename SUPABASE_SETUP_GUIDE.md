# Supabase 연결 및 배포 가이드

## 1. Supabase 프로젝트 설정

### 1.1 Supabase 대시보드에서 설정
1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **Settings > Database** 메뉴로 이동
4. **Connection string** 정보 복사

### 1.2 연결 문자열 형식
```bash
# Direct connection (로컬 개발용)
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# Connection pooling (Vercel 배포용 - 권장)
DATABASE_URL="postgresql://postgres.pooler:[password]@[project-ref]-pooler.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

## 2. Vercel 환경 변수 설정

### 2.1 Vercel Dashboard 설정
1. [Vercel Dashboard](https://vercel.com/dashboard)에서 프로젝트 선택
2. **Settings > Environment Variables** 메뉴로 이동
3. 다음 환경 변수들을 추가:

```bash
# 필수 - 데이터베이스 연결
DATABASE_URL=postgresql://postgres.pooler:[password]@[project-ref]-pooler.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1

# 필수 - 기본 설정
NODE_ENV=production
PORT=3001

# 필수 - 보안 키들
JWT_SECRET=your_production_jwt_secret_32_chars_minimum
ENCRYPTION_KEY=your_production_encryption_key_32_chars_hex

# 필수 - Clerk 인증
CLERK_SECRET_KEY=sk_live_your_production_clerk_secret
CLERK_PUBLISHABLE_KEY=pk_live_your_production_clerk_publishable

# 선택사항 - AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET_NAME=your_bucket_name

# 선택사항 - Firebase
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key

# 선택사항 - Redis
REDIS_URL=your_redis_connection_string

# 프로덕션 설정
DEV_AUTH_ENABLED=false
```

### 2.2 Supabase Integration (자동 설정)
1. Vercel Dashboard에서 **Integrations** 탭 클릭
2. **Supabase** 통합 추가
3. 자동으로 `DATABASE_URL` 및 관련 환경 변수 설정됨

## 3. 데이터베이스 마이그레이션

### 3.1 자동 배포 (권장)
Vercel 배포 시 자동으로 실행됩니다:
```bash
# vercel-build 스크립트에 포함됨
npm run vercel-build  # prisma generate && nest build
```

### 3.2 수동 마이그레이션 (필요시)
```bash
# 로컬에서 테스트
npm run deploy:db

# 또는 직접 실행
npx prisma generate
npx prisma db push --accept-data-loss
```

### 3.3 API를 통한 마이그레이션
배포 후 다음 엔드포인트로 수동 마이그레이션 가능:
```bash
POST https://glimpse-server-psi.vercel.app/api/db-migrate
Authorization: Bearer your_deployment_token
```

## 4. 연결 확인

### 4.1 Health Check
```bash
curl https://glimpse-server-psi.vercel.app/api/health
```

예상 응답:
```json
{
  "status": "ok",
  "timestamp": "2025-01-24T...",
  "environment": "production",
  "message": "Glimpse API is running on Vercel",
  "version": "1.0.0",
  "endpoints": {
    "health": "/api/health",
    "docs": "/api/docs",
    "api": "/api/v1"
  }
}
```

### 4.2 데이터베이스 연결 테스트
```bash
# 로컬에서 확인
npx prisma db pull  # 스키마 동기화 확인
npx prisma studio   # 데이터베이스 브라우저 열기
```

## 5. 문제 해결

### 5.1 일반적인 오류들

**Connection Timeout**
```bash
# 해결: connection_limit 추가
DATABASE_URL="...?pgbouncer=true&connection_limit=1"
```

**Too Many Connections**
```bash
# 해결: Connection pooling 사용
DATABASE_URL="postgresql://postgres.pooler:..."
```

**Environment Variable Not Found**
```bash
# 해결: Vercel 환경 변수 재확인
# 필요시 프로젝트 재배포
```

### 5.2 로그 확인
```bash
# Vercel 함수 로그
vercel logs glimpse-server-psi

# 로컬 개발 로그
npm run dev
```

### 5.3 재배포 방법
```bash
# 코드 변경 후
git add .
git commit -m "Update database configuration"
git push origin main  # Vercel 자동 배포 트리거
```

## 6. 보안 고려사항

### 6.1 환경 변수 보안
- 모든 비밀 키는 최소 32자 이상
- 프로덕션과 개발 환경 분리
- 정기적인 키 로테이션

### 6.2 데이터베이스 보안
- Connection pooling 사용
- 최소 권한 원칙 적용
- 정기적인 백업 설정

### 6.3 네트워크 보안
- Supabase Row Level Security (RLS) 활성화
- API 엔드포인트 인증 강화
- Rate limiting 적용

## 7. 모니터링 및 유지보수

### 7.1 성능 모니터링
- Supabase Dashboard에서 쿼리 성능 확인
- Vercel Analytics를 통한 API 응답 시간 모니터링

### 7.2 백업 및 복구
- Supabase 자동 백업 설정 확인
- 정기적인 데이터 익스포트

### 7.3 업데이트 절차
1. 로컬에서 스키마 변경 테스트
2. Prisma 마이그레이션 파일 생성
3. 스테이징 환경에서 검증
4. 프로덕션 배포

---

## 참고 링크
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Glimpse Project Repository](https://github.com/your-repo/glimpse)