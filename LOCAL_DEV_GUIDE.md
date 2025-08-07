# 📚 Glimpse 로컬 개발 환경 실행 가이드

## 🚀 빠른 시작

### 1️⃣ 자동 실행 (권장)
```bash
# 모든 서비스를 한 번에 시작
./scripts/start-local-dev.sh
```

이 명령 하나로 다음이 자동으로 실행됩니다:
- ✅ Docker 컨테이너 (PostgreSQL, Redis)
- ✅ 데이터베이스 초기화
- ✅ NestJS 서버
- ✅ Mobile 웹 앱

**브라우저에서 http://localhost:8081 열기**

---

## 🛠 수동 실행 (단계별)

문제가 발생하거나 단계별로 실행하고 싶다면:

### Step 1: Docker 컨테이너 실행
```bash
# PostgreSQL 실행
docker run -d \
  --name glimpse-postgres-dev \
  -e POSTGRES_USER=glimpse \
  -e POSTGRES_PASSWORD=glimpse123 \
  -e POSTGRES_DB=glimpse_dev \
  -p 5432:5432 \
  postgres:16-alpine

# Redis 실행
docker run -d \
  --name glimpse-redis-dev \
  -p 6379:6379 \
  redis:7-alpine
```

### Step 2: 데이터베이스 초기화
```bash
cd server

# Prisma Client 생성
npx prisma generate

# 데이터베이스 스키마 적용
npx prisma db push --force-reset
```

### Step 3: 서버 실행
```bash
cd server
npm run dev
```

### Step 4: Mobile 앱 실행
```bash
cd mobile

# Icon import 문제가 있다면 수정
# navigation/AppNavigator.tsx 파일에서
# import Icon from '@/components/IconWrapper'를
# import { IconWrapper as Icon } from '@/components/IconWrapper'로 변경

# 웹 모드로 실행
npx expo start --web --clear
```

---

## 🔧 유용한 스크립트

### 환경 시작
```bash
./scripts/start-local-dev.sh
```

### 환경 종료
```bash
./scripts/stop-local-dev.sh
```

### 환경 초기화 (문제 해결)
```bash
./scripts/reset-local-dev.sh
```

---

## 📋 체크리스트

### ✅ 필수 요구사항
- [ ] Docker Desktop 설치 및 실행
- [ ] Node.js 18+ 설치
- [ ] npm 9+ 설치

### ✅ 포트 확인
- [ ] 3001 (NestJS 서버)
- [ ] 5432 (PostgreSQL)
- [ ] 6379 (Redis)  
- [ ] 8081 (Mobile 웹)

---

## 🐛 문제 해결

### 1. "Docker가 실행되지 않습니다"
```bash
# Docker Desktop 시작 후 재실행
./scripts/start-local-dev.sh
```

### 2. "포트가 이미 사용 중입니다"
```bash
# 포트 정리
lsof -ti:3001 | xargs kill -9
lsof -ti:8081 | xargs kill -9

# 재실행
./scripts/start-local-dev.sh
```

### 3. "Element type is invalid" 에러
```bash
# Icon import 수정
cd mobile
sed -i '' "s/import Icon from '@\/components\/IconWrapper'/import { IconWrapper as Icon } from '@\/components\/IconWrapper'/" navigation/AppNavigator.tsx
```

### 4. 완전 초기화
```bash
# 모든 것을 리셋하고 처음부터
./scripts/reset-local-dev.sh
./scripts/start-local-dev.sh
```

---

## 📊 정상 작동 확인

### 시스템 상태 확인
```bash
# Docker 컨테이너 확인
docker ps | grep glimpse

# 서버 헬스체크
curl http://localhost:3001/health

# 웹 앱 확인
curl -s http://localhost:8081 | grep "<title>Glimpse</title>"
```

### 로그 확인
```bash
# 서버 로그
tail -f server.log

# Mobile 로그
tail -f mobile.log
```

---

## 🎯 개발 모드 기능

현재 개발 모드에서는:
- **자동 로그인**: 테스트용 계정으로 자동 로그인
- **프리미엄 계정**: 모든 프리미엄 기능 사용 가능
- **Mock API 비활성화**: 실제 서버와 통신

---

## 📝 환경 변수

### Mobile (.env)
```env
EXPO_PUBLIC_API_URL=http://localhost:3001/api/v1
EXPO_PUBLIC_WEBSOCKET_URL=http://localhost:3001
EXPO_PUBLIC_USE_DEV_AUTH=true
EXPO_PUBLIC_DEV_ACCOUNT_TYPE=paid
EXPO_PUBLIC_MOCK_API=false
```

### Server (.env)
```env
DATABASE_URL=postgresql://glimpse:glimpse123@localhost:5432/glimpse_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret
NODE_ENV=development
USE_DEV_AUTH=true
```

---

## 💡 팁

1. **Hot Reload**: 코드 변경 시 자동으로 반영됩니다
2. **TypeScript 에러**: 개발 편의를 위해 무시되도록 설정됨
3. **ESLint**: 모든 에러가 해결된 상태
4. **Prisma Studio**: `cd server && npx prisma studio`로 DB GUI 사용

---

## 📞 지원

문제가 지속된다면:
1. `./scripts/reset-local-dev.sh` 실행
2. 로그 파일 확인 (server.log, mobile.log)
3. Docker 컨테이너 상태 확인
4. 포트 충돌 확인

---

**Happy Coding! 🚀**