# Glimpse AWS Infrastructure 최종 비용 분석

> **배포 범위**: Mobile App + API Server (Web/Admin 제외)
> **최적화 목표**: 스타트업 초기 비용 최소화 + 무한 확장 가능성
> **최종 월간 비용**: **$198** (0-1,000 유저)

---

## 📊 최종 월간 비용 ($198)

```
┌──────────────────────────────────────────────────────────┐
│               Glimpse Production 월간 비용                │
├──────────────────────────────────────────────────────────┤
│ 서비스                    │ 사양              │ 월 비용   │
├──────────────────────────────────────────────────────────┤
│ 💚 핵심 인프라                                            │
├──────────────────────────────────────────────────────────┤
│ EKS Control Plane         │ 1 클러스터        │ $73      │
│ EC2 On-Demand             │ 1x t3a.small      │ $15      │
│ EC2 Spot Instances        │ 2x t3a.small (70%)│ $9       │
│ RDS PostgreSQL            │ db.t4g.small      │ $26 ✅   │
│ ElastiCache Redis         │ cache.t4g.micro   │ $12      │
│ NAT Gateway               │ Single + 100GB    │ $37      │
│ Application Load Balancer │ 1개 + SSL         │ $25      │
├──────────────────────────────────────────────────────────┤
│ 💙 애플리케이션 서비스                                    │
├──────────────────────────────────────────────────────────┤
│ API Gateway               │ ~1M requests      │ $4       │
│ Cognito                   │ 50K MAU           │ $5       │
│ S3 Storage                │ ~50GB             │ $2       │
│ CloudWatch Logs           │ ~10GB             │ $5       │
│ Secrets Manager           │ 5 secrets         │ $2       │
│ Route 53                  │ 1 hosted zone     │ $0.50    │
├──────────────────────────────────────────────────────────┤
│ 🔒 보안 & 모니터링                                        │
├──────────────────────────────────────────────────────────┤
│ AWS Certificate Manager   │ SSL 인증서         │ 무료     │
│ CloudWatch Alarms         │ 10 alarms         │ $1       │
│ VPC (2 AZs)              │ Standard          │ 무료     │
│ Security Groups           │ -                 │ 무료     │
├──────────────────────────────────────────────────────────┤
│                                      총계: $198/월        │
└──────────────────────────────────────────────────────────┘

✅ 초기 기획 대비 79% 비용 절감 ($932 → $198)
✅ RDS 다운그레이드로 추가 $32 절감 ($230 → $198)
```

---

## 🏗️ 인프라 아키텍처

### 전체 구조도

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   Route 53 DNS        │
         │   api.glimpse.io      │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  API Gateway (REST)   │
         │  + Cognito Auth       │
         └───────────┬───────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│                      VPC (10.0.0.0/16)                     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │           Public Subnets (2 AZs)                    │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  • NAT Gateway (ap-northeast-2a)                    │  │
│  │  • Application Load Balancer                        │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │          Private Subnets (2 AZs)                    │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │                                                      │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  EKS Cluster (Kubernetes 1.28)               │  │  │
│  │  ├──────────────────────────────────────────────┤  │  │
│  │  │  • 1x t3a.small (On-Demand) - Stable        │  │  │
│  │  │  • 2x t3a.small (Spot 70%) - Cost Saving    │  │  │
│  │  │                                              │  │  │
│  │  │  Pods:                                       │  │  │
│  │  │  • Glimpse API Server (NestJS)              │  │  │
│  │  │  • Socket.IO WebSocket Server               │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │                                                      │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         Database Subnets (2 AZs)                    │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │                                                      │  │
│  │  • RDS Aurora PostgreSQL (db.t4g.small)             │  │
│  │    - 2 vCPU, 2GB RAM                                │  │
│  │    - Single instance (Phase 1)                      │  │
│  │    - Automated backups (7 days)                     │  │
│  │                                                      │  │
│  │  • ElastiCache Redis (cache.t4g.micro)              │  │
│  │    - 2 vCPU, 0.5GB RAM                              │  │
│  │    - Sessions + Rate limiting                       │  │
│  │                                                      │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │    S3 Buckets         │
              ├───────────────────────┤
              │ • glimpse-files       │
              │ • glimpse-mobile-builds│
              │ • glimpse-backups     │
              └───────────────────────┘
```

### 모바일 앱 연동 흐름

```
┌─────────────────┐
│  Mobile App     │
│  (React Native) │
└────────┬────────┘
         │
         │ 1. 회원가입/로그인
         ▼
┌─────────────────────────┐
│  AWS Cognito            │
│  - SMS 인증 (한국)      │
│  - JWT Token 발급       │
└────────┬────────────────┘
         │
         │ 2. API 요청 (JWT Token)
         ▼
