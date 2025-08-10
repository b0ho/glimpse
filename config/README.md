# Glimpse 환경 변수 설정 가이드

## 🏗️ 기술 스택 개요

Glimpse는 **NestJS + React Native + PostgreSQL** 기반의 **모노레포 데이팅 앱**입니다.

- **Backend**: NestJS (Node.js) + TypeScript + Prisma ORM
- **Frontend**: React Native + Expo + TypeScript + Zustand
- **Database**: PostgreSQL + Redis  
- **Auth**: Clerk + JWT
- **Deployment**: Docker + GitHub Actions
- **Workspace**: npm workspaces 모노레포

## 📁 디렉토리 구조

```
config/
├── public/                    # 공개 설정 (Git으로 관리)
│   ├── api.config.js         # API 엔드포인트 (환경별 URL)
│   ├── app.config.js         # 앱 기능 & 비즈니스 설정
│   └── mobile.config.js      # React Native/Expo 전용 설정
├── private/                  # 비밀 설정 (Git 무시됨) 
│   ├── secrets.env           # 실제 API 키 & 비밀키들
│   ├── .env.local           # 개발자 개인 오버라이드
│   └── .env.{environment}   # 환경별 비밀 설정
├── examples/                 # 설정 템플릿들
│   └── secrets.env.example  # 비밀키 설정 가이드
├── legacy-backup/           # 기존 .env 파일 백업
├── env-loader.js            # 환경 변수 로더 (Node.js용)
└── README.md               # 이 파일
```

## 🚀 빠른 시작 (개발 환경 설정)

### 1단계: 환경 파일 생성

```bash
# 1. 비밀 설정 폴더 생성  
mkdir -p config/private

# 2. 템플릿 복사
cp config/examples/secrets.env.example config/private/secrets.env

# 3. 개발용 기본값으로 시작 (실제 키는 나중에 추가)
# config/private/secrets.env 파일이 생성됨
```

### 2단계: 개발 서버 실행

```bash
# 모노레포 전체 개발 서버 시작
npm run dev

# 또는 개별 실행
npm run dev:server    # NestJS 백엔드
npm run dev:mobile    # React Native/Expo
```

### 3단계: 실제 API 키 설정 (필요시)

`config/private/secrets.env`에서 필요한 서비스 키들을 실제 값으로 교체:

```env
# Clerk 인증 (필수)
CLERK_SECRET_KEY=sk_live_실제_클러크_시크릿_키
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_실제_퍼블릭_키

# AWS S3 파일 업로드 (필요시)  
AWS_ACCESS_KEY_ID=실제_AWS_키
AWS_SECRET_ACCESS_KEY=실제_AWS_시크릿

# 결제 (프리미엄 기능 테스트시)
STRIPE_SECRET_KEY=sk_test_실제_스트라이프_키
```

## 🔧 환경별 설정

### Development (기본)
- **Database**: Docker PostgreSQL (`localhost:5432`)  
- **API**: `http://localhost:3001`
- **Mobile**: Expo Dev Server
- **Auth**: 개발 모드 우회 가능 (`USE_DEV_AUTH=true`)

### Staging  
- **API**: `https://api-staging.glimpse.app`
- **Database**: AWS RDS (스테이징)
- **Build**: EAS Build + GitHub Actions

### Production
- **API**: `https://api.glimpse.app`
- **Database**: AWS RDS (프로덕션)  
- **Mobile**: App Store + Google Play
- **필수 보안 검증**: JWT_SECRET, 실제 API 키들

## 🔒 보안 & Git 관리

### ✅ **Git으로 관리** (안전한 공개 설정)
- `config/public/*` - API 엔드포인트, 기능 플래그
- `.env.defaults` - 개발용 기본값  
- `mobile/app.config.js` - Expo 설정 (동적)

### ❌ **Git 제외** (민감한 비밀 정보)
- `config/private/*` - 모든 API 키 & 시크릿
- 레거시: `mobile/.env`, `server/.env` (더 이상 사용안함)

## 💻 개발자 워크플로우

### NestJS 백엔드 개발
```bash
cd server
npm run dev              # 개발 서버 (nodemon)
npm run db:studio        # Prisma 스튜디오  
npm run db:migrate       # DB 스키마 변경
npm run test             # 단위 테스트
```

### React Native 모바일 개발  
```bash
cd mobile
expo start               # Expo 개발 서버
expo start --ios         # iOS 시뮬레이터
expo start --android     # 안드로이드 에뮬레이터
npm run test             # Jest 테스트
```

### 통합 명령어 (모노레포 루트)
```bash
npm run dev              # 전체 개발 서버
npm run build            # 전체 빌드
npm run test             # 전체 테스트  
npm run lint             # 전체 린트
npm run typecheck        # TypeScript 검사
```

## 🚀 배포 & CI/CD

### GitHub Actions 워크플로우
- **CI**: 린트, 테스트, 타입체크 (`/.github/workflows/ci.yml`)
- **Deploy**: Docker 빌드 + 프로덕션 배포  
- **Security**: 보안 스캔, 취약점 검사
- **Mobile**: EAS Build (iOS/Android)

### Docker 배포
```bash
# 프로덕션 빌드
docker-compose -f docker/docker-compose.prod.yml up

# 개발 환경  
docker-compose -f docker/docker-compose.yml up
```

## 🌍 환경 변수 우선순위

환경 변수 로드 순서 (나중이 우선순위 높음):

1. **기본 공개값**: `.env.defaults` 
2. **비밀 설정**: `config/private/secrets.env`
3. **환경별 설정**: `config/private/.env.{NODE_ENV}`  
4. **개인 오버라이드**: `config/private/.env.local`
5. **레거시 호환**: `server/.env` (deprecated)

ENDOFFILE < /dev/null