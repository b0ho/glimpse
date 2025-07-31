# Glimpse 배포 가이드

## 🚀 배포 개요

Glimpse는 모노레포 구조로 되어 있으며, 다음과 같은 컴포넌트들을 배포해야 합니다:

1. **Backend API Server** (Node.js/Express)
2. **Mobile App** (React Native/Expo)
3. **Database** (PostgreSQL)
4. **Cache/Session** (Redis)
5. **File Storage** (AWS S3)

## 🏗 인프라 구성

### AWS 아키텍처
```
┌─────────────────────────────────────────────────────────────┐
│                        Route 53                              │
│                    (DNS: api.glimpse.kr)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                     CloudFront                               │
│              (CDN for static assets)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│              Application Load Balancer                       │
│                    (HTTPS/WSS)                              │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
┌───────┴────────┐              ┌────────┴───────┐
│   EC2/ECS      │              │   EC2/ECS      │
│  API Server 1  │              │  API Server 2  │
└───────┬────────┘              └────────┬───────┘
        │                                 │
        └────────────┬────────────────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
┌────┴─────┐   ┌────┴─────┐   ┌────┴─────┐
│   RDS    │   │  Redis   │   │    S3    │
│PostgreSQL│   │ Cluster  │   │  Bucket  │
└──────────┘   └──────────┘   └──────────┘
```

## 📦 서버 배포

### 1. Docker 이미지 빌드

#### Dockerfile (server/Dockerfile)
```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/

# Install dependencies
RUN npm ci --workspace=server --workspace=shared

# Copy source code
COPY server ./server
COPY shared ./shared

# Build
RUN npm run build --workspace=shared
RUN npm run build --workspace=server

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/

RUN npm ci --workspace=server --workspace=shared --production

# Copy built files
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/shared/dist ./shared/dist
COPY server/prisma ./server/prisma

# Environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start server
CMD ["node", "server/dist/index.js"]
```

### 2. Docker Compose (개발/스테이징)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: glimpse
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: server/Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/glimpse
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      NODE_ENV: production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./logs:/app/logs

volumes:
  postgres_data:
```

### 3. Kubernetes 배포 (프로덕션)

#### Deployment (k8s/api-deployment.yaml)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: glimpse-api
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: glimpse-api
  template:
    metadata:
      labels:
        app: glimpse-api
    spec:
      containers:
      - name: api
        image: your-registry/glimpse-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: glimpse-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: glimpse-secrets
              key: redis-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: glimpse-api-service
  namespace: production
spec:
  selector:
    app: glimpse-api
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

### 4. CI/CD Pipeline (GitHub Actions)

#### .github/workflows/deploy.yml
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Type check
      run: npm run typecheck

  build:
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
    
    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1
    
    - name: Build and push Docker image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: glimpse-api
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG -f server/Dockerfile .
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
    - name: Deploy to ECS
      run: |
        aws ecs update-service \
          --cluster glimpse-cluster \
          --service glimpse-api-service \
          --force-new-deployment
```

## 📱 모바일 앱 배포

### 1. Expo Application Services (EAS) 설정

#### eas.json
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://staging-api.glimpse.kr/api/v1"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.glimpse.kr/api/v1"
      },
      "ios": {
        "resourceClass": "m-large"
      },
      "android": {
        "resourceClass": "large"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "app@glimpse.kr",
        "ascAppId": "1234567890"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-key.json"
      }
    }
  }
}
```

### 2. 빌드 및 배포 스크립트

```bash
#!/bin/bash
# scripts/deploy-mobile.sh

# 버전 업데이트
npm version patch --workspace=mobile

# iOS 빌드
eas build --platform ios --profile production

# Android 빌드
eas build --platform android --profile production

# 스토어 제출
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

### 3. Over-the-Air (OTA) 업데이트

```bash
# 긴급 패치 배포
expo publish --release-channel production

# 특정 버전만 업데이트
expo publish --release-channel production --target-sdk-version 50.0.0
```

## 🗄 데이터베이스 배포

### 1. RDS 설정

```terraform
# terraform/rds.tf
resource "aws_db_instance" "glimpse_db" {
  identifier     = "glimpse-production"
  engine         = "postgres"
  engine_version = "14.7"
  instance_class = "db.t3.medium"
  
  allocated_storage     = 100
  max_allocated_storage = 500
  storage_encrypted     = true
  
  db_name  = "glimpse"
  username = "postgres"
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  multi_az               = true
  deletion_protection    = true
  
  tags = {
    Name        = "glimpse-production-db"
    Environment = "production"
  }
}
```

### 2. 데이터베이스 마이그레이션