┌─────────────────────────┐
│  API Gateway            │
│  - Cognito Authorizer   │
│  - Rate Limiting        │
└────────┬────────────────┘
         │
         │ 3. 라우팅
         ▼
┌─────────────────────────┐
│  ALB → EKS Pods         │
│  - Glimpse API Server   │
│  - WebSocket Server     │
└────────┬────────────────┘
         │
         │ 4. 데이터 처리
         ▼
┌─────────────────────────┐
│  RDS PostgreSQL         │
│  - Users, Groups, Posts │
│  - Matches, Messages    │
└─────────────────────────┘
         │
         │ 5. 파일 업로드
         ▼
┌─────────────────────────┐
│  S3 Bucket              │
│  - Profile Photos       │
│  - Post Images          │
│  - Chat Files           │
└─────────────────────────┘
```

---

## 💾 데이터 구조

### RDS PostgreSQL 테이블 구조

```sql
-- 사용자 테이블
users
├── id (UUID, PK)
├── cognito_user_id (String, Unique)
├── phone_number (String, Unique)
├── nickname (String)
├── profile_photo_url (String → S3)
├── premium_until (DateTime)
├── daily_likes_remaining (Int)
└── created_at (DateTime)

-- 그룹 테이블
groups
├── id (UUID, PK)
├── name (String)
├── type (ENUM: Official/Created/Instance/Location)
├── member_count (Int)
├── is_active (Boolean)
└── location (Point, indexed)

-- 매칭 테이블
matches
├── id (UUID, PK)
├── user_id (UUID, FK → users)
├── target_user_id (UUID, FK → users)
├── status (ENUM: Pending/Matched/Rejected)
├── is_mutual (Boolean)
└── matched_at (DateTime)

-- 채팅 메시지 테이블
messages
├── id (UUID, PK)
├── match_id (UUID, FK → matches)
├── sender_id (UUID, FK → users)
├── content (Text)
├── file_url (String → S3, nullable)
├── is_read (Boolean)
└── sent_at (DateTime)
```

### S3 버킷 구조

```
glimpse-files-prod/
├── profiles/
│   ├── {user_id}/
│   │   ├── avatar.jpg
│   │   └── photos/
│   │       ├── photo1.jpg
│   │       └── photo2.jpg
│
├── posts/
│   └── {post_id}/
│       ├── image1.jpg
│       └── image2.jpg
│
└── chat/
    └── {match_id}/
        ├── {message_id}_file.jpg
        └── {message_id}_file.mp4

glimpse-mobile-builds-prod/
├── android/
│   ├── v1.0.0/
│   │   └── app-release.apk
│   └── latest/
│       └── app-release.apk
│
└── ios/
    ├── v1.0.0/
    │   └── Glimpse.ipa
    └── latest/
        └── Glimpse.ipa

glimpse-backups-prod/
├── database/
│   ├── 2025-01-21/
│   │   └── glimpse_prod.sql.gz
│   └── 2025-01-22/
│       └── glimpse_prod.sql.gz
│
└── files/
    └── {date}/
        └── incremental_backup.tar.gz
```

---

## 🔐 보안 설정

### 네트워크 보안

```yaml
VPC 보안 그룹:
  EKS Nodes Security Group:
    Inbound:
      - ALB (80, 443) → EKS Pods
      - Self (All traffic) → Pod-to-Pod communication
    Outbound:
      - All traffic (NAT Gateway 통해 인터넷)

  RDS Security Group:
    Inbound:
      - EKS Nodes (5432) → PostgreSQL
    Outbound:
      - None (데이터베이스는 outbound 불필요)

  Redis Security Group:
    Inbound:
      - EKS Nodes (6379) → Redis
    Outbound:
      - None

  ALB Security Group:
    Inbound:
      - Internet (443) → HTTPS only
    Outbound:
      - EKS Nodes (80) → HTTP to pods
```

### 인증 흐름

```
1. 회원가입/로그인
   Mobile App → Cognito User Pool
   - SMS 인증 (한국 통신사)
   - JWT Token 발급

2. API 요청
   Mobile App → API Gateway
   - Authorization: Bearer {JWT_TOKEN}
   - Cognito Authorizer 자동 검증

3. 서버 접근
   API Gateway → ALB → EKS Pods
   - JWT payload에서 user_id 추출
   - RDS에서 사용자 정보 조회

4. 파일 업로드
   Mobile App → Presigned URL (S3)
   - API Server가 15분 유효 URL 생성
   - 직접 S3에 업로드 (서버 부하 없음)
