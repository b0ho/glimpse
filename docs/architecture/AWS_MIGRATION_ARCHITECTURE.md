# Glimpse AWS 전체 아키텍처 설계

> **목표**: Clerk, Vercel, Railway를 AWS 서비스로 완전 전환
> **비용 목표**: 스타트업 초기 **월 $50-60** (Phase 0), 성장기 $120-150
> **확장성**: 10k+ 사용자까지 자동 확장 가능

---

## 💰 비용 최적화 가이드 (Phase별)

### Phase 0: 최소 구성 (0-500 MAU) - **$54/월**

| 서비스 | 구성 | 월 비용 |
|--------|------|--------|
| NAT Instance | t4g.nano | $5 |
| ALB | 1개 | $16 |
| ECS Fargate | 1 task (0.25 vCPU) | $15 |
| RDS PostgreSQL | db.t4g.micro | $13 |
| S3 | 10GB | $1 |
| Secrets Manager | 2 secrets | $1 |
| CloudWatch | 기본 로그 | $2 |
| ECR | 이미지 저장 | $1 |
| **합계** | | **$54** |

**제외된 서비스 (비용 절감):**
- ❌ ElastiCache Redis → 인메모리 사용 ($12 절감)
- ❌ API Gateway → ALB 직접 사용 ($3 절감)
- ❌ NAT Gateway → NAT Instance 사용 ($27 절감)
- ❌ CloudFront → S3 직접 접근 ($5 절감)
- ❌ Container Insights → 비활성화
- ❌ Performance Insights → 비활성화

### Phase 1: 기본 구성 (500-2k MAU) - **$90/월**

| 서비스 | 변경사항 | 월 비용 |
|--------|----------|--------|
| NAT Instance | 유지 | $5 |
| ALB | 유지 | $16 |
| ECS Fargate | **2 tasks** | $30 |
| RDS PostgreSQL | 유지 | $13 |
| ElastiCache Redis | **추가** (cache.t4g.micro) | $12 |
| S3 + CloudFront | **추가** | $6 |
| 기타 | | $8 |
| **합계** | | **$90** |

### Phase 2: 확장 구성 (2k-10k MAU) - **$150/월**

| 서비스 | 변경사항 | 월 비용 |
|--------|----------|--------|
| NAT Gateway | **업그레이드** | $32 |
| ALB | 유지 | $16 |
| ECS Fargate | **4 tasks** | $60 |
| RDS Aurora | **업그레이드** | $26 |
| ElastiCache | 유지 | $12 |
| 기타 | | $10 |
| **합계** | | **$150** |

---

## 📋 마이그레이션 요약

| 현재 서비스 | AWS 대체 서비스 | 비용 절감 |
|------------|----------------|----------|
| **Clerk** (인증) | AWS Cognito | $25 → $0 (5만 MAU 무료) |
| **Vercel** (Admin) | S3 + CloudFront + Lambda@Edge | $20 → $5 |
| **Vercel** (Web) | S3 + CloudFront (정적 호스팅) | $20 → $3 |
| **Railway** (Backend) | ECS Fargate | $25 → $30 (더 많은 리소스) |
| **Solapi** (SMS) | Amazon SNS + Pinpoint | $15 → $10 |

**총 예상 비용**: ~$140-180/월 (스타트업 단계)

---