```bash
# 마이그레이션 스크립트
#!/bin/bash
# scripts/migrate-production.sh

# 백업 생성
aws rds create-db-snapshot \
  --db-instance-identifier glimpse-production \
  --db-snapshot-identifier glimpse-backup-$(date +%Y%m%d-%H%M%S)

# 마이그레이션 실행
DATABASE_URL=$PRODUCTION_DATABASE_URL npx prisma migrate deploy

# 검증
DATABASE_URL=$PRODUCTION_DATABASE_URL npx prisma db seed
```

## 🔄 무중단 배포

### 1. Blue-Green 배포

```bash
# Blue-Green 배포 스크립트
#!/bin/bash

# 1. Green 환경에 새 버전 배포
kubectl set image deployment/glimpse-api-green \
  api=your-registry/glimpse-api:$NEW_VERSION \
  -n production

# 2. Green 환경 헬스체크
kubectl wait --for=condition=ready pod \
  -l app=glimpse-api-green \
  -n production \
  --timeout=300s

# 3. 트래픽 전환
kubectl patch service glimpse-api-service \
  -p '{"spec":{"selector":{"app":"glimpse-api-green"}}}' \
  -n production

# 4. Blue 환경 업데이트
kubectl set image deployment/glimpse-api-blue \
  api=your-registry/glimpse-api:$NEW_VERSION \
  -n production
```

### 2. 카나리 배포

```yaml
# k8s/canary-deployment.yaml
apiVersion: v1
kind: Service
metadata:
  name: glimpse-api-canary
spec:
  selector:
    app: glimpse-api
    version: canary
  ports:
  - port: 80
    targetPort: 3000
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: glimpse-api-ingress
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "10"
spec:
  rules:
  - host: api.glimpse.kr
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: glimpse-api-canary
            port:
              number: 80
```

## 📊 모니터링 설정

### 1. CloudWatch 대시보드

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ECS", "CPUUtilization", "ServiceName", "glimpse-api"],
          [".", "MemoryUtilization", ".", "."]
        ],
        "period": 300,
        "stat": "Average",
        "region": "ap-northeast-2",
        "title": "ECS Service Metrics"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", "glimpse-production"],
          [".", "CPUUtilization", ".", "."],
          [".", "FreeableMemory", ".", "."]
        ],
        "period": 300,
        "stat": "Average",
        "region": "ap-northeast-2",
        "title": "RDS Metrics"
      }
    }
  ]
}
```

### 2. 알림 설정

```terraform
# terraform/alarms.tf
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "glimpse-api-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
}
```

## 🔐 프로덕션 보안

### 1. 환경 변수 관리 (AWS Secrets Manager)

```bash
# 시크릿 생성
aws secretsmanager create-secret \
  --name glimpse/production \
  --secret-string file://secrets.json

# ECS 태스크 정의에서 사용
{
  "secrets": [
    {
      "name": "DATABASE_URL",
      "valueFrom": "arn:aws:secretsmanager:ap-northeast-2:123456789:secret:glimpse/production:database_url::"
    }
  ]
}
```

### 2. SSL 인증서 설정

```bash
# Let's Encrypt 인증서 자동 갱신
certbot certonly --webroot \
  -w /var/www/glimpse \
  -d api.glimpse.kr \
  --non-interactive \
  --agree-tos \
  --email admin@glimpse.kr
```

## 📋 배포 체크리스트

### 배포 전
- [ ] 모든 테스트 통과
- [ ] 데이터베이스 백업
- [ ] 환경 변수 확인
- [ ] 의존성 취약점 스캔
- [ ] 로드 테스트 수행

### 배포 중
- [ ] 헬스체크 모니터링
- [ ] 에러율 모니터링
- [ ] 응답 시간 확인
- [ ] 리소스 사용량 확인

### 배포 후
- [ ] 기능 테스트
- [ ] 성능 메트릭 확인
- [ ] 로그 확인
- [ ] 사용자 피드백 모니터링
- [ ] 롤백 계획 준비

## 🆘 롤백 절차

```bash
#!/bin/bash
# scripts/rollback.sh

# 1. 이전 버전 확인
PREVIOUS_VERSION=$(kubectl get deployment glimpse-api -o jsonpath='{.metadata.annotations.previous-version}')

# 2. 롤백 실행
kubectl set image deployment/glimpse-api \
  api=your-registry/glimpse-api:$PREVIOUS_VERSION

# 3. 롤백 확인
kubectl rollout status deployment/glimpse-api

# 4. 데이터베이스 롤백 (필요시)
DATABASE_URL=$PRODUCTION_DATABASE_URL npx prisma migrate rollback
```