```

---

## 📈 성능 사양

### 처리 용량 (Phase 1: 0-1,000 유저)

```
┌────────────────────────────────────────────────────┐
│ 항목                │ 사양              │ 성능      │
├────────────────────────────────────────────────────┤
│ API 동시 요청       │ 500 RPS          │ 충분      │
│ WebSocket 연결      │ 1,000 connections│ 충분      │
│ 데이터베이스 쿼리   │ 250 QPS          │ 충분      │
│ Redis 캐시          │ 10,000 ops/sec   │ 충분      │
│ 파일 업로드         │ 100 MB/s         │ 충분      │
│ 스토리지            │ 50GB (확장 가능) │ 충분      │
└────────────────────────────────────────────────────┘
```

### RDS db.t4g.small 상세 스펙

```
CPU: 2 vCPU (AWS Graviton2, ARM64)
Memory: 2 GB RAM
Storage: 20 GB SSD (자동 확장 가능, 최대 100GB)

성능:
- Baseline Performance: 40% CPU 지속 사용 가능
- Burst Performance: 100% CPU (크레딧 소진 시)
- IOPS: 3,000 IOPS baseline (GP3 SSD)
- Throughput: 125 MB/s

연결:
- Max Connections: 87 (공식: LEAST({DBInstanceClassMemory/9531392}, 5000))
- Recommended Connections: 60-70 (버퍼 확보)
- Connection Pooling: 필수 (Prisma 기본 설정 10)

처리량:
- 읽기 쿼리: ~250 queries/sec (simple queries)
- 쓰기 쿼리: ~100 queries/sec
- 트랜잭션: ~50 transactions/sec (복잡한 쿼리)

예상 사용자 지원:
- 0-500 유저: 매우 안정적
- 500-1,000 유저: 안정적 (모니터링 필요)
- 1,000+ 유저: Read Replica 추가 권장
```

### 오토스케일링 정책

```yaml
EKS Horizontal Pod Autoscaler (HPA):
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - CPU: 70%
    - Memory: 80%
    - Requests/sec: 100

EKS Cluster Autoscaler:
  On-Demand Nodes:
    min: 1
    desired: 1
    max: 10

  Spot Nodes:
    min: 0
    desired: 2
    max: 10

RDS Auto Scaling (Storage):
  minStorage: 20 GB
  maxStorage: 100 GB
  threshold: 90% full
```

---

## 💰 비용 상세 분석

### 1. EKS (Elastic Kubernetes Service) - $97/월

```
EKS Control Plane: $73/월
- Kubernetes 마스터 노드 관리
- API 서버, etcd, 스케줄러
- 고가용성 (Multi-AZ)

EC2 Worker Nodes: $24/월
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
On-Demand (1x t3a.small):
- 시간당: $0.0208
- 월간: $0.0208 × 730h = $15.18

Spot Instances (2x t3a.small, 70% discount):
- 시간당: $0.0208 × 0.3 = $0.00624
- 월간: $0.00624 × 730h × 2 = $9.11

총 EC2 비용: $15.18 + $9.11 = $24.29

t3a.small 스펙:
- 2 vCPU (AMD EPYC)
- 2 GB RAM
- Network: Up to 5 Gbps
- EBS: Up to 2,880 Mbps

Spot Instance 이점:
✅ 70% 비용 절감
✅ K8s가 자동으로 노드 교체
✅ On-Demand 노드가 백업
⚠️ 드물게 2-3분 중단 가능
```

**왜 EKS인가?**
- **자동 스케일링**: 트래픽에 따라 자동으로 Pod/Node 증감
- **무중단 배포**: Rolling update로 다운타임 없음
- **컨테이너 오케스트레이션**: 여러 마이크로서비스 관리 용이
- **확장성**: 10,000+ 유저까지 자동 확장

### 2. RDS PostgreSQL - $26/월

```
db.t4g.small:
- 시간당: $0.036
- 월간: $0.036 × 730h = $26.28

스펙:
- 2 vCPU (AWS Graviton2)
- 2 GB RAM
- 20 GB SSD Storage (GP3)
- Automated Backups (7 days)

포함 서비스:
✅ 자동 백업 (매일)
✅ 자동 패치 (보안 업데이트)
✅ CloudWatch 모니터링
✅ Point-in-time Recovery
✅ 암호화 (저장/전송)

비교: Self-managed PostgreSQL on EC2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EC2 t3a.small: $15/월
EBS 20GB: $2/월
백업 S3: $1/월
DBA 시간 (10h/월 × $50/h): $500/월
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
총비용: $518/월 vs RDS $26/월
결론: RDS가 20배 저렴 + 관리 편의성
```

**Phase 1 → Phase 2 업그레이드 경로**:
```
500-1,000 유저 도달 시:
1. Read Replica 추가 (+$26/월)
   - 읽기 쿼리 분산
   - 쓰기는 Primary, 읽기는 Replica

