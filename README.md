# Glimpse - 익명 소셜 데이팅 앱

<p align="center">
  <img src="assets/icon.png" alt="Glimpse Logo" width="120" height="120">
</p>

<p align="center">
  <strong>프라이버시를 최우선으로 하는 한국형 소셜 데이팅 플랫폼</strong>
</p>

<p align="center">
  <a href="https://expo.dev">
    <img src="https://img.shields.io/badge/Expo-SDK%2050-000020?style=flat-square&logo=expo&logoColor=white" alt="Expo">
  </a>
  <a href="https://reactnative.dev">
    <img src="https://img.shields.io/badge/React%20Native-0.79.x-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React Native">
  </a>
  <a href="https://nodejs.org">
    <img src="https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js">
  </a>
  <a href="https://www.typescriptlang.org">
    <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  </a>
</p>

## 📱 프로젝트 소개

Glimpse는 익명성과 프라이버시를 보장하면서도 진정성 있는 만남을 추구하는 혁신적인 데이팅 앱입니다. 회사, 대학교, 관심사 기반의 그룹 시스템을 통해 안전하고 신뢰할 수 있는 환경에서 새로운 인연을 만날 수 있습니다.

### 🎯 핵심 기능

- **익명 좋아요 시스템**: 상호 관심 확인 전까지 완전한 익명성 보장
- **다양한 그룹 유형**: 공식(회사/대학), 생성(취미), 즉석, 위치 기반 그룹
- **실시간 암호화 채팅**: Socket.IO + AES-GCM 종단간 암호화
- **프리미엄 구독**: 무제한 좋아요, 받은 좋아요 확인 등 프리미엄 기능
- **친구 시스템**: 친구 요청, 관리, 우선 매칭

## 📋 프로젝트 구조

```
glimpse-monorepo/
├── mobile/          # React Native 모바일 앱 (Expo 관리 워크플로우)
├── server/          # Node.js/Express 백엔드 API 서버
├── web/             # Vite + React 랜딩 페이지 (어드민 스타일)
├── admin/           # Next.js 관리자 대시보드 
├── shared/          # 공유 타입 및 유틸리티
├── docs/            # 프로젝트 문서
├── scripts/         # 유틸리티 스크립트  
├── docker/          # Docker 설정 파일
├── monitoring/      # 모니터링 설정
└── tests/           # E2E 테스트
```

## 🚀 빠른 시작

### 필수 요구사항
- Node.js 18+ 
- PostgreSQL 14+
- Redis (선택사항)
- Expo CLI 50+
- Android Studio 또는 Xcode (모바일 개발용)

### 설치

```bash
# 모든 의존성 설치
npm install

# 환경변수 설정
cd server && cp .env.example .env
cd ../mobile && cp .env.example .env
# .env 파일들을 열어 필요한 값 설정

# 데이터베이스 설정
createdb glimpse_db
cd server
npx prisma migrate dev
npx prisma generate

# 개발 서버 시작
cd ..
npm run dev
```

개발 서버:
- 모바일 앱: http://localhost:8081 (Expo)
- 서버 API: http://localhost:3002
- 랜딩 페이지: http://localhost:5173 (Vite)
- 관리자 대시보드: http://localhost:3004 (Next.js)

## 🐳 프로덕션 배포

### Docker를 사용한 배포

```bash
# 환경변수 설정
cp .env.production.example .env.production
# .env.production 파일 편집하여 실제 값 입력

# 배포
./deploy.sh

# 또는 수동으로
docker-compose -f docker-compose.prod.yml up -d
```

### 포함된 서비스
- **Node.js Server**: 메인 API 서버
- **PostgreSQL**: 주 데이터베이스
- **Redis**: 캐싱 및 세션 관리
- **Nginx**: 리버스 프록시 및 SSL
- **Prometheus & Grafana**: 모니터링
- **Backup Service**: 자동 백업 (6시간마다)

### 백업 및 복원

```bash
# 수동 백업
docker-compose -f docker-compose.prod.yml exec backup /scripts/backup.sh

# 복원 (백업 파일명 필요)
docker-compose -f docker-compose.prod.yml exec backup /scripts/restore.sh postgres_20250128_120000.sql.gz
```

## 🐳 Docker로 실행하기

### 개발 환경 (데이터베이스만)

```bash
# PostgreSQL과 Redis 시작
docker-compose -f docker-compose.dev.yml up -d

# 데이터베이스 마이그레이션
cd server && npx prisma migrate dev

# 개발 서버 시작
npm run dev
```

### 프로덕션 환경 (전체 스택)

```bash
# 환경변수 파일 생성
cp .env.docker.example .env.docker
# .env.docker 파일 편집하여 실제 값 입력

# 전체 스택 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down
```

### Docker 서비스

- **PostgreSQL**: 데이터베이스 (포트 5432)
- **Redis**: 세션 및 캐싱 (포트 6379)
- **Server**: 백엔드 API (포트 3001)
- **Web**: 관리자 대시보드 (포트 3000)
- **Nginx**: 리버스 프록시 (포트 80/443)
- **pgAdmin**: 데이터베이스 관리 도구 (포트 5050)

