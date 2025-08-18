# Vercel + Supabase 완전 설정 가이드

## 🔍 현재 상황 분석

### 문제점:
1. **Vercel 서버**: 기본 서버리스 함수만 실행 중 (NestJS 미실행)
2. **데이터베이스**: Supabase 연결되지 않음
3. **환경 변수**: 프로덕션 환경 변수 미설정
4. **Mobile 앱**: API 연결 시도하지만 데이터 없음

### 해결 방안:
서버리스 환경에 맞는 API 구조로 전환 + Supabase 직접 연결

---

## 🚀 1단계: Vercel 환경 변수 설정

### Vercel Dashboard에서 설정할 변수들:

```bash
# 🔗 Supabase 데이터베이스 연결
DATABASE_URL="postgresql://postgres.[password]@db.bjcpljuhjibvpajkrysj.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"

# 🔐 보안 키들
JWT_SECRET="your_super_long_jwt_secret_minimum_32_characters_for_production_security"
ENCRYPTION_KEY="c55bb6a39f66e80e5601d53d25a5e9d3cf64397655eedfff7efd10964db4246f"

# 🔑 Clerk 인증 (실제 프로덕션 키로 교체 필요)
CLERK_SECRET_KEY="sk_live_your_production_clerk_secret_key"
CLERK_PUBLISHABLE_KEY="pk_live_your_production_clerk_publishable_key"

# 🌍 환경 설정
NODE_ENV="production"
VERCEL_ENV="production"
DEV_AUTH_ENABLED="false"
```

### Supabase 연결 문자열 찾는 방법:

1. **Supabase Dashboard 접속**: https://supabase.com/dashboard/project/bjcpljuhjibvpajkrysj
2. **Settings > Database** 클릭
3. **Connection string** 섹션에서 **Connection pooling** 선택
4. URI 복사하여 `[YOUR-PASSWORD]`를 실제 비밀번호로 교체

---

## 🗄️ 2단계: Supabase 데이터베이스 마이그레이션

### 방법 1: 로컬에서 직접 마이그레이션

```bash
# 1. 환경 변수 설정
export DATABASE_URL="postgresql://postgres.[password]@db.bjcpljuhjibvpajkrysj.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"

# 2. 서버 디렉토리로 이동
cd server

# 3. Prisma 클라이언트 생성
npx prisma generate

# 4. 데이터베이스 스키마 푸시
npx prisma db push --accept-data-loss

# 5. 확인
npx prisma studio
```

### 방법 2: Vercel 배포 후 API 호출

```bash
# 새 API 배포 후 마이그레이션 실행
curl -X POST "https://glimpse-server-psi.vercel.app/api/db-migrate" \\
     -H "Authorization: Bearer migration-token-123"
```

---

## 📱 3단계: Mobile 앱 연결 확인

### API 엔드포인트 테스트:

1. **Health Check**:
   ```
   GET https://glimpse-server-psi.vercel.app/api/health
   ```

2. **Groups API** (새로 추가됨):
   ```
   GET https://glimpse-server-psi.vercel.app/api/groups
   Header: x-dev-auth: true  (개발용)
   ```

3. **Database Status** (새로 추가됨):
   ```
   GET https://glimpse-server-psi.vercel.app/api/db-status
   ```

### Mobile 앱에서 테스트:
- https://glimpse-mobile.vercel.app/ 접속
- Home 화면 상단의 "API 연결 테스트" 버튼 클릭
- Vercel 서버 연결 상태 확인

---

## 🔧 4단계: 새 API 배포

현재 작업 중인 새로운 서버리스 API들:

### 새로 추가된 API들:
- `/api/db-status` - 데이터베이스 연결 상태 확인
- `/api/groups` - 그룹 목록 조회 (Supabase 연동)
- `/api/db-migrate` - 데이터베이스 마이그레이션 실행

### 배포 방법:
```bash
# 1. 변경사항 커밋 및 푸시
git add .
git commit -m "feat: Supabase 연동 API 추가"
git push origin master

# 2. Vercel 자동 배포 대기 (약 1-2분)

# 3. 배포 완료 후 테스트
curl https://glimpse-server-psi.vercel.app/api/db-status
```

---

## ✅ 5단계: 검증 체크리스트

### Vercel 환경 변수:
- [ ] `DATABASE_URL` - Supabase 연결 문자열
- [ ] `JWT_SECRET` - 32자 이상 비밀 키
- [ ] `CLERK_SECRET_KEY` - Clerk 프로덕션 키
- [ ] `NODE_ENV=production`

### Supabase 데이터베이스:
- [ ] 스키마 마이그레이션 완료
- [ ] 테이블 생성 확인
- [ ] 연결 테스트 성공

### API 엔드포인트:
- [ ] `/api/health` - 서버 상태 OK
- [ ] `/api/db-status` - 데이터베이스 연결 OK
- [ ] `/api/groups` - 그룹 데이터 조회 OK

### Mobile 앱:
- [ ] https://glimpse-mobile.vercel.app/ 접속 가능
- [ ] API 연결 테스트 성공
- [ ] 실제 데이터 표시

---

## 🚨 자주 발생하는 문제들

### 1. "Connection string not configured"
**해결**: Vercel 환경 변수에서 `DATABASE_URL` 정확히 설정

### 2. "Authorization required"
**해결**: API 호출 시 `x-dev-auth: true` 헤더 추가 (개발용)

### 3. "Prisma client not found"
**해결**: `npx prisma generate` 실행 후 재배포

### 4. Mobile 앱 "API 연결 실패"
**해결**: 
1. Vercel 서버 상태 확인
2. CORS 설정 확인
3. 네트워크 연결 확인

---

## 📞 즉시 실행할 명령어들

```bash
# 1. 현재 상태 확인
curl https://glimpse-server-psi.vercel.app/api/health

# 2. 새 API 배포
git add . && git commit -m "feat: Add Supabase APIs" && git push

# 3. 로컬에서 Supabase 마이그레이션 (DATABASE_URL 설정 후)
cd server && npx prisma db push

# 4. 배포 완료 후 테스트
curl https://glimpse-server-psi.vercel.app/api/db-status
curl https://glimpse-server-psi.vercel.app/api/groups
```

---

**다음 작업**: 위 단계들을 순서대로 실행하여 완전한 Supabase 연동을 완성해보세요! 🎯