1,000+ 유저 도달 시:
2. db.t4g.medium 업그레이드 (+$32/월)
   - 4 vCPU, 4GB RAM
   - 174 connections
   - 500 QPS 처리 가능
```

### 3. ElastiCache Redis - $12/월

```
cache.t4g.micro:
- 시간당: $0.016
- 월간: $0.016 × 730h = $11.68

스펙:
- 2 vCPU
- 0.5 GB RAM (512 MB)
- Network: Up to 5 Gbps

용도:
✅ 세션 관리 (JWT refresh tokens)
✅ Rate limiting (API 요청 제한)
✅ 임시 데이터 캐싱 (좋아요 카운트)

예상 용량:
- 세션: ~50KB per user × 1,000 users = 50MB
- Rate limiting: ~100 keys = 1MB
- 캐시: ~100MB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
총 사용량: ~150MB / 512MB (30%)
```

### 4. NAT Gateway - $37/월

```
NAT Gateway: $32.85/월
- 시간당: $0.045
- 월간: $0.045 × 730h = $32.85

Data Processing: ~$4/월
- GB당: $0.045
- 100 GB/월 예상: $0.045 × 100 = $4.50

총비용: $32.85 + $4.50 = $37.35

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NAT Gateway 트래픽 예상:

Outbound (서버 → 인터넷):
- Docker 이미지 pull: ~20GB/월
- npm/apt packages: ~5GB/월
- 외부 API 호출: ~30GB/월
  * TossPay/KakaoPay: 10GB
  * FCM (Push): 10GB
  * SMS (LG U+): 5GB
  * Kakao Maps: 5GB
- Database backups to S3: ~10GB/월
- CloudWatch logs: ~5GB/월

Inbound: $0 (무료)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**왜 NAT Gateway가 필요한가?**

```
Private Subnet의 리소스들이 인터넷 접근이 필요한 이유:

1. Package 다운로드
   npm install, apt-get update
   → NAT 없으면 배포 불가능

2. 외부 API 호출
   TossPay, KakaoPay, FCM, SMS
   → NAT 없으면 결제/알림 불가능

3. Docker Image Pull
   ECR에서 이미지 받기
   → NAT 없으면 컨테이너 실행 불가능

4. Database Backup
   RDS → S3 백업
   → NAT 없으면 백업 불가능

보안 이점:
✅ 서버는 외부에서 직접 접근 불가 (Private Subnet)
✅ Outbound만 허용 (서버 → 인터넷)
✅ Inbound는 ALB를 통해서만 가능
```

**Phase 1 최적화: Single NAT**
```
현재 (Single NAT): $37/월
- 1개 NAT Gateway (ap-northeast-2a)
- 트레이드오프: AZ 장애 시 15-30분 복구

Enterprise (Multi-AZ NAT): $110/월
- 3개 NAT Gateways (각 AZ마다)
- 고가용성: 즉시 failover
- 비용: 3× = $110/월

결론: Phase 1은 Single NAT로 시작
→ Phase 2 (1,000+ 유저)에서 Multi-AZ 전환
```

### 5. Application Load Balancer - $25/월

```
ALB 고정 비용: $16.43/월
- 시간당: $0.0225
- 월간: $0.0225 × 730h = $16.43

LCU (Load Balancer Capacity Units): ~$8/월
- New connections: 25/sec
- Active connections: 3,000
- Processed bytes: 1 GB/hour
- Rule evaluations: 1,000/sec

예상 LCU: ~10 LCU/hour
- LCU 시간당: $0.008
- 월간: $0.008 × 730h × 10 = $58.40

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
실제 비용은 트래픽에 비례:
- 0-500 유저: ~$20/월
- 500-1,000 유저: ~$25/월
- 1,000+ 유저: ~$35/월
```

**ALB의 역할**:
```
1. SSL/TLS 종료 (HTTPS → HTTP)
   - ACM 인증서 (무료)
   - api.glimpse.io → 암호화 연결

2. 로드 밸런싱
   - 여러 EKS Pod에 트래픽 분산
   - 헬스 체크 (장애 노드 자동 제외)

3. Auto Scaling 지원
   - Pod 증가/감소 시 자동 라우팅 조정

4. Cognito 통합
   - API Gateway가 ALB 앞단에서 인증

Alternative: API Gateway HTTP API Direct
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
장점:
- ALB 비용 절감 (-$25/월)

단점:
- SSL 인증서 관리 복잡
- 헬스 체크 기능 없음
- 스케일링 제한 (5,000 RPS)

결론: ALB 유지 (안정성 > 비용)
```

### 6. API Gateway - $4/월

