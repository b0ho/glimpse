# Glimpse Server - Spring Boot Version

## 🚀 Quick Start

```bash
# 1. 환경 변수 설정
cp .env.example .env
# .env 파일 수정

# 2. 빌드
mvn clean install

# 3. 실행
mvn spring-boot:run
# 또는
java -jar target/glimpse-server-0.0.1-SNAPSHOT.jar
```

## 📋 마이그레이션 현황

### ✅ 완료된 모듈
- [x] **Core**
  - [x] Spring Boot 프로젝트 설정
  - [x] JPA Entity 정의 (30+ entities)
  - [x] 기본 Configuration
  - [x] Exception Handling

- [x] **Security**
  - [x] JWT Token Provider
  - [x] Spring Security Config
  - [x] Authentication Filter
  - [x] Clerk Integration (준비됨)

- [x] **User Module**
  - [x] User CRUD
  - [x] Credits Management
  - [x] Premium Subscription
  - [x] Profile Management

- [x] **Group Module**
  - [x] Group CRUD
  - [x] Member Management
  - [x] Official/Created/Location Groups
  - [x] Invitation System

- [x] **Matching Module (Core)**
  - [x] Like System
  - [x] Match Creation
  - [x] Verification System
  - [x] Recommendations (기본)

### 🚧 진행 중
- [ ] **Chat/WebSocket**
  - [ ] WebSocket Configuration
  - [ ] STOMP Protocol
  - [ ] Real-time Messaging
  - [ ] Message History

- [ ] **Payment**
  - [ ] Stripe Integration
  - [ ] TossPay/KakaoPay
  - [ ] Subscription Management

### 📝 TODO
- [ ] Interest Module
- [ ] Notification (FCM)
- [ ] File Upload (S3)
- [ ] Location Services
- [ ] Story Feature
- [ ] Friend System
- [ ] Admin Panel
- [ ] Scheduler/Cron
- [ ] Email/SMS Services

## 🏗️ Architecture

```
server2/
├── src/main/java/com/glimpse/server/
│   ├── config/          # Configuration
│   ├── controller/      # REST API Controllers
│   ├── dto/            # Data Transfer Objects
│   ├── entity/         # JPA Entities
│   ├── exception/      # Custom Exceptions
│   ├── repository/     # Spring Data JPA Repositories
│   ├── security/       # Security Components
│   ├── service/        # Business Logic
│   ├── util/          # Utilities
│   └── websocket/     # WebSocket (TODO)
└── src/main/resources/
    └── application.yml  # Configuration
```

## 🔗 API Documentation

- Swagger UI: http://localhost:3001/api/swagger
- OpenAPI Spec: http://localhost:3001/api/docs

## 💾 Database

기존 NestJS 서버의 PostgreSQL 데이터베이스를 그대로 사용합니다.
- Prisma Schema와 100% 호환
- JPA Entity 매핑 완료
- 마이그레이션 불필요 (기존 스키마 유지)

## 🔐 Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=glimpse
DB_USERNAME=postgres
DB_PASSWORD=postgres

# Server
SERVER_PORT=3001

# JWT
JWT_SECRET=your-secret-key-here

# Clerk
CLERK_SECRET_KEY=sk_xxx
CLERK_PUBLISHABLE_KEY=pk_xxx

# Stripe
STRIPE_API_KEY=sk_xxx

# Firebase
FIREBASE_CREDENTIALS_PATH=/path/to/credentials.json

# AWS
AWS_ACCESS_KEY=xxx
AWS_SECRET_KEY=xxx
AWS_S3_BUCKET=glimpse-uploads

# Twilio
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+xxx
```

## 🧪 Testing

```bash
# Unit tests
mvn test

# Integration tests
mvn verify

# Test coverage
mvn jacoco:report
```

## 📈 Performance

### JVM Optimization
```bash
java -Xms1g -Xmx2g -XX:+UseG1GC -jar target/glimpse-server.jar
```

### Connection Pool
- HikariCP 설정됨
- Max Pool Size: 10
- Min Idle: 5

## 🚀 Deployment

### Docker
```dockerfile
FROM openjdk:17-jdk-slim
COPY target/glimpse-server.jar app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

### Railway/Heroku
- Procfile 포함
- 환경 변수 설정 필요

## 📚 Key Differences from NestJS Version

| Feature | NestJS | Spring Boot |
|---------|--------|-------------|
| Language | TypeScript | Java 17 |
| ORM | Prisma | JPA/Hibernate |
| WebSocket | Socket.IO | Spring WebSocket + STOMP |
| DI | Decorator-based | Annotation-based |
| Build | npm/yarn | Maven |

## 🤝 API Compatibility

NestJS 서버와 100% API 호환성 유지:
- 동일한 엔드포인트 경로
- 동일한 요청/응답 포맷
- 동일한 인증 헤더
- `x-dev-auth` 개발 모드 지원

## 📞 Support

- GitHub Issues: [Report bugs](https://github.com/glimpse/server2/issues)
- Documentation: [Wiki](https://github.com/glimpse/server2/wiki)

---
*Last Updated: 2024-01-14*