## 🏗️ 전체 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    AWS Cloud (ap-northeast-2)                                │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐                       │
│  │   CloudFront    │     │   CloudFront    │     │   CloudFront    │                       │
│  │   (Web CDN)     │     │  (Admin CDN)    │     │  (Files CDN)    │                       │
│  │                 │     │                 │     │                 │                       │
│  │ glimpse.io      │     │ admin.glimpse.io│     │ cdn.glimpse.io  │                       │
│  └────────┬────────┘     └────────┬────────┘     └────────┬────────┘                       │
│           │                       │                       │                                │
│           ▼                       ▼                       ▼                                │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐                       │
│  │   S3 Bucket     │     │   S3 Bucket     │     │   S3 Bucket     │                       │
│  │  (Web Static)   │     │ (Admin Static)  │     │  (User Files)   │                       │
│  └─────────────────┘     └────────┬────────┘     └─────────────────┘                       │
│                                   │                                                        │
│                          ┌────────┴────────┐                                               │
│                          │  Lambda@Edge    │                                               │
│                          │ (SSR + Rewrite) │                                               │
│                          └─────────────────┘                                               │
│                                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              API Gateway (HTTP + WebSocket)                           │  │
│  │                                                                                       │  │
│  │   api.glimpse.io          ───────────────┬───────────────          ws.glimpse.io     │  │
│  └───────────────────────────────────────────┼───────────────────────────────────────────┘  │
│                                              │                                              │
│  ┌───────────────────────────────────────────┼───────────────────────────────────────────┐  │
│  │                                           │                                           │  │
│  │              ┌────────────────────────────┼────────────────────────────┐              │  │
│  │              │         Application Load Balancer (ALB)                 │              │  │
│  │              └────────────────────────────┼────────────────────────────┘              │  │
│  │                                           │                                           │  │
│  │  ┌────────────────────────────────────────┼────────────────────────────────────────┐  │  │
│  │  │                              ECS Fargate Cluster                                │  │  │
│  │  │                                        │                                        │  │  │
│  │  │    ┌─────────────┐    ┌─────────────┐  │  ┌─────────────┐    ┌─────────────┐   │  │  │
│  │  │    │  API Task   │    │  API Task   │  │  │  API Task   │    │  API Task   │   │  │  │
│  │  │    │  (Spring)   │    │  (Spring)   │  │  │  (Spring)   │    │  (Spring)   │   │  │  │
│  │  │    │  256 CPU    │    │  256 CPU    │  │  │  256 CPU    │    │  256 CPU    │   │  │  │
│  │  │    │  512 MB     │    │  512 MB     │  │  │  512 MB     │    │  512 MB     │   │  │  │
│  │  │    └──────┬──────┘    └──────┬──────┘  │  └──────┬──────┘    └──────┬──────┘   │  │  │
│  │  │           │                  │         │         │                  │          │  │  │
│  │  │           └──────────────────┴─────────┴─────────┴──────────────────┘          │  │  │
│  │  │                                        │                                       │  │  │
│  │  │                              Auto Scaling (1-20 tasks)                         │  │  │
│  │  └────────────────────────────────────────┼───────────────────────────────────────┘  │  │
│  │                                           │                                          │  │
│  │                          Private Subnets  │  (10.0.1.0/24, 10.0.2.0/24)              │  │
│  │                                           │                                          │  │
│  └───────────────────────────────────────────┼──────────────────────────────────────────┘  │
│                                              │                                             │
│  ┌───────────────────────────────────────────┼──────────────────────────────────────────┐  │
│  │                          Database Subnets │                                          │  │
│  │                                           │                                          │  │
│  │  ┌─────────────────────┐      ┌───────────┴───────────┐      ┌─────────────────────┐ │  │
│  │  │                     │      │                       │      │                     │ │  │
│  │  │  RDS Aurora         │◄─────┤                       ├─────►│  ElastiCache Redis  │ │  │
│  │  │  PostgreSQL         │      │                       │      │                     │ │  │
│  │  │                     │      │                       │      │  - SMS 인증 코드    │ │  │
│  │  │  db.t4g.micro       │      │                       │      │  - Rate Limiting    │ │  │
│  │  │  $13/month          │      │                       │      │  - 세션 캐시        │ │  │
│  │  │                     │      │                       │      │                     │ │  │
│  │  │                     │      │                       │      │  cache.t4g.micro    │ │  │
│  │  │                     │      │                       │      │  $12/month          │ │  │
│  │  └─────────────────────┘      └───────────────────────┘      └─────────────────────┘ │  │
│  │                                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                 Security & Identity                                   │  │
│  │                                                                                       │  │
│  │  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐                 │  │
│  │  │  AWS Cognito    │     │  Secrets Manager│     │   WAF           │                 │  │
│  │  │                 │     │                 │     │                 │                 │  │
│  │  │ - 사용자 인증   │     │ - DB 비밀번호   │     │ - DDoS 방어     │                 │  │
│  │  │ - JWT 발급      │     │ - JWT Secret    │     │ - Rate Limiting │                 │  │
│  │  │ - SMS 인증      │     │ - API Keys      │     │ - SQL Injection │                 │  │
│  │  │ - OAuth 연동    │     │                 │     │                 │                 │  │
│  │  │                 │     │                 │     │                 │                 │  │
│  │  │ 5만 MAU 무료    │     │ $0.40/secret    │     │ $5/ACL          │                 │  │
│  │  └─────────────────┘     └─────────────────┘     └─────────────────┘                 │  │
│  │                                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                               Messaging & Notifications                               │  │
│  │                                                                                       │  │
│  │  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐                 │  │
│  │  │  Amazon SNS     │     │  Amazon SES     │     │  Amazon Pinpoint│                 │  │
│  │  │                 │     │                 │     │                 │                 │  │
│  │  │ - SMS 인증      │     │ - 이메일 발송   │     │ - 푸시 알림     │                 │  │
│  │  │ - 알림 발송     │     │ - 마케팅 메일   │     │ - 사용자 분석   │                 │  │
│  │  │                 │     │                 │     │                 │                 │  │
│  │  │ $0.06/SMS(KR)   │     │ $0.10/1000      │     │ $0/10만 endpoint│                 │  │
│  │  └─────────────────┘     └─────────────────┘     └─────────────────┘                 │  │
│  │                                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                               Monitoring & DevOps                                     │  │
│  │                                                                                       │  │
│  │  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐                 │  │
│  │  │  CloudWatch     │     │  CodePipeline   │     │  ECR            │                 │  │
│  │  │                 │     │                 │     │                 │                 │  │
│  │  │ - 로그 수집     │     │ - CI/CD         │     │ - Docker 이미지 │                 │  │
│  │  │ - 메트릭 모니터 │     │ - 자동 배포     │     │ - 버전 관리     │                 │  │
│  │  │ - 알림 발송     │     │                 │     │                 │                 │  │
│  │  │                 │     │                 │     │                 │                 │  │
│  │  └─────────────────┘     └─────────────────┘     └─────────────────┘                 │  │
│  │                                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 1. 인증 시스템 (Clerk → Cognito)