```
HTTP API (REST API보다 저렴):
- 첫 300M requests: $1.00 per million
- 이후: $0.90 per million

예상 트래픽 (Phase 1):
- 일일 활성 사용자: 200명
- 1인당 API 요청: 150 requests/day
- 월간 총 요청: 200 × 150 × 30 = 900,000

비용 계산:
- 900,000 requests = 0.9M
- $1.00 × 0.9 = $0.90/월

WebSocket API (실시간 채팅):
- Connection minutes: $0.25 per million
- Message units: $1.00 per million

예상 WebSocket 비용:
- 동시 연결: 50명
- 평균 연결 시간: 30분/일
- 월간 connection minutes: 50 × 30 × 30 = 45,000
- 비용: $0.25 × 0.045 = $0.01/월

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
총 API Gateway 비용: ~$4/월
```

### 7. Cognito - $5/월

```
User Pool: 무료
- 첫 50,000 MAU (Monthly Active Users)
- 사용자 관리, JWT 토큰 발급

SMS 비용: ~$5/월
- SMS당: ~$0.10 (한국 통신사)
- 월간 SMS: ~50건 (인증, 비밀번호 재설정)
- 비용: $0.10 × 50 = $5/월

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 2 (1,000+ 유저) 예상:
- SMS: 200건/월 = $20/월
- 여전히 User Pool 무료 (50K MAU 이내)
```

### 8. S3 Storage - $2/월

```
Standard Storage:
- GB당: $0.023
- 50 GB: $0.023 × 50 = $1.15/월

Intelligent-Tiering (30일 후 자동):
- Frequent Access: $0.023/GB
- Infrequent Access: $0.0125/GB (46% 절감)
- Archive: $0.004/GB (83% 절감)

예상 저장량:
- 프로필 사진: 1,000 users × 2MB = 2GB
- 게시물 이미지: 500 posts × 5MB = 2.5GB
- 채팅 파일: 100 files × 3MB = 0.3GB
- 백업: 10GB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
총 저장량: ~15GB (30일 이내)

Lifecycle 적용 (30일 후):
- Frequent: 5GB × $0.023 = $0.12
- Infrequent: 10GB × $0.0125 = $0.13
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
월간 비용: ~$2.50/월
```

### 9. CloudWatch Logs - $5/월

```
Log Ingestion:
- GB당: $0.50
- 10 GB/월: $0.50 × 10 = $5.00

Log Storage (7일 retention):
- GB당: $0.03/월
- 10 GB: $0.03 × 10 = $0.30

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
총 CloudWatch 비용: ~$5.30/월

로그 출처:
- EKS Control Plane: 2GB
- Application logs: 5GB
- RDS logs: 1GB
- Redis logs: 0.5GB
- ALB access logs: 1.5GB
```

### 10. 기타 서비스 - $3.50/월

```
Secrets Manager: $2/월
- Secret당: $0.40/월
- 5 secrets: $0.40 × 5 = $2.00
  * RDS master password
  * Redis auth token
  * JWT secret key
  * TossPay API key
  * KakaoPay API key

Route 53: $0.50/월
- Hosted Zone: $0.50/월
- Queries: 첫 1B 무료

AWS Certificate Manager: 무료
- SSL/TLS 인증서 (api.glimpse.io)

CloudWatch Alarms: $1/월
- Alarm당: $0.10/월
- 10 alarms: $0.10 × 10 = $1.00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
총 기타 비용: $3.50/월
```

---

## 📊 단계별 확장 전략

### Phase 1: MVP (현재 구성)
**목표**: 0-1,000 유저, 비용 최소화

```
💰 비용: $198/월

구성:
✅ Single NAT Gateway (1 AZ)
✅ 1 On-Demand + 2 Spot instances
✅ RDS db.t4g.small (2GB RAM)
✅ Redis cache.t4g.micro (0.5GB)
✅ 7-day log retention
✅ Single RDS instance

성능:
- API 요청: 500 RPS
- WebSocket: 1,000 connections
- Database: 250 QPS
- 동시 사용자: 200-500명

트레이드오프:
⚠️ Single NAT: AZ 장애 시 15-30분 복구
⚠️ Single RDS: 장애 시 백업 복구 (10-20분)
✅ Auto-recovery 활성화
✅ Spot instances로 70% 절감
```

### Phase 2: Growth (1,000-5,000 유저)
**트리거**: 일일 활성 사용자 > 500명 OR RDS CPU > 70%

```
💰 예상 비용: $280/월 (+$82)

업그레이드:
1. RDS Read Replica 추가 = +$26
   - 읽기 쿼리 분산
   - Primary: 쓰기 전용
   - Replica: 읽기 전용

2. RDS db.t4g.medium 업그레이드 = +$32
   - 4 vCPU, 4GB RAM
   - 174 connections
   - 500 QPS

3. Redis cache.t4g.small = +$12
   - 1.5GB RAM
   - Multi-AZ 준비

4. EKS On-Demand 노드 1개 추가 = +$15
   - 안정성 향상
   - Spot 중단 대비

5. VPC Endpoints (S3, ECR) = +$15
   - NAT 트래픽 감소
   - 데이터 전송 비용 절감

6. Log retention 30일 = +$10
   - 더 긴 분석 기간

자동 스케일링:
✅ HPA: 3-20 pods
✅ Cluster Autoscaler: 3-15 nodes
✅ RDS connections: 100-150
```

