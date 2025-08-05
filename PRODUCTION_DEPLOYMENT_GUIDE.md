# 프로덕션 배포 가이드

## 개요
Glimpse 모노레포의 프로덕션 배포를 위한 포괄적인 가이드입니다.

## 배포 아키텍처

### 1. 인프라 구성
```
┌─────────────────────────────────────────────────────────┐
│                    CloudFlare CDN                        │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                         │
│                  (AWS ALB / NLB)                        │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
┌───────────────┐                     ┌───────────────┐
│   NestJS API  │                     │  Next.js Web  │
│   (Port 8000) │                     │  (Port 3000)  │
│   EC2/ECS/K8s │                     │   Vercel/EC2  │
└───────────────┘                     └───────────────┘
        │                                       │
        └───────────────────┬───────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
    ┌───────────────┐              ┌───────────────┐
    │  PostgreSQL   │              │     Redis     │
    │   (AWS RDS)   │              │ (ElastiCache) │
    └───────────────┘              └───────────────┘
```

### 2. 서비스별 배포

#### A. NestJS 백엔드 서버
- **옵션 1**: AWS ECS with Fargate
- **옵션 2**: AWS EC2 with PM2
- **옵션 3**: Kubernetes (EKS)
- **추천**: ECS Fargate (서버리스, 자동 스케일링)

#### B. Next.js 웹 어드민
- **옵션 1**: Vercel (추천)
- **옵션 2**: AWS Amplify
- **옵션 3**: EC2 with Nginx

#### C. React Native 모바일 앱
- **iOS**: App Store Connect
- **Android**: Google Play Console
- **OTA 업데이트**: Expo Updates

## 환경 변수 설정

### 1. 백엔드 서버 (.env.production)
```bash
# Database
DATABASE_URL="postgresql://glimpse_prod:SECURE_PASSWORD@rds-endpoint:5432/glimpse_prod?schema=public&sslmode=require"

# Redis
REDIS_HOST="elasticache-endpoint"
REDIS_PORT=6379
REDIS_PASSWORD="SECURE_REDIS_PASSWORD"

# Security
JWT_SECRET="SECURE_64_CHAR_SECRET"
ENCRYPTION_KEY="SECURE_32_CHAR_KEY"

# AWS
AWS_REGION="ap-northeast-2"
AWS_ACCESS_KEY_ID="YOUR_AWS_ACCESS_KEY"
AWS_SECRET_ACCESS_KEY="YOUR_AWS_SECRET_KEY"
AWS_S3_BUCKET="glimpse-prod-uploads"

# Payment
STRIPE_SECRET_KEY="sk_live_..."
TOSS_CLIENT_KEY="live_..."
TOSS_SECRET_KEY="live_..."
KAKAO_PAY_CID="TC0ONETIME"
KAKAO_PAY_SECRET_KEY="..."

# External APIs
KAKAO_REST_API_KEY="..."
NAVER_CLIENT_ID="..."
NAVER_CLIENT_SECRET="..."
GOOGLE_CLOUD_API_KEY="..."

# Firebase
FIREBASE_PROJECT_ID="glimpse-prod"
FIREBASE_PRIVATE_KEY="..."
FIREBASE_CLIENT_EMAIL="..."

# Email
SMTP_HOST="ses-smtp.ap-northeast-2.amazonaws.com"
SMTP_PORT=587
SMTP_USER="..."
SMTP_PASS="..."

# SMS
SMS_API_KEY="..."
SMS_API_SECRET="..."
SMS_SENDER="1588-0000"

# Admin
ADMIN_EMAIL="admin@glimpse.app"
ADMIN_PASSWORD="SECURE_ADMIN_PASSWORD"
```

### 2. 웹 어드민 (.env.production)
```bash
NEXT_PUBLIC_API_URL="https://api.glimpse.app"
NEXT_PUBLIC_SOCKET_URL="wss://api.glimpse.app"
```

### 3. 모바일 앱 (eas.json)
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.glimpse.app",
        "EXPO_PUBLIC_SOCKET_URL": "wss://api.glimpse.app",
        "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_live_..."
      }
    }
  }
}
```

## Docker 이미지 빌드

### 1. NestJS 서버 Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/
RUN npm ci --workspace=server --workspace=shared

COPY shared ./shared
COPY server ./server
RUN npm run build:server

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/
RUN npm ci --workspace=server --workspace=shared --production

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist
COPY server/prisma ./server/prisma

WORKDIR /app/server
RUN npx prisma generate

EXPOSE 8000
CMD ["node", "dist/main.js"]
```

### 2. 빌드 및 배포 스크립트
```bash
#!/bin/bash
# deploy.sh

# 1. 이미지 빌드
docker build -t glimpse-api:latest -f docker/Dockerfile.server .

# 2. ECR 푸시 (AWS)
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin $ECR_URI
docker tag glimpse-api:latest $ECR_URI/glimpse-api:latest
docker push $ECR_URI/glimpse-api:latest

# 3. ECS 서비스 업데이트
aws ecs update-service --cluster glimpse-prod --service glimpse-api --force-new-deployment
```

