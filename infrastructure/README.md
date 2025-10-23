# Glimpse AWS Infrastructure

> **업데이트**: 2025-10-23
> **현재 비용**: **$73/월** (Phase 5 진행중)
> **Phase 5 완료 목표**: **$56/월** (총 72% 절감)
> **CloudFront**: 12개월 무료 티어 적용 ✅
> **지원 규모**: 0-500명 유저

---

## 📊 비용 구조

### Phase 4 완료

| 구성 요소 | 사양 | 월 비용 |
|----------|------|--------|
| **ECS Fargate** | 3 tasks × 0.25 vCPU, 0.5GB, Spot 70% | $40 |
| **RDS PostgreSQL** | db.t4g.micro (2 vCPU, 1GB) | $13 |
| **ElastiCache Redis** | cache.t4g.micro (0.5GB) | $12 |
| **NAT Instance** | t4g.nano + EBS 8GB | $4 |
| **ALB** | Application Load Balancer | $17 |
| **기타** | API Gateway, S3, CloudWatch, SNS | $7 |
| **총계** | | **$83/월** |

### Phase 5 진행중 (CloudFront + ECS 최적화)

| 구성 요소 | 사양 | 변경사항 | 월 비용 |
|----------|------|----------|--------|
| **ECS Fargate** | 2 tasks × 0.25 vCPU, 0.5GB, Spot 90% | ✅ 3→2 tasks, 70%→90% Spot | **$23** (-$17) |
| **RDS PostgreSQL** | db.t4g.micro (2 vCPU, 1GB) | 변경 없음 | $13 |
| **ElastiCache Redis** | cache.t4g.micro (0.5GB) | 변경 없음 | $12 |
| **CloudFront CDN** | Korea only, 12개월 무료 | ✅ 추가 | **$0** → $8 |
| **NAT Instance** | t4g.nano + EBS 8GB | 변경 없음 | $4 |
| **ALB** | Application Load Balancer | 변경 없음 | $17 |
| **기타** | API Gateway, S3, CloudWatch, SNS | 변경 없음 | $7 |
| **총계 (현재)** | | | **$73/월** (-$10) |

### Phase 5 완료 목표

S3 Pre-signed URL + HTTP Keep-Alive 적용 시:

| 구성 요소 | 사양 | 추가 변경사항 | 월 비용 |
|----------|------|-------------|--------|
| **ECS Fargate** | 2 tasks × 0.25 vCPU, 0.5GB, Spot 90% | ✅ 완료 | $23 |
| **RDS PostgreSQL** | db.t4g.micro (2 vCPU, 1GB) | - | $13 |
| **ElastiCache Redis** | cache.t4g.micro (0.5GB) | - | $12 |
| **CloudFront CDN** | Korea only, 12개월 무료 | ✅ 완료 | $0 |
| **NAT Instance** | t4g.nano + EBS 8GB | - | $4 |
| **ALB** | Application Load Balancer | - | $17 |
| **기타** | S3, CloudWatch, SNS | 📋 S3 Pre-signed URL 적용 필요 | **$2** (-$5) |
| **총계 (목표)** | | | **$56/월** (-$27, 총 72% 절감) |

### 비용 절감 히스토리

```
Phase 0: EKS 기반                    $198/월
  ↓ Phase 1: ECS Fargate
Phase 1: ECS 전환                    $141/월 (-29%)
  ↓ Phase 2: NAT Instance
Phase 2: NAT 최적화                  $108/월 (-23%)
  ↓ Phase 3: ALB 최적화
Phase 3: ALB 최적화                  $96/월 (-11%)
  ↓ Phase 4: RDS Downsizing
Phase 4: RDS micro                   $83/월 (-14%)
  ↓ Phase 5: CloudFront + ECS 최적화 (진행중)
Phase 5 현재: CDN + Spot 90% + 2 tasks  $73/월 (-12%)
Phase 5 목표: S3 Pre-signed URL      $56/월 (-23%)

총 절감 (Phase 5 목표): $142/월 (72%)
```

---

## 🏗️ 아키텍처