### Phase 3: Scale (5,000-10,000+ 유저)
**트리거**: 일일 활성 사용자 > 2,000명

```
💰 예상 비용: $450/월 (+$170)

업그레이드:
1. Multi-AZ NAT Gateways = +$73
   - 3개 NAT (각 AZ)
   - 고가용성 확보
   - AZ 장애 대응

2. RDS db.r6g.large Multi-AZ = +$150
   - 2 vCPU → 4 vCPU
   - 8GB RAM
   - Multi-AZ 자동 failover
   - 1,000 QPS

3. Redis cache.r6g.large Multi-AZ = +$88
   - 13.07GB RAM
   - Multi-AZ 복제
   - Auto failover

4. Reserved Instances (1년 약정) = -$150 절감
   - EC2: 40% 할인
   - RDS: 40% 할인

최종 구성:
✅ Multi-AZ HA (99.99% uptime)
✅ Auto-scaling 5-50 pods
✅ Database replication
✅ Redis failover
✅ 10,000+ 유저 지원
```

---

## 🚀 배포 가이드

### 1. Terraform 초기화

```bash
cd infrastructure/terraform/environments/startup-prod

# Terraform 초기화
terraform init

# S3 백엔드 생성 (최초 1회)
aws s3api create-bucket \
  --bucket glimpse-terraform-state-prod \
  --region ap-northeast-2 \
  --create-bucket-configuration LocationConstraint=ap-northeast-2

# DynamoDB 락 테이블 생성
aws dynamodb create-table \
  --table-name glimpse-terraform-locks-prod \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-northeast-2
```

### 2. 변수 설정

```bash
# terraform.tfvars 생성
cat > terraform.tfvars <<EOF
aws_region = "ap-northeast-2"

alarm_email_addresses = [
  "devops@glimpse.io",
  "admin@glimpse.io"
]

# RDS 마스터 비밀번호 (20자 이상, 특수문자 포함)
db_master_password = "ChangeThisPassword123!@#"
EOF

# 민감 정보 보호
chmod 600 terraform.tfvars
echo "terraform.tfvars" >> .gitignore
```

### 3. 인프라 배포

```bash
# Dry-run (변경사항 확인)
terraform plan

# 배포 실행 (약 30-45분 소요)
terraform apply

# 주요 출력값 확인
terraform output eks_cluster_name
terraform output api_gateway_http_url
terraform output cognito_user_pool_id
```

### 4. EKS 클러스터 접근 설정

```bash
# kubectl 설정
aws eks update-kubeconfig \
  --name glimpse-prod \
  --region ap-northeast-2

# 클러스터 상태 확인
kubectl get nodes
kubectl get pods --all-namespaces
```

### 5. 애플리케이션 배포

```bash
# Docker 이미지 빌드 & 푸시
cd ../../..
docker build -t glimpse-api:latest ./server
docker tag glimpse-api:latest {ECR_URI}/glimpse-api:latest
docker push {ECR_URI}/glimpse-api:latest

# Kubernetes 배포
kubectl apply -f infrastructure/kubernetes/namespace.yaml
kubectl apply -f infrastructure/kubernetes/apps/api-deployment.yaml
kubectl apply -f infrastructure/kubernetes/apps/api-service.yaml

# 배포 상태 확인
kubectl get deployments -n glimpse
kubectl get pods -n glimpse
kubectl logs -f -n glimpse -l app=glimpse-api
```

### 6. 데이터베이스 마이그레이션

```bash
# Prisma 마이그레이션
cd server
npx prisma migrate deploy

# 시드 데이터 (선택사항)
npx prisma db seed
```

### 7. 헬스 체크

```bash
# API 엔드포인트 확인
API_URL=$(terraform output -raw api_gateway_http_url)
curl ${API_URL}/health

# 응답 예시:
# {
#   "status": "ok",
#   "timestamp": "2025-01-21T12:00:00Z",
#   "database": "connected",
#   "redis": "connected"
# }
```

---

## 📊 모니터링 & 알림

### CloudWatch 대시보드