### 1.1 AWS Cognito 구성

```hcl
# Cognito User Pool
- 전화번호 기반 가입/로그인
- SMS MFA 지원
- OAuth 연동 (Google, Kakao, Naver)
- 커스텀 Lambda 트리거

# 비용
- 50,000 MAU 무료
- 이후 $0.0055/MAU
```

### 1.2 인증 플로우

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Mobile    │───►│  Cognito    │───►│  Lambda     │───►│   Backend   │
│   App       │    │  User Pool  │    │  Trigger    │    │   (ECS)     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │
       │  1. 전화번호     │                  │                  │
       │     입력         │                  │                  │
       │─────────────────►│                  │                  │
       │                  │  2. SMS 발송     │                  │
       │                  │  (SNS)           │                  │
       │  3. 인증코드     │                  │                  │
       │     입력         │                  │                  │
       │─────────────────►│                  │                  │
       │                  │  4. 검증         │                  │
       │                  │─────────────────►│                  │
       │                  │                  │  5. 사용자 생성/ │
       │                  │                  │     업데이트     │
       │                  │                  │─────────────────►│
       │  6. JWT 토큰     │                  │                  │
       │◄─────────────────│                  │                  │
       │                  │                  │                  │
       │  7. API 호출 (Bearer Token)         │                  │
       │─────────────────────────────────────────────────────────────►│
       │                  │                  │                  │
```

### 1.3 Clerk vs Cognito 비교

| 기능 | Clerk | AWS Cognito |
|------|-------|-------------|
| **가격** | $25/5000 MAU | **무료** (50k MAU) |
| **SMS 인증** | 내장 | SNS 연동 필요 |
| **OAuth** | 쉬움 | 설정 필요 |
| **커스터마이징** | 제한적 | Lambda로 무제한 |
| **한국 SMS** | 솔라피 연동 | SNS 직접 지원 |
| **관리** | 외부 대시보드 | AWS 콘솔 통합 |

---

## 🌐 2. 프론트엔드 배포 (Vercel → AWS)

### 2.1 Web 랜딩 페이지 (정적 사이트)

```
┌─────────────────────────────────────────────────────┐
│                    CloudFront                        │
│              (glimpse.io / www.glimpse.io)          │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                     S3 Bucket                        │
│              (glimpse-web-prod)                      │
│                                                      │
│  ├── index.html                                      │
│  ├── assets/                                         │
│  │   ├── js/                                         │
│  │   ├── css/                                        │
│  │   └── images/                                     │
│  └── ...                                             │
└─────────────────────────────────────────────────────┘