```
Internet
   │
   ├─ Route 53 (glimpse.contact)
   │
   ├─ CloudFront CDN (Korea only, 12개월 무료)
   │  ├─ /profiles/* (캐시 7일, 높은 재사용)
   │  ├─ /groups/* (캐시 14일, 매우 높은 재사용)
   │  ├─ /chat/* (캐시 1일, 낮은 재사용)
   │  └─ S3 Origin (OAC 보안 접근)
   │
   ├─ ALB (SSL Termination)
   │  └─ ECS Fargate (2 tasks, Spot 90%) ✅ Phase 5
   │     ├─ NestJS API (0.25 vCPU, 512MB)
   │     └─ Socket.IO (WebSocket)
   │
   ├─ RDS PostgreSQL (db.t4g.micro, 1GB RAM)
   │  └─ Prisma (Connection Pool: 50)
   │
   ├─ ElastiCache Redis (cache.t4g.micro, 0.5GB)
   │  ├─ Session Store
   │  └─ Query Cache (85% hit rate)
   │
   ├─ S3 (Pre-signed URL)
   │  ├─ CloudFront로 캐싱 배포
   │  └─ 파일 직접 업로드 (ALB 우회)
   │
   └─ NAT Instance (t4g.nano)
      └─ 아웃바운드 트래픽
```

### 핵심 최적화

1. **ECS Fargate Spot 90%** ✅ - 컴퓨팅 비용 90% 절감 (Phase 5)
2. **ECS Task 감소 (3→2)** ✅ - 추가 $10/월 절감 (Phase 5)
3. **CloudFront CDN** ✅ - 12개월 무료, 이후 $8/월 (Phase 5)
4. **NAT Instance** - NAT Gateway 대비 $33/월 절감
5. **Graviton2 ARM** - x86 대비 20% 저렴 + 성능 향상
6. **RDS db.t4g.micro** - 1GB RAM, 50 connections로 최적화
7. **Redis 캐싱** - DB 쿼리 85% 감소

---

## 🚀 배포 방법

### 1. Terraform 적용

```bash
cd infrastructure/terraform/environments/startup-prod

# 초기화
terraform init

# 계획 확인
terraform plan

# 적용
terraform apply
```

### 2. Docker 이미지 빌드 & 배포

```bash
# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com

# 이미지 빌드
cd server
docker build -t glimpse-api:latest .

# ECR 푸시
docker tag glimpse-api:latest <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com/glimpse-api:latest
docker push <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com/glimpse-api:latest

# ECS 서비스 업데이트
aws ecs update-service \
  --cluster glimpse-prod \
  --service glimpse-api \
  --force-new-deployment
```

### 3. 환경 변수 설정

```bash
# Secrets Manager에 저장
aws secretsmanager create-secret \
  --name glimpse-prod-jwt-secret \
  --secret-string "your-jwt-secret"

aws secretsmanager create-secret \
  --name glimpse-prod-db-password \
  --secret-string "your-db-password"

aws secretsmanager create-secret \
  --name glimpse-prod-redis-auth-token \
  --secret-string "your-redis-token"
```

### 4. CloudFront CDN 사용

```bash
# CloudFront 배포 완료 후 도메인 확인
terraform output cloudfront_domain_name
# 출력 예시: d1234567890abc.cloudfront.net

# 애플리케이션에서 CloudFront URL 사용
# .env 파일에 추가
CLOUDFRONT_DOMAIN=https://d1234567890abc.cloudfront.net

# 파일 URL 구성
# 프로필 이미지: https://d1234567890abc.cloudfront.net/profiles/{userId}/{filename}
# 그룹 썸네일: https://d1234567890abc.cloudfront.net/groups/{groupId}/{filename}
# 채팅 이미지: https://d1234567890abc.cloudfront.net/chat/{chatId}/{filename}
```

**모바일 앱에서 CloudFront 사용:**