### 유용한 Docker 명령어

```bash
# 특정 서비스만 시작
docker-compose up -d postgres redis

# 서비스 재시작
docker-compose restart server

# 로그 보기
docker-compose logs -f server

# 컨테이너 쉘 접속
docker-compose exec server sh

# 데이터베이스 백업
docker-compose exec postgres pg_dump -U glimpse glimpse_db > backup.sql

# 볼륨 정리
docker-compose down -v
```

### 개별 서비스 실행

```bash
# 🚀 편리한 실행 스크립트들
npm run start:all          # 인터랙티브 서비스 선택
npm run start:landing      # 랜딩 페이지만 (추천 UI)
npm run start:admin        # 관리자 대시보드만 (추천 UI)

# 🔧 개별 서비스 실행
npm run dev:mobile         # 모바일 앱만
npm run dev:server         # 서버만  
npm run dev:web            # 랜딩 페이지만 (Vite)
npm run dev:admin          # 관리자 대시보드만 (Next.js)
npm run dev                # 기본 개발 (서버 + 모바일)

# 🗄️ 데이터베이스 관리
npm run db:studio          # Prisma Studio 열기
```

## 🛠 Tech Stack

### Mobile (React Native + Expo)
- **React Native 0.79** with Expo 50+
- **TypeScript** for type safety
- **Zustand** for state management
- **React Navigation** for routing
- **Socket.IO Client** for real-time features
- **Expo Secure Store** for sensitive data
- **Stripe React Native** for payments

### Landing Page (Web)
- **Vite** + **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **Framer Motion** for animations
- **Lucide React** for icons
- **Professional admin-style design**

### Admin Dashboard
- **Next.js 15** (App Router)
- **TypeScript** for type safety
- **shadcn/ui** component system
- **Tailwind CSS** for styling
- **System monitoring & user management**

### Backend (Node.js)
- **Express.js** web framework
- **TypeScript** for type safety
- **Prisma ORM** with PostgreSQL
- **Socket.IO** for real-time messaging
- **JWT** authentication
- **Stripe** for payment processing
- **Firebase Admin** for push notifications

### Shared
- **TypeScript** types and interfaces
- **Utility functions** for validation, formatting
- **Constants** for app configuration

## 📱 Core Features

### ✅ Implemented
- **SMS Authentication** - Korean phone number verification
- **Anonymous Like System** - Group-based matching with credits
- **Real-time Chat** - Encrypted messaging via WebSocket
- **Premium Subscriptions** - Stripe integration for Korean market
- **Group Management** - 4 types: Official, Created, Instance, Location
- **Push Notifications** - Firebase Cloud Messaging

### 🚧 In Development
- **Company Verification** - 4 verification methods
- **Location-based Groups** - GPS/QR code check-in
- **OCR Verification** - ID card scanning
- **Korean Payment Integration** - TossPay, KakaoPay

## 🔧 Development

### Testing
```bash
# Run all tests
npm test

# E2E tests
npx playwright test

# Server tests
npm run test:server

# Mobile tests  
npm run test:mobile
```

### Code Quality
```bash
# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix
```

### Database
```bash
# Run migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Generate Prisma client
npm run db:generate
```

## 📦 Deployment

### Production Build
```bash
# Build all packages
npm run build

# Build mobile app for stores
cd mobile && eas build --platform all

# Build server for production
cd server && npm run build
```

### Environment Variables

#### Root `.env`
```bash
# Development URLs
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
EXPO_PUBLIC_SOCKET_URL=ws://localhost:8080
```

#### Server `.env`
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/glimpse"
JWT_SECRET="your-secret-key"
STRIPE_SECRET_KEY="sk_test_..."
FIREBASE_PRIVATE_KEY="..."
```

## 📚 프로젝트 문서

자세한 문서는 [docs](./docs/INDEX.md) 폴더를 참조하세요:

- [프로젝트 개요](./docs/PROJECT_OVERVIEW.md)
- [개발 가이드](./docs/guides/DEVELOPMENT_GUIDE.md)
- [API 문서](./docs/api/API_DOCUMENTATION.md)
- [아키텍처](./docs/architecture/ARCHITECTURE.md)
- [배포 가이드](./docs/guides/DEPLOYMENT_GUIDE.md)
- [보안 가이드](./docs/guides/SECURITY_GUIDE.md)

## 🛠 기술 스택

### Frontend
- React Native + Expo SDK 50
- TypeScript 5.x
- Zustand (상태 관리)
- Socket.IO Client
- React Navigation 6.x

### Backend
- Node.js 20.x LTS + Express.js
- TypeScript 5.x
- Prisma ORM + PostgreSQL
- Redis (캐시/세션)
- Socket.IO Server

### Infrastructure
- AWS (EC2, RDS, S3, CloudFront)
- Docker + Kubernetes
- GitHub Actions (CI/CD)
- Prometheus + Grafana (모니터링)

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 비공개 소프트웨어입니다. 무단 복제 및 배포를 금지합니다.

## 📞 문의

- Email: contact@glimpse.kr
- Website: https://glimpse.kr

---

<p align="center">Made with ❤️ by Glimpse Team</p>