# 빌드 & 배포
npm run build → S3 sync → CloudFront invalidation
```

**비용**: ~$3/월 (S3 + CloudFront)

### 2.2 Admin 대시보드 (Next.js SSR)

```
┌─────────────────────────────────────────────────────┐
│                    CloudFront                        │
│              (admin.glimpse.io)                      │
└────────────────────────┬────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ S3 (Static)  │ │ Lambda@Edge  │ │ API Gateway  │
│              │ │ (SSR)        │ │ (API Routes) │
└──────────────┘ └──────────────┘ └──────────────┘
```

**두 가지 옵션:**

**옵션 A: OpenNext (추천)**
```bash
# OpenNext: Next.js → AWS 변환 도구
npm install open-next
npx open-next build

# 배포 구성:
- Static: S3 + CloudFront
- SSR: Lambda@Edge
- API Routes: Lambda
- ISR: Lambda + S3
```

**옵션 B: ECS Fargate (전체 SSR)**
```
- Next.js 컨테이너 실행
- 더 많은 리소스 필요
- 비용: ~$15/월
```

**비용**: 옵션 A ~$5/월, 옵션 B ~$15/월

---

## 🖥️ 3. 백엔드 (Railway → ECS Fargate)

### 3.1 현재 구성

```hcl
# ECS Fargate (이미 Terraform에 정의됨)
module "ecs" {
  task_cpu    = "256"   # 0.25 vCPU
  task_memory = "512"   # 0.5 GB
  
  desired_count = 2     # 기본 2개 태스크
  min_capacity  = 1     # 최소 1개
  max_capacity  = 20    # 최대 20개
}
```

### 3.2 Spring Boot 배포 파이프라인

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   GitHub    │───►│ CodeBuild   │───►│    ECR      │───►│    ECS      │
│   Push      │    │ (빌드)      │    │ (이미지)    │    │ (배포)      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │
       │  main 브랜치     │                  │                  │
       │  푸시            │                  │                  │
       │─────────────────►│                  │                  │
       │                  │  Gradle Build    │                  │
       │                  │  Docker Build    │                  │
       │                  │─────────────────►│                  │
       │                  │                  │  이미지 Push     │
       │                  │                  │─────────────────►│
       │                  │                  │                  │  롤링 업데이트
       │                  │                  │                  │
```

### 3.3 Dockerfile (Spring Boot)

```dockerfile
# backend/Dockerfile
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY build/libs/*.jar app.jar

# 헬스체크
HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget -q -O /dev/null http://localhost:3001/health || exit 1

EXPOSE 3001

ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "app.jar"]
```

---

## 📱 4. SMS 인증 강화 (프로덕션)

### 4.1 아키텍처

```
┌─────────────────────────────────────────────────────────────────────┐
│                          SMS 인증 시스템                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │   Mobile    │───►│   API GW    │───►│   ECS       │             │
│  │   App       │    │   + WAF     │    │   (Spring)  │             │
│  └─────────────┘    └─────────────┘    └──────┬──────┘             │
│                                               │                     │
│                     ┌─────────────────────────┼─────────────────┐   │
│                     │                         │                 │   │
│                     ▼                         ▼                 │   │
│           ┌─────────────────┐       ┌─────────────────┐         │   │
│           │  ElastiCache    │       │   Amazon SNS    │         │   │
│           │  (Redis)        │       │   (SMS 발송)    │         │   │
│           │                 │       │                 │         │   │
│           │ ┌─────────────┐ │       │  $0.06/SMS(KR)  │         │   │
│           │ │ 인증 코드   │ │       │                 │         │   │
│           │ │ Key: verify:│ │       └─────────────────┘         │   │
│           │ │ 01012345678 │ │                                   │   │
│           │ │ Value: 12345│ │                                   │   │
│           │ │ TTL: 300s   │ │                                   │   │
│           │ └─────────────┘ │                                   │   │
│           │                 │                                   │   │
│           │ ┌─────────────┐ │                                   │   │
│           │ │ Rate Limit  │ │                                   │   │
│           │ │ Key: rate:  │ │                                   │   │
│           │ │ 01012345678 │ │                                   │   │
│           │ │ Value: 3    │ │                                   │   │
│           │ │ TTL: 3600s  │ │                                   │   │
│           │ └─────────────┘ │                                   │   │
│           │                 │                                   │   │
│           │ ┌─────────────┐ │                                   │   │
│           │ │ IP Limit    │ │                                   │   │
│           │ │ Key: ip:    │ │                                   │   │
│           │ │ 123.456.789 │ │                                   │   │
│           │ │ Value: 10   │ │                                   │   │
│           │ │ TTL: 3600s  │ │                                   │   │
│           │ └─────────────┘ │                                   │   │
│           │                 │                                   │   │
│           └─────────────────┘                                   │   │
│                                                                 │   │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Rate Limiting 전략

```java
// Redis 기반 Rate Limiting
public class SmsRateLimiter {
    
