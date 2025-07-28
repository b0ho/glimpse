# 🍃 Glimpse - 익명 데이팅 앱

프라이버시 중심의 한국 데이팅 앱으로, 익명성과 그룹 기반 매칭을 핵심으로 합니다.

## 📋 프로젝트 구조

```
glimpse-monorepo/
├── mobile/          # React Native 모바일 앱 (Expo)
├── server/          # Node.js + Express 백엔드
├── shared/          # 공유 타입, 유틸리티, 상수
├── web/            # Next.js 관리자 대시보드
└── tests/          # E2E 테스트 (Playwright)
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
- 서버 API: http://localhost:8080
- 웹 대시보드: http://localhost:3000

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
# 모바일 앱만
npm run dev:mobile

# 서버만  
npm run dev:server

# 웹만
npm run dev:web

# Database management
npm run db:studio
```

## 🛠 Tech Stack

### Mobile (React Native + Expo)
- **React Native 0.79** with Expo 53
- **TypeScript** for type safety
- **Zustand** for state management
- **React Navigation** for routing
- **Socket.IO Client** for real-time features
- **Expo Secure Store** for sensitive data
- **Stripe React Native** for payments

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

## 🏗 Architecture

### API Design
- **RESTful APIs** for CRUD operations
- **WebSocket** for real-time features (chat, typing, presence)
- **JWT Authentication** with refresh tokens
- **Rate limiting** for security

### Database Schema
- **Users** - Profile, verification, credits, premium status
- **Groups** - 4 types with different business rules
- **Matches** - Mutual likes create matches
- **Messages** - Encrypted chat history
- **Payments** - Stripe transaction records

### Mobile App Structure
- **Screens** - React Native screens with navigation
- **Components** - Reusable UI components
- **Services** - API calls, WebSocket, push notifications
- **Stores** - Zustand state management
- **Utils** - Helper functions, constants

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Mobile App Guide](./docs/mobile.md)
- [Database Schema](./docs/database.md)
- [Deployment Guide](./docs/deployment.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Stripe Documentation](https://stripe.com/docs/)