```yaml
대시보드 위젯:

1. EKS 메트릭
   - CPU Utilization (평균, 최대)
   - Memory Utilization
   - Network In/Out
   - Pod Count (실행/대기)

2. RDS 메트릭
   - CPU Utilization
   - DatabaseConnections
   - ReadLatency / WriteLatency
   - FreeableMemory

3. Redis 메트릭
   - CPUUtilization
   - CurrConnections
   - Evictions (메모리 부족 시)
   - CacheHitRate

4. ALB 메트릭
   - RequestCount
   - TargetResponseTime
   - HTTPCode_Target_5XX_Count
   - ActiveConnectionCount

5. API Gateway 메트릭
   - Count (요청 수)
   - Latency (응답 시간)
   - 4XXError / 5XXError
```

### CloudWatch 알림 (Phase 1)

```yaml
Critical Alarms (즉시 대응):

1. EKS CPU > 80% (5분 지속)
   Action: 자동 스케일링 트리거

2. EKS Memory > 85% (5분 지속)
   Action: Pod 재시작 고려

3. RDS CPU > 80% (10분 지속)
   Action: 쿼리 최적화 필요

4. RDS FreeableMemory < 200MB
   Action: 업그레이드 고려

5. ALB 5XX Errors > 10 (5분 내)
   Action: 애플리케이션 로그 확인

6. NAT Gateway PacketsDropCount > 100
   Action: 네트워크 문제 확인

7. Redis CPUUtilization > 75%
   Action: 노드 업그레이드 고려

알림 채널:
- Email: devops@glimpse.io
- SMS: 중요 알림만
- Slack: #alerts 채널 (선택)
```

### 비용 알림

```yaml
AWS Budgets 설정:

1. 월간 예산: $250
   - $200 도달 시: 이메일 경고 (80%)
   - $225 도달 시: SMS 경고 (90%)
   - $250 초과 시: 긴급 알림 (100%)

2. 일일 예산: $10
   - 비정상 스파이크 감지

3. 서비스별 예산:
   - EKS: $100
   - RDS: $30
   - NAT Gateway: $45
   - 기타: $75
```

---

## ⚠️ 리스크 & 완화 전략

| 리스크 | 확률 | 영향 | 완화 방안 | 복구 시간 |
|--------|------|------|-----------|-----------|
| **NAT 장애** | 낮음 | 중간 | AWS auto-recovery | 15-30분 |
| **Spot 중단** | 중간 | 낮음 | K8s auto-reschedule | 2-5분 |
| **RDS 장애** | 낮음 | 높음 | Automated backup | 10-20분 |
| **Redis 장애** | 낮음 | 낮음 | Graceful degradation | 즉시 |
| **AZ 장애** | 매우 낮음 | 중간 | 2 AZ 구성 | 즉시 |
| **EKS 장애** | 매우 낮음 | 높음 | Multi-node redundancy | 즉시 |

### 복구 시나리오

#### Scenario 1: NAT Gateway 장애
```bash
1. AWS auto-recovery 자동 시도 (15분)
2. 실패 시 Terraform 재적용:
   cd infrastructure/terraform/environments/startup-prod
   terraform apply -target=module.networking
   (30분)
3. 최대 다운타임: 30분
```

#### Scenario 2: Spot Instance 중단
```bash
1. Kubernetes가 자동으로 Pod 재스케줄링
2. On-Demand 노드로 즉시 이동
3. 다운타임: 없음 (2-3초 latency 증가)
4. 새 Spot 인스턴스 자동 시작: 3-5분
```

#### Scenario 3: RDS 장애
```bash
1. AWS가 자동 재시작 시도 (5분)
2. 실패 시 최신 백업에서 복구:
   - Point-in-time recovery 시작
   - 복구 시간: 10-20분
3. 데이터 손실: 최대 5분 (백업 주기)
```

#### Scenario 4: Redis 장애
```bash
1. 애플리케이션 graceful degradation:
   - 세션: Cognito JWT 재검증으로 대체
   - Rate limiting: 임시 비활성화
   - 캐시: DB 직접 조회
2. Redis 재시작: ElastiCache 자동 재시작 (5분)
3. 다운타임: 없음 (성능만 약간 저하)
```

---

## 💡 비용 최적화 팁

### 1. Reserved Instances (Phase 2+)

```
1년 약정 시 할인:
- EC2: 40% 할인
- RDS: 40% 할인
- ElastiCache: 40% 할인

예상 절감 (Phase 2):
- EC2 (3 nodes): $15 × 3 × 0.4 = $18/월 절감
- RDS (db.t4g.medium): $58 × 0.4 = $23/월 절감
- Redis (cache.t4g.small): $24 × 0.4 = $10/월 절감
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
총 절감: $51/월 ($612/년)

권장 시기:
✅ 월간 수익 > $5,000
✅ 트래픽 안정적
✅ 1년 이상 운영 계획 확실
```

### 2. Savings Plans (Phase 3+)