```typescript
// mobile/services/fileService.ts
const CLOUDFRONT_DOMAIN = process.env.EXPO_PUBLIC_CLOUDFRONT_DOMAIN;

export const getFileUrl = (path: string) => {
  return `${CLOUDFRONT_DOMAIN}/${path}`;
};

// 사용 예시
const profileImageUrl = getFileUrl(`profiles/${userId}/avatar.jpg`);
```

**캐시 무효화 (파일 업데이트 시):**

```bash
# 특정 파일 캐시 무효화
aws cloudfront create-invalidation \
  --distribution-id $(terraform output -raw cloudfront_distribution_id) \
  --paths "/profiles/user123/*"

# 전체 캐시 무효화 (비용 발생 주의)
aws cloudfront create-invalidation \
  --distribution-id $(terraform output -raw cloudfront_distribution_id) \
  --paths "/*"
```

---

## 📈 추가 최적화 (Phase 5)

**CloudFront CDN 적용 완료** ✅
- 무료 티어 12개월: $0/월
- 이후: $8/월 (프로필/그룹 이미지 캐싱)

즉시 적용 가능한 추가 절감: **$91 → $74/월** (-$17, 무료 티어 이후)

### 1. ECS Spot 비율 90% 증가 (-$7/월)

```hcl
# terraform/environments/startup-prod/main.tf
capacity_provider_strategy {
  capacity_provider = "FARGATE_SPOT"
  weight            = 90  # Changed from 70
  base              = 0
}
```

### 2. S3 Pre-signed URL 구현 (-$10/월)

```typescript
// server/src/file/file.service.ts
async getPresignedUploadUrl(userId: string, fileName: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `uploads/${userId}/${Date.now()}-${fileName}`,
  });

  return getSignedUrl(this.s3Client, command, { expiresIn: 300 });
}
```

```typescript
// mobile: S3에 직접 업로드 (ALB 우회)
const { uploadUrl } = await api.post('/files/presigned-url', { fileName });
await fetch(uploadUrl, { method: 'PUT', body: file });
```

### 3. HTTP Keep-Alive 활성화 (-$3/월)

```typescript
// server/src/main.ts
const app = await NestFactory.create(AppModule, {
  httpsOptions: {
    keepAlive: true,
    keepAliveTimeout: 60000,
  },
});

app.use((req, res, next) => {
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=60, max=1000');
  next();
});
```

### 4. Prisma Connection Pool 최적화

```prisma
// server/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // db.t4g.micro (1GB RAM) 최적화
  connectionLimit    = 50    // RDS micro 적정 수준
  poolTimeout        = 30
  statementCacheSize = 100
}
```

---

## ⚠️ 중요 고려사항

### Dev/Prod 환경 분리 비용

**현재 (단일 Prod)**: $83/월
**Dev + Prod 분리**: $159/월 (+$76, 92% 증가)

**권장 전략:**
- 초기 단계: 단일 Prod 유지 + 로컬 Docker Compose
- 성장기 (500명 이상): Dev 환경 추가 검토

### RDS db.t4g.micro 제약사항

- **RAM**: 1GB (커넥션 풀 50개)
- **적정 유저**: 0-500명
- **업그레이드 시점**: 메모리 사용률 80% 이상

**모니터링 설정:**
```typescript
// CloudWatch 알람
- RDS 메모리 < 200MB → 알람
- RDS 커넥션 > 45개 → 알람
- ECS CPU > 70% → Scale Out
```

---

## 📂 Terraform 구조

```
terraform/
├── environments/
│   └── startup-prod/          # 단일 프로덕션 환경
│       ├── main.tf
│       └── variables.tf
└── modules/
    ├── networking/            # VPC, Subnets, NAT
    ├── ecs/                   # ECS Fargate Cluster
    ├── rds/                   # PostgreSQL
    ├── elasticache/           # Redis
    ├── s3/                    # File Storage
    ├── api-gateway/           # API Gateway (선택)
    ├── cognito/               # User Pool
    └── monitoring/            # CloudWatch
```

### 주요 Terraform 리소스