    private static final int MAX_PER_PHONE_HOURLY = 5;    // 전화번호당 시간당 5회
    private static final int MAX_PER_PHONE_DAILY = 10;    // 전화번호당 일일 10회
    private static final int MAX_PER_IP_HOURLY = 20;      // IP당 시간당 20회
    private static final int RESEND_COOLDOWN_SECONDS = 60; // 재전송 대기 60초
    
    // Redis Keys:
    // sms:rate:phone:{phoneNumber}:hourly  (TTL: 3600s)
    // sms:rate:phone:{phoneNumber}:daily   (TTL: 86400s)
    // sms:rate:ip:{ipAddress}              (TTL: 3600s)
    // sms:cooldown:{phoneNumber}           (TTL: 60s)
    // sms:verify:{phoneNumber}             (TTL: 300s)
    // sms:attempts:{phoneNumber}           (TTL: 300s)
}
```

### 4.3 보안 강화

```java
// WAF 규칙 + 애플리케이션 레벨 보안
public class SmsSecurityService {
    
    // 1. 전화번호 검증
    public boolean isValidKoreanPhone(String phone) {
        return phone.matches("^01[016789]-?[0-9]{3,4}-?[0-9]{4}$");
    }
    
    // 2. 차단 번호 확인 (스팸, 가상번호 등)
    public boolean isBlacklisted(String phone) {
        return redisTemplate.opsForSet().isMember("sms:blacklist", phone);
    }
    
    // 3. VPN/프록시 감지
    public boolean isSuspiciousIp(String ip) {
        // AWS WAF에서 1차 필터링
        // 애플리케이션에서 추가 검증
    }
    
    // 4. 인증 실패 횟수 제한
    public boolean hasExceededAttempts(String phone) {
        Integer attempts = (Integer) redisTemplate.opsForValue()
            .get("sms:attempts:" + phone);
        return attempts != null && attempts >= 5;
    }
}
```

---

## 💾 5. 데이터베이스 & 캐싱

### 5.1 RDS Aurora PostgreSQL

```hcl
# 이미 Terraform에 정의됨
module "rds" {
  engine_version = "15.4"
  instance_class = "db.t4g.micro"  # $13/월
  instance_count = 1
  
  # 스케일업 계획:
  # Phase 2: db.t4g.small ($26/월) - 1k+ 사용자
  # Phase 3: db.r6g.large + Read Replica - 10k+ 사용자
}
```

### 5.2 ElastiCache Redis

```hcl
# 이미 Terraform에 정의됨
module "elasticache" {
  node_type       = "cache.t4g.micro"  # $12/월
  num_cache_nodes = 1
  
  # 용도:
  # - SMS 인증 코드 저장
  # - Rate Limiting
  # - 세션 캐싱
  # - API 응답 캐싱
}
```

---

## 🔄 6. CI/CD 파이프라인

### 6.1 CodePipeline 구성

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CI/CD Pipeline                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐        │
│  │  Source  │──►│  Build   │──►│  Test    │──►│  Deploy  │        │
│  │ (GitHub) │   │(CodeBuild)   │(CodeBuild)   │  (ECS)   │        │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘        │
│                                                                     │
│  Branches:                                                          │
│  - main → production                                                │
│  - develop → staging (optional)                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 buildspec.yml

```yaml
# backend/buildspec.yml
version: 0.2

phases:
  install:
    runtime-versions:
      java: corretto21
      
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
      
  build:
    commands:
      - echo Build started on `date`
      - ./gradlew bootJar
      - docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .
      - docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG
      
  post_build:
    commands:
      - echo Build completed on `date`
      - docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG
      - printf '[{"name":"api","imageUri":"%s"}]' $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG > imagedefinitions.json

artifacts:
  files:
    - imagedefinitions.json
