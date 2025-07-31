# Glimpse 개발 환경 설정 가이드

## 🛠 개발 환경 요구사항

### 필수 소프트웨어
- **Node.js**: v18.0.0 이상 (권장: v20.x LTS)
- **npm**: v9.0.0 이상
- **PostgreSQL**: v14.0 이상
- **Redis**: v6.0 이상 (세션 관리용)
- **Git**: v2.30.0 이상

### 권장 개발 도구
- **IDE**: Visual Studio Code (권장) 또는 WebStorm
- **API 테스트**: Postman 또는 Insomnia
- **DB 관리**: TablePlus 또는 DBeaver
- **모바일 개발**: Expo Go 앱 (iOS/Android)

## 🚀 프로젝트 설정

### 1. 저장소 클론

```bash
# HTTPS
git clone https://github.com/your-org/glimpse-fe.git

# SSH (권장)
git clone git@github.com:your-org/glimpse-fe.git

cd glimpse-fe
```

### 2. 의존성 설치

```bash
# 루트 디렉토리에서 모든 워크스페이스 의존성 설치
npm install

# 개별 패키지 의존성 확인
npm run check:deps
```

### 3. 환경 변수 설정

#### 3.1 서버 환경 변수 (`server/.env`)

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/glimpse_dev"

# Authentication (Clerk)
CLERK_SECRET_KEY="sk_test_..."
CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-here"

# Encryption
ENCRYPTION_KEY="32-byte-hex-key-for-aes-encryption"

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="ap-northeast-2"
AWS_BUCKET_NAME="glimpse-uploads"

# Firebase (FCM)
FCM_SERVICE_ACCOUNT='{
  "type": "service_account",
  "project_id": "glimpse-app",
  ...
}'

# Payment Gateways
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
TOSS_SECRET_KEY="test_sk_..."
TOSS_CLIENT_KEY="test_ck_..."
KAKAO_PAY_ADMIN_KEY="..."

# External APIs
KAKAO_APP_KEY="..."
KAKAO_REST_API_KEY="..."
NAVER_CLIENT_ID="..."
NAVER_CLIENT_SECRET="..."
GOOGLE_VISION_API_KEY="..."

# Redis
REDIS_URL="redis://localhost:6379"

# Server Config
PORT=3000
NODE_ENV=development

# Email Service
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="no-reply@glimpse.app"
SMTP_PASS="app-specific-password"

# Monitoring (Optional)
SENTRY_DSN="https://..."
NEW_RELIC_LICENSE_KEY="..."
```

#### 3.2 모바일 환경 변수 (`mobile/.env`)

```bash
# API Configuration
EXPO_PUBLIC_API_URL="http://localhost:3000/api/v1"
EXPO_PUBLIC_WEBSOCKET_URL="ws://localhost:3000"

# Authentication
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."

# Payment
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
EXPO_PUBLIC_TOSS_CLIENT_KEY="test_ck_..."

# Maps
EXPO_PUBLIC_KAKAO_APP_KEY="..."

# Environment
EXPO_PUBLIC_ENV="development"

# Feature Flags
EXPO_PUBLIC_ENABLE_ANALYTICS=false
EXPO_PUBLIC_ENABLE_CRASH_REPORTING=false
```

### 4. 데이터베이스 설정

```bash
# PostgreSQL 설치 (macOS)
brew install postgresql
brew services start postgresql

# 데이터베이스 생성
createdb glimpse_dev

# Prisma 마이그레이션 실행
cd server
npx prisma migrate dev

# Prisma Studio 실행 (DB GUI)
npx prisma studio
```

### 5. Redis 설정

```bash
# Redis 설치 (macOS)
brew install redis
brew services start redis

# Redis 연결 테스트
redis-cli ping
# 응답: PONG
```

## 🏃‍♂️ 개발 서버 실행

### 전체 앱 실행 (권장)

```bash
# 루트 디렉토리에서
npm run dev

# 이 명령어는 다음을 동시에 실행합니다:
# - 백엔드 서버 (포트 3000)
# - 모바일 앱 Expo 개발 서버
# - TypeScript 컴파일러 (watch 모드)
```

### 개별 실행

```bash
# 백엔드만 실행
npm run dev:server

# 모바일 앱만 실행
npm run dev:mobile

# 특정 플랫폼에서 실행
cd mobile
npm run ios     # iOS 시뮬레이터
npm run android # Android 에뮬레이터
```

## 📱 모바일 개발 설정

### iOS 개발 (macOS만 가능)

```bash
# Xcode 설치 필요 (App Store)
# iOS 시뮬레이터 설치
xcode-select --install

# CocoaPods 설치
sudo gem install cocoapods

# iOS 시뮬레이터에서 실행
cd mobile
npm run ios
```

### Android 개발

```bash
# Android Studio 설치 필요
# Android SDK 설정
# AVD (Android Virtual Device) 생성