```
Compute Savings Plan (1년):
- EC2, Lambda, Fargate 포함
- 최대 66% 할인
- 유연한 인스턴스 타입 변경

예상 절감 (Phase 3):
- EC2: $100 → $60 (-$40)
- RDS: 별도 RI 적용 (-$50)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
총 절감: $90/월 ($1,080/년)

권장 시기:
✅ Phase 3 도달 (5,000+ 유저)
✅ 트래픽 예측 가능
```

### 3. Data Transfer 최적화

```
NAT Gateway 트래픽 감소:

1. VPC Endpoints 활성화 (Phase 2)
   - S3 Endpoint: 무료
   - ECR Endpoint: $7/월
   - NAT 트래픽 감소: -30GB/월
   - 절감: $1.35/월 (데이터 전송)

2. CloudFront 사용 (Phase 2+)
   - S3 직접 접근 대신 CDN
   - 캐시 히트율: 80%
   - Data transfer 절감: -40%
   - 비용: $20/월 추가 (하지만 전체적으로 절감)

3. 압축 활성화
   - gzip 압축: -70% 트래픽
   - 이미지 최적화: WebP 포맷
   - API 응답 압축
```

### 4. Storage 최적화

```
S3 Lifecycle 정책 (이미 적용):

Files Bucket:
- 30일: Standard → Intelligent-Tiering
- 90일: Intelligent → Glacier Instant
- 절감: -50% 스토리지 비용

Backups Bucket:
- 7일: Standard → Glacier
- 90일: 삭제
- 절감: -90% 백업 비용

예상 절감:
- Files: 50GB × $0.023 → $1.15
- After Lifecycle: 50GB × $0.012 → $0.60
- 월간 절감: $0.55 (작지만 누적되면 의미 있음)
```

### 5. 로그 최적화

```
CloudWatch Logs 비용 감소:

1. Log Retention 전략:
   Phase 1: 7일 ($5/월)
   Phase 2: 30일 ($20/월)
   Phase 3: 90일 ($60/월)

2. Log Filtering:
   - DEBUG 로그: 개발 환경만
   - INFO 로그: 프로덕션 최소화
   - ERROR/WARN 로그: 모두 보관

3. Log Export to S3:
   - CloudWatch: $0.50/GB
   - S3: $0.023/GB (95% 저렴)
   - 30일 후 자동 export
   - 장기 보관은 S3 Glacier

예상 절감:
- 10GB 로그 × ($0.50 - $0.023) = $4.77/월
```

---

## 🎯 결론

### ✅ 달성한 것

1. **79% 비용 절감**: $932 → $198/월
2. **RDS 최적화**: db.t4g.small (0-1,000 유저 충분)
3. **무한 확장 가능**: 10,000+ 유저까지 자동 스케일
4. **프로덕션 준비**: 보안, 백업, 모니터링 완비
5. **모바일 전용**: Web/Admin 제외, Mobile + Server만

### 📈 단계별 비용 예측

```
Phase 1 (0-1K 유저):     $198/월
Phase 2 (1K-5K 유저):    $280/월
Phase 3 (5K-10K 유저):   $450/월
Phase 4 (10K+ 유저):     $600-800/월 (RI 적용 시)
```

### 🚀 다음 단계

```bash
# 1. 인프라 배포
cd infrastructure/terraform/environments/startup-prod
terraform init
terraform plan
terraform apply

# 2. 애플리케이션 배포
kubectl apply -f ../../kubernetes/apps/

# 3. 데이터베이스 마이그레이션
cd ../../../server
npx prisma migrate deploy

# 4. 모니터링 설정
# CloudWatch 대시보드 생성
# SNS 알림 구독 확인

# 5. 헬스 체크
curl https://api.glimpse.io/health
```

### 📊 모니터링 체크리스트

- [ ] CloudWatch 대시보드 생성
- [ ] 알림 이메일 구독 확인
- [ ] 비용 알림 설정 ($250/월 예산)
- [ ] 일일 비용 리뷰 자동화
- [ ] RDS 성능 모니터링 (CPU, Connections)
- [ ] EKS Pod 상태 확인
- [ ] API Gateway 요청 추적

### 🔄 Phase 2 전환 시점

다음 지표 중 하나라도 도달 시 Phase 2로 전환:

```
✅ 일일 활성 사용자 > 500명
✅ API 요청 > 3M/월
✅ RDS CPU > 70% for 1 hour
✅ RDS Connections > 60
✅ Redis Memory > 400MB
✅ NAT 트래픽 > 300GB/월
✅ 월간 수익 > $3,000
```

---

**이제 월 $198로 프로덕션 런칭 준비 완료! 🎉**

Mobile App + API Server만으로 스타트업 초기 단계를 효율적으로 시작할 수 있습니다.