```hcl
# VPC (10.0.0.0/16, 2 AZs)
module "networking" {
  source = "../../modules/networking"
  vpc_cidr = "10.0.0.0/16"
  availability_zones = ["ap-northeast-2a", "ap-northeast-2c"]
  single_nat_gateway = true  # NAT Instance 사용
}

# ECS Fargate
module "ecs" {
  source = "../../modules/ecs"
  task_cpu    = "256"   # 0.25 vCPU
  task_memory = "512"   # 0.5 GB
  desired_count = 3
  min_capacity  = 2
  max_capacity  = 20
}

# RDS PostgreSQL
module "rds" {
  source = "../../modules/rds"
  instance_class = "db.t4g.micro"  # 2 vCPU, 1GB RAM
  allocated_storage = 20
  backup_retention_period = 7
}

# ElastiCache Redis
module "elasticache" {
  source = "../../modules/elasticache"
  node_type = "cache.t4g.micro"  # 0.5GB RAM
  num_cache_nodes = 1
}
```

---

## 🔒 보안 설정

### 1. Security Groups

```hcl
# ALB Security Group
resource "aws_security_group" "alb" {
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ECS Security Group
resource "aws_security_group" "ecs" {
  ingress {
    from_port       = 3001
    to_port         = 3001
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
}

# RDS Security Group
resource "aws_security_group" "rds" {
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }
}
```

### 2. IAM Roles

```hcl
# ECS Task Execution Role
resource "aws_iam_role" "ecs_execution_role" {
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

# S3 Access Policy
resource "aws_iam_policy" "s3_access" {
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ]
      Resource = "arn:aws:s3:::glimpse-files-prod/*"
    }]
  })
}
```

---

## 📊 모니터링

### CloudWatch 대시보드

```typescript
// 주요 메트릭
- ECS CPU/Memory 사용률
- RDS 커넥션 수 / 메모리
- Redis 히트율 / 메모리
- ALB 요청 수 / 응답 시간
- NAT Instance 네트워크 I/O
```

### 알람 설정

```typescript
// 중요 알람
1. RDS 메모리 < 200MB (업그레이드 필요)
2. RDS 커넥션 > 45개 (풀 부족)
3. ECS CPU > 80% (Scale Out)
4. ALB 5xx 에러 > 10건/5분
5. NAT Instance 다운 (자동 복구)
```

---

## 🎯 로드맵

### Phase 5 (진행중) - 현재: $73/월, 목표: $56/월
- [x] ECS Spot 90% 증가 (Terraform 완료)
- [x] ECS Task 수 감소 (3 → 2, Terraform 완료)
- [x] CloudFront CDN 도입 (Terraform 완료, 12개월 무료)
- [ ] S3 Pre-signed URL 구현 (코드 작성 필요)
- [ ] HTTP Keep-Alive 활성화 (코드 작성 필요)
- [ ] Prisma Pool 최적화 (코드 작성 필요)

> 📖 **상세 가이드**: [COST_OPTIMIZATION_PHASE5.md](./docs/COST_OPTIMIZATION_PHASE5.md)

### Phase 6 (3-6개월) - 목표: $48/월
- [ ] RDS Reserved Instance (1년, -$8/월)
- [ ] ECS Min Capacity 조정
- [ ] CloudWatch Logs 보존 기간 최적화

### Phase 7 (6-12개월) - 목표: $50/월
- [ ] RDS 3-year RI 평가
- [ ] Aurora Serverless v2 검토

---

## 🔧 트러블슈팅

### RDS 커넥션 풀 부족
```typescript
// Prisma에서 커넥션 풀 재설정
connectionLimit = 50  // 기존 100에서 50으로
poolTimeout = 30      // 빠른 타임아웃
```

### ECS Spot 중단
```bash
# Auto Scaling이 자동 복구
# 모니터링: CloudWatch Logs
aws logs tail /ecs/glimpse-prod --follow
```

### NAT Instance 장애
```bash
# Auto Scaling Group이 자동 교체
# 수동 복구:
aws ec2 reboot-instances --instance-ids <instance-id>
```

---

**최종 업데이트**: 2025-10-23
**문서 버전**: v2.1 (CloudFront CDN 추가)
**다음 리뷰**: 2025-11-01