# Android 에뮬레이터에서 실행
cd mobile
npm run android
```

### 실제 디바이스 테스트

1. **Expo Go 앱 설치** (App Store/Play Store)
2. **QR 코드 스캔** (터미널에 표시됨)
3. **같은 네트워크** 연결 필요

## 🧪 테스트 환경

### 단위 테스트

```bash
# 전체 테스트 실행
npm test

# 감시 모드로 실행
npm run test:watch

# 커버리지 리포트
npm run test:coverage
```

### E2E 테스트

```bash
# Playwright 설치
npx playwright install

# E2E 테스트 실행
npm run test:e2e

# UI 모드로 실행
npm run test:e2e:ui
```

### API 테스트

```bash
# Postman Collection 가져오기
# /docs/postman/Glimpse-API.postman_collection.json

# 환경 변수 설정
# - Local: http://localhost:3000/api/v1
# - Dev: https://dev-api.glimpse.app/api/v1
```

## 🔧 개발 도구 설정

### VS Code 확장 프로그램

필수 확장 프로그램을 자동으로 설치:

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next",
    "christian-kohler.path-intellisense",
    "aaron-bond.better-comments",
    "usernamehw.errorlens"
  ]
}
```

### Git Hooks 설정

```bash
# Husky 설치 (자동)
npm run prepare

# Pre-commit hooks:
# - ESLint
# - Prettier
# - TypeScript 컴파일 체크
# - 테스트 실행
```

### 디버깅 설정

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Server",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev:server"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal"
    },
    {
      "name": "Debug Mobile",
      "type": "reactnative",
      "request": "launch",
      "platform": "ios"
    }
  ]
}
```

## 🐳 Docker 개발 환경 (선택사항)

```bash
# Docker Compose로 전체 환경 실행
docker-compose up -d

# 서비스 확인
docker-compose ps

# 로그 확인
docker-compose logs -f

# 종료
docker-compose down
```

### docker-compose.yml 구조

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: glimpse_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

  server:
    build: ./server
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/glimpse_dev
      REDIS_URL: redis://redis:6379

volumes:
  postgres_data:
```

## 🚦 개발 프로세스

### 1. 브랜치 전략

```bash
# 기능 개발
git checkout -b feature/좋아요-시스템

# 버그 수정
git checkout -b fix/매칭-오류

# 긴급 수정
git checkout -b hotfix/결제-오류
```

### 2. 커밋 컨벤션

```bash
# 기능 추가
git commit -m "feat: 프로필 사진 업로드 기능 추가"

# 버그 수정
git commit -m "fix: 매칭 알고리즘 중복 처리 오류 수정"

# 문서 업데이트
git commit -m "docs: API 문서 업데이트"

# 리팩토링
git commit -m "refactor: 좋아요 서비스 로직 개선"

# 테스트 추가
git commit -m "test: 사용자 인증 테스트 추가"
```

### 3. 코드 리뷰 체크리스트

- [ ] 타입스크립트 컴파일 오류 없음
- [ ] ESLint 경고/오류 없음
- [ ] 테스트 통과
- [ ] 문서 업데이트
- [ ] 환경 변수 확인
- [ ] 데이터베이스 마이그레이션

## 📊 모니터링 및 디버깅

### 로그 확인

```bash
# 서버 로그
tail -f server/logs/app.log

# PM2 로그 (프로덕션)
pm2 logs

# Docker 로그
docker-compose logs -f server
```

### 성능 프로파일링

```bash
# Node.js 프로파일링
node --inspect server/dist/index.js

# React Native 성능 모니터
# Flipper 설치 및 사용
```

### 에러 추적

- **Sentry**: 프로덕션 에러 추적
- **LogRocket**: 사용자 세션 재생
- **New Relic**: APM 모니터링

## 🆘 문제 해결

### 자주 발생하는 문제

1. **npm install 실패**
   ```bash
   # 캐시 정리
   npm cache clean --force
   # node_modules 삭제 후 재설치
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Expo 연결 문제**
   ```bash
   # 캐시 정리
   expo start -c
   # 터널 모드 사용
   expo start --tunnel
   ```

3. **데이터베이스 연결 오류**
   ```bash
   # PostgreSQL 상태 확인
   brew services list
   # 연결 테스트
   psql -U postgres -d glimpse_dev
   ```

4. **TypeScript 오류**
   ```bash
   # 타입 재생성
   npm run generate:types
   # tsconfig 확인
   npx tsc --showConfig
   ```

## 📚 추가 리소스

### 공식 문서
- [React Native](https://reactnative.dev/docs/getting-started)
- [Expo](https://docs.expo.dev/)
- [Prisma](https://www.prisma.io/docs/)
- [Socket.IO](https://socket.io/docs/v4/)
- [Clerk](https://clerk.com/docs)

### 내부 문서
- [API 문서](./API_DOCUMENTATION.md)
- [아키텍처 가이드](./ARCHITECTURE.md)
- [보안 가이드](./SECURITY.md)
- [배포 가이드](./DEPLOYMENT.md)

### 지원 채널
- Slack: #glimpse-dev
- 이슈 트래커: GitHub Issues
- 위키: Confluence/Notion