## CI/CD 파이프라인

### GitHub Actions (.github/workflows/deploy.yml)
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test

  deploy-api:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-2
      
      - name: Build and push Docker image
        run: |
          docker build -t glimpse-api -f docker/Dockerfile.server .
          aws ecr get-login-password | docker login --username AWS --password-stdin ${{ secrets.ECR_URI }}
          docker tag glimpse-api:latest ${{ secrets.ECR_URI }}/glimpse-api:latest
          docker push ${{ secrets.ECR_URI }}/glimpse-api:latest
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster glimpse-prod --service glimpse-api --force-new-deployment

  deploy-web:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 데이터베이스 마이그레이션

### 1. 프로덕션 마이그레이션 스크립트
```bash
#!/bin/bash
# migrate-prod.sh

# 백업 생성
pg_dump $PROD_DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# 마이그레이션 실행
DATABASE_URL=$PROD_DATABASE_URL npx prisma migrate deploy

# 헬스 체크
curl https://api.glimpse.app/health
```

### 2. 롤백 전략
```bash
# 이전 버전으로 롤백
DATABASE_URL=$PROD_DATABASE_URL npx prisma migrate resolve --rolled-back VERSION
```

## 모니터링 및 로깅

### 1. CloudWatch 설정
```javascript
// server/src/main.ts
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

const logger = WinstonModule.createLogger({
  transports: [
    new winston.transports.CloudWatch({
      logGroupName: 'glimpse-api',
      logStreamName: `${process.env.NODE_ENV}-${new Date().toISOString().split('T')[0]}`,
      awsRegion: 'ap-northeast-2',
    }),
  ],
});
```

### 2. 성능 모니터링 (APM)
```bash
# New Relic 또는 DataDog 설정
npm install @newrelic/agent
```

### 3. 헬스 체크 엔드포인트
- `/health` - 기본 헬스 체크
- `/health/db` - 데이터베이스 연결 체크
- `/health/redis` - Redis 연결 체크

## 보안 체크리스트

### 1. 인프라 보안
- [ ] VPC 및 서브넷 구성
- [ ] Security Groups 최소 권한
- [ ] WAF 규칙 설정
- [ ] SSL/TLS 인증서 (Let's Encrypt)
- [ ] DDoS 보호 (CloudFlare)

### 2. 애플리케이션 보안
- [ ] 환경 변수 암호화 (AWS Secrets Manager)
- [ ] API Rate Limiting
- [ ] SQL Injection 방지
- [ ] XSS 방지
- [ ] CORS 설정
- [ ] 헤더 보안 (Helmet.js)

### 3. 데이터 보안
- [ ] 데이터베이스 암호화 (at rest)
- [ ] 백업 암호화
- [ ] 개인정보 마스킹
- [ ] 로그 민감정보 제거

## 성능 최적화

### 1. 서버 최적화
- PM2 클러스터 모드 또는 ECS 태스크 수
- Redis 캐싱 전략
- 데이터베이스 인덱싱
- CDN 정적 자산

### 2. 클라이언트 최적화
- 이미지 최적화 (WebP, 지연 로딩)
- 코드 스플리팅
- 번들 크기 최적화
- 서비스 워커 캐싱

## 배포 체크리스트

### 배포 전
- [ ] 모든 테스트 통과
- [ ] 환경 변수 확인
- [ ] 데이터베이스 백업
- [ ] 롤백 계획 준비

### 배포 중
- [ ] 점진적 배포 (Blue/Green)
- [ ] 헬스 체크 모니터링
- [ ] 에러 로그 모니터링
- [ ] 성능 메트릭 확인

### 배포 후
- [ ] 스모크 테스트
- [ ] 사용자 피드백 모니터링
- [ ] 성능 지표 확인
- [ ] 보안 스캔

## 트러블슈팅

### 일반적인 이슈
1. **메모리 부족**: 컨테이너 메모리 증가
2. **연결 타임아웃**: 타임아웃 값 조정
3. **느린 쿼리**: 쿼리 최적화 및 인덱싱
4. **높은 CPU**: 오토스케일링 설정

### 응급 대응
```bash
# 서비스 재시작
aws ecs update-service --cluster glimpse-prod --service glimpse-api --desired-count 0
aws ecs update-service --cluster glimpse-prod --service glimpse-api --desired-count 2

# 이전 버전 롤백
aws ecs update-service --cluster glimpse-prod --service glimpse-api --task-definition glimpse-api:PREVIOUS_VERSION
```

## 연락처
- **DevOps 팀**: devops@glimpse.app
- **긴급 연락처**: +82-10-XXXX-XXXX
- **Slack**: #glimpse-production

---

마지막 업데이트: 2025-08-05