# Railway + PostgreSQL 완전 설정 가이드

## 🚄 1단계: Railway 설정

### Railway 계정 생성
1. **Railway 웹사이트 접속**: https://railway.app/
2. **GitHub로 로그인** 또는 이메일 가입
3. **무료 플랜 시작** (월 $5 크레딧 제공)

### PostgreSQL 데이터베이스 생성
1. **New Project** 클릭
2. **"Provision PostgreSQL"** 선택
3. 프로젝트 이름: `glimpse-database` (선택사항)
4. **Create** 클릭

### 연결 정보 복사
1. 생성된 PostgreSQL 서비스 클릭
2. **"Connect"** 탭으로 이동
3. **"Postgres Connection URL"** 복사
   ```
   예시: postgresql://postgres:password@server.railway.app:5432/railway
   ```

---

## 🔗 2단계: Vercel 환경 변수 업데이트

### Vercel Dashboard 설정
1. https://vercel.com/b0hos-projects/glimpse-server/settings/environments/production
2. 기존 `DATABASE_URL` 수정 또는 새로 추가:

```bash
# Railway PostgreSQL URL (위에서 복사한 URL)
DATABASE_URL="postgresql://postgres:your_password@server.railway.app:5432/railway"

# 기존 필수 변수들 (그대로 유지)
JWT_SECRET="your_super_long_jwt_secret_minimum_32_characters_for_production"
ENCRYPTION_KEY="c55bb6a39f66e80e5601d53d25a5e9d3cf64397655eedfff7efd10964db4246f"
NODE_ENV="production"
DEV_AUTH_ENABLED="false"
```

3. **Save** 클릭
4. Vercel 자동 재배포 대기 (1-2분)

---

## 🗄️ 3단계: 로컬에서 데이터베이스 마이그레이션

### 환경 변수 설정
```bash
# Railway URL을 환경 변수로 설정
export DATABASE_URL="postgresql://postgres:your_password@server.railway.app:5432/railway"
```

### Prisma 마이그레이션 실행
```bash
# 1. 서버 디렉토리로 이동
cd server

# 2. Prisma 클라이언트 생성
npx prisma generate

# 3. 데이터베이스 스키마 적용
npx prisma db push

# 4. 연결 확인
npx prisma studio
```

---

## 🧪 4단계: 연결 테스트

### API 엔드포인트 테스트
```bash
# 1. 데이터베이스 상태 확인
curl https://glimpse-server-psi.vercel.app/api/db-status

# 2. Groups API 테스트 (개발 모드)
curl -H "x-dev-auth: true" https://glimpse-server-psi.vercel.app/api/groups

# 3. Mobile 앱에서 테스트
# https://glimpse-mobile.vercel.app/ → "전체 API 테스트" 클릭
```

### 예상 결과
- ✅ `db-status`: `"Connected to Railway PostgreSQL"`
- ✅ `groups`: 실제 데이터 또는 데모 데이터 표시
- ✅ Mobile 앱: 모든 API 테스트 성공

---

## 💰 Railway 비용 정보

### 무료 플랜
- **월 $5 크레딧** (계정당)
- **500MB RAM** 제한
- **1GB 디스크** 제한
- **소규모 프로젝트에 충분**

### 사용량 모니터링
1. Railway Dashboard → 프로젝트 → **"Usage"** 탭
2. 메모리, CPU, 네트워크 사용량 확인
3. 크레딧 소진 시 자동 정지 (데이터 보존)

---

## 🔧 문제 해결

### "Connection refused" 에러
1. Railway URL이 정확한지 확인
2. 비밀번호 특수문자 URL 인코딩 필요 시 확인
3. Railway 서비스 상태 확인: https://railway.app/status

### "Authentication failed" 에러
1. Railway Dashboard에서 연결 정보 재확인
2. 비밀번호 재설정: Database → Settings → Reset Password

### Vercel 배포 실패
1. 환경 변수 저장 후 1-2분 대기
2. Functions → Logs에서 에러 로그 확인
3. 필요시 수동 재배포 트리거

---

## ✅ 완료 체크리스트

- [ ] Railway 계정 생성 완료
- [ ] PostgreSQL 데이터베이스 생성 완료
- [ ] DATABASE_URL 복사 완료
- [ ] Vercel 환경 변수 업데이트 완료
- [ ] 로컬 마이그레이션 실행 완료
- [ ] API 연결 테스트 성공
- [ ] Mobile 앱 테스트 성공
- [ ] Railway 사용량 확인 완료

---

## 🎯 예상 소요 시간
- **Railway 설정**: 3분
- **환경 변수 업데이트**: 2분  
- **마이그레이션**: 2분
- **테스트**: 3분
- **총 소요 시간**: 약 10분

**바로 시작해보세요!** 🚀