```

---

## 💰 7. 비용 예측

### 7.1 스타트업 단계 (0-1k MAU)

| 서비스 | 구성 | 월 비용 |
|--------|------|--------|
| **ECS Fargate** | 2 tasks × 0.25 vCPU × 512MB | $30 |
| **RDS Aurora** | db.t4g.micro | $13 |
| **ElastiCache** | cache.t4g.micro | $12 |
| **NAT Gateway** | 1개 | $32 |
| **ALB** | 1개 | $16 |
| **API Gateway** | 1M requests | $3 |
| **CloudFront** | Web + Admin + Files | $5 |
| **S3** | 50GB storage | $1 |
| **Cognito** | < 50k MAU | $0 |
| **SNS SMS** | 1000건 | $6 |
| **Route 53** | 3 hosted zones | $1.5 |
| **Secrets Manager** | 5 secrets | $2 |
| **CloudWatch** | Basic | $3 |
| **ECR** | 10GB images | $1 |
| **WAF** | 1 WebACL | $5 |
| **합계** | | **~$130** |

### 7.2 성장 단계 (1k-10k MAU)

| 서비스 | 구성 | 월 비용 |
|--------|------|--------|
| **ECS Fargate** | 4 tasks × 0.5 vCPU × 1GB | $80 |
| **RDS Aurora** | db.t4g.small + Read Replica | $52 |
| **ElastiCache** | cache.t4g.small (HA) | $48 |
| **NAT Gateway** | 2개 (Multi-AZ) | $64 |
| **기타** | 동일 | $40 |
| **합계** | | **~$300** |

---

## 📋 8. 마이그레이션 체크리스트

### Phase 1: 인프라 준비 (1주)

- [ ] Terraform 모듈 완성 (Cognito, RDS, ElastiCache, Monitoring)
- [ ] VPC 및 네트워킹 배포
- [ ] RDS Aurora 생성 및 데이터 마이그레이션
- [ ] ElastiCache Redis 생성
- [ ] S3 버킷 생성
- [ ] ECR 리포지토리 생성

### Phase 2: 백엔드 배포 (1주)

- [ ] Spring Boot Dockerfile 최적화
- [ ] ECS 태스크 정의 및 서비스 배포
- [ ] ALB 설정 및 헬스체크
- [ ] Cognito 연동 코드 작성
- [ ] SMS 인증 Redis 기반으로 전환
- [ ] CodePipeline CI/CD 설정

### Phase 3: 프론트엔드 배포 (1주)

- [ ] Web 랜딩 페이지 S3 + CloudFront 배포
- [ ] Admin 대시보드 OpenNext 변환 및 배포
- [ ] Cognito 프론트엔드 연동
- [ ] 도메인 연결 (Route 53)

### Phase 4: 전환 완료 (1주)

- [ ] Railway 트래픽 → AWS 전환
- [ ] Vercel 트래픽 → AWS 전환
- [ ] Clerk 사용자 → Cognito 마이그레이션
- [ ] 모니터링 및 알림 설정
- [ ] 기존 서비스 종료

---

## 🔧 9. 환경 변수 설정

### 9.1 Secrets Manager

```json
// glimpse-prod-secrets
{
  "DATABASE_URL": "postgresql://glimpse_admin:xxx@rds-endpoint:5432/glimpse_prod",
  "REDIS_URL": "redis://xxx@elasticache-endpoint:6379",
  "JWT_SECRET": "xxx",
  "AWS_SNS_REGION": "ap-northeast-2",
  "COGNITO_USER_POOL_ID": "ap-northeast-2_xxx",
  "COGNITO_CLIENT_ID": "xxx"
}
```

### 9.2 ECS 환경 변수

```hcl
environment_variables = {
  NODE_ENV = "production"
  PORT     = "3001"
  
  # AWS 서비스 설정
  AWS_REGION = "ap-northeast-2"
  
  # 기능 플래그
  ENABLE_SMS_VERIFICATION = "true"
  SMS_DEV_MODE            = "false"
}

secret_variables = {
  DATABASE_URL  = "arn:aws:secretsmanager:..."
  REDIS_URL     = "arn:aws:secretsmanager:..."
  JWT_SECRET    = "arn:aws:secretsmanager:..."
}
```

---

## 📞 10. 지원 및 문의

- **AWS Support**: Business Support 권장 ($100/월)
- **Terraform Registry**: https://registry.terraform.io/providers/hashicorp/aws
- **AWS 한국어 문서**: https://docs.aws.amazon.com/ko_kr/

---

*문서 최종 업데이트: 2026-01-03*
*작성자: Glimpse DevOps Team*

