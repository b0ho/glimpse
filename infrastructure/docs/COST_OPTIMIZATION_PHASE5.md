# Glimpse AWS 인프라 비용 최적화 Phase 5

> **목표**: $83/월 → $56/월 (32% 절감, -$27)
> **적용 시점**: 즉시 (2025-01-14)
> **영향**: 최소 (기능 변경 없음)

---

## 📊 3가지 시나리오 비교

| 시나리오 | 월 비용 | 절감율 | WebSocket | 가용성 | 구현 난이도 | 추천도 |
|---------|--------|--------|-----------|--------|-----------|--------|
| **1. 극단적 절감** | $40-46 | 45% | ✅ (API GW) | 낮음 (1-2 tasks) | 중 | ⭐⭐ |
| **2. 균형 최적화** | $56-66 | 28% | ✅ (ALB) | 중간 (2 tasks) | 쉬움 | ⭐⭐⭐⭐⭐ |
| **3. 서버리스** | $25-36 | 65% | ⚠️ (제한적) | 높음 | 어려움 | ⭐ |

---

## 🏆 추천: 시나리오 2 (균형 최적화)

### 선택 이유

1. **실시간 채팅 필수**: Glimpse는 Socket.IO 기반 → Lambda 부적합
2. **점진적 최적화**: 기존 아키텍처 유지하며 비용만 절감
3. **안정성**: 2 tasks로 충분한 가용성 확보
4. **확장성**: 유저 증가 시 쉽게 스케일 아웃 가능

### 아키텍처 (변경 없음)

```
Internet
   │
   ├─ ALB (유지)
   │  └─ ECS Fargate (2 tasks, Spot 90%)  ← 3 tasks → 2 tasks, Spot 70% → 90%
   │     ├─ NestJS API (0.25 vCPU, 512MB)
   │     └─ Socket.IO (WebSocket)
   │
   ├─ RDS PostgreSQL (db.t4g.micro, 1GB RAM)
   │
   ├─ Redis (cache.t4g.micro, 0.5GB)
   │
   ├─ S3 (Pre-signed URL로 직접 업로드)  ← NEW
   │
   └─ NAT Instance (t4g.nano)
```

---

## 🔧 최적화 항목 (4가지)

### 1. ECS Fargate Spot 비율 증가 (70% → 90%) **-$7/월**

**변경 파일**: `infrastructure/terraform/modules/ecs/main.tf`

```hcl
# Before
capacity_provider_strategy {
  capacity_provider = "FARGATE_SPOT"
  weight            = 70
  base              = 0
}

# After
capacity_provider_strategy {
  capacity_provider = "FARGATE_SPOT"
  weight            = 90  # 70 → 90
  base              = 0
}
```

**변경 파일**: `infrastructure/terraform/modules/ecs/main.tf` (line 27-29, 340-344)

**리스크**:
- Spot 중단 확률 증가 (1-2% → 3-5%)
- Auto Scaling이 자동 복구 (30초 내)

---

### 2. ECS Task 수 감소 (3 → 2) **-$10/월**

**변경 파일**: `infrastructure/terraform/environments/startup-prod/main.tf`

```hcl
# Before
desired_count = 3
min_capacity  = 2
max_capacity  = 20

# After
desired_count = 2  # 3 → 2
min_capacity  = 1  # 2 → 1
max_capacity  = 20
```

**변경 파일**: `infrastructure/terraform/environments/startup-prod/main.tf` (line 215-217)

**리스크**:
- 최소 1개 task로 동작 (단일 장애점)
- 해결: Auto Scaling이 즉시 2개로 복구

---

### 3. S3 Pre-signed URL 직접 업로드 **-$5/월**

**변경 파일**: `server/src/file/file.service.ts` (신규 생성)

```typescript
import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class FileService {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-northeast-2',
    });
  }

  /**
   * S3 Pre-signed URL 생성 (클라이언트가 직접 업로드)
   * ALB를 우회하여 데이터 전송 비용 절감
   */
  async getPresignedUploadUrl(
    userId: string,
    fileName: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; fileKey: string }> {
    const fileKey = `uploads/${userId}/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 300, // 5분
    });

    return { uploadUrl, fileKey };
  }

  /**
   * 업로드된 파일의 공개 URL 반환
   */
  getPublicUrl(fileKey: string): string {
    return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
  }
}
```

**변경 파일**: `server/src/file/file.controller.ts` (신규 생성)

```typescript
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { FileService } from './file.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('presigned-url')
  async getPresignedUrl(
    @CurrentUser() user: any,
    @Body() body: { fileName: string; contentType: string },
  ) {
    const { uploadUrl, fileKey } = await this.fileService.getPresignedUploadUrl(
      user.id,
      body.fileName,
      body.contentType,
    );

    return {
      uploadUrl,
      fileUrl: this.fileService.getPublicUrl(fileKey),
    };
  }
}
```

**Mobile 클라이언트 변경**: `mobile/services/fileUploadService.ts` (신규 생성)

```typescript
import { api } from './api';

export const uploadFileToS3 = async (
  file: {
    uri: string;
    type: string;
    name: string;
  }
): Promise<string> => {
  // 1. Pre-signed URL 요청
  const { uploadUrl, fileUrl } = await api.post('/files/presigned-url', {
    fileName: file.name,
    contentType: file.type,
  });

  // 2. S3에 직접 업로드 (ALB 우회)
  const response = await fetch(file.uri);
  const blob = await response.blob();

  await fetch(uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: {
      'Content-Type': file.type,
    },
  });

  // 3. 파일 URL 반환
  return fileUrl;
};
```

**사용 예시**:

```typescript
// Before: ALB를 통한 업로드 (비용 높음)
const formData = new FormData();
formData.append('file', file);
await api.post('/upload', formData);

// After: S3 직접 업로드 (비용 절감)
const fileUrl = await uploadFileToS3(file);
await api.post('/profile', { profileImageUrl: fileUrl });
```

**절감 원리**:
- ALB 데이터 전송 비용 ($0.008/GB) 회피
- S3 직접 업로드는 무료 (인바운드)

---

### 4. HTTP Keep-Alive 활성화 **-$3/월**

**변경 파일**: `server/src/main.ts`

```typescript
// Before
const app = await NestFactory.create(AppModule);

// After
const app = await NestFactory.create(AppModule, {
  httpsOptions: {
    keepAlive: true,
    keepAliveTimeout: 60000, // 60초
  },
});

// Keep-Alive 헤더 추가
app.use((req, res, next) => {
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=60, max=1000');
  next();
});
```

**절감 원리**:
- TCP 커넥션 재사용 → ALB 연결 비용 감소
- ALB 청구 단위: 신규 연결 수 (LCU)

---

### 5. Prisma Connection Pool 최적화 (비용 절감 아님, 성능 최적화)

**변경 파일**: `server/prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // db.t4g.micro (1GB RAM) 최적화
  connectionLimit    = 50    // RDS micro 적정 수준 (기존 100에서 축소)
  poolTimeout        = 30    // 빠른 타임아웃
  statementCacheSize = 100   // 쿼리 캐싱
}
```

**이유**:
- RDS db.t4g.micro는 최대 87개 연결만 지원
- 50개로 제한하여 여유 확보 (모니터링 + 관리 도구용)

---

## 📈 예상 비용 비교

### Before (Phase 4)

```
ECS Fargate (3 tasks, Spot 70%)  $40
ALB                              $17
RDS db.t4g.micro                 $13
Redis t4g.micro                  $12
NAT Instance                     $4
기타 (S3, CloudWatch, SNS)       $7
─────────────────────────────────────
총계                             $83/월
```

### After (Phase 5)

```
ECS Fargate (2 tasks, Spot 90%)  $23  (-$17)
ALB                              $17
RDS db.t4g.micro                 $13
Redis t4g.micro                  $12
NAT Instance                     $4
기타 (S3 절감)                   $2   (-$5)
─────────────────────────────────────
총계                             $56/월 (-32%)
```

---

## 🚀 적용 순서

### Step 1: 코드 변경 (백엔드 + 모바일)

```bash
# 1. 백엔드: File Service 추가
cd server
mkdir -p src/file
# file.service.ts, file.controller.ts, file.module.ts 생성

# 2. 모바일: File Upload Service 추가
cd mobile
mkdir -p services
# fileUploadService.ts 생성

# 3. HTTP Keep-Alive 활성화
# server/src/main.ts 수정

# 4. Prisma Pool 최적화
# server/prisma/schema.prisma 수정
```

### Step 2: Terraform 변경

```bash
cd infrastructure/terraform/environments/startup-prod

# 1. ECS 설정 변경
nano ../../modules/ecs/main.tf
# - Spot 비율 90%로 변경 (line 28, 342)

# 2. Task 수 변경
nano main.tf
# - desired_count: 3 → 2 (line 215)
# - min_capacity: 2 → 1 (line 216)

# 3. 변경사항 확인
terraform plan

# 4. 적용
terraform apply
```

### Step 3: 배포 및 테스트

```bash
# 1. Docker 이미지 빌드
cd server
docker build -t glimpse-api:latest .

# 2. ECR 푸시
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com

docker tag glimpse-api:latest <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com/glimpse-api:latest
docker push <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com/glimpse-api:latest

# 3. ECS 서비스 업데이트
aws ecs update-service \
  --cluster glimpse-prod \
  --service glimpse-api \
  --force-new-deployment

# 4. 테스트
# - Pre-signed URL 생성 확인
# - S3 직접 업로드 확인
# - HTTP Keep-Alive 헤더 확인
```

---

## ⚠️ 리스크 및 모니터링

### 리스크

| 항목 | 리스크 | 완화 방안 |
|------|--------|-----------|
| **Spot 중단** | 3-5% 확률로 중단 | Auto Scaling 자동 복구 (30초) |
| **Task 1개 동작** | 단일 장애점 | Auto Scaling이 즉시 2개로 복구 |
| **S3 업로드 실패** | 네트워크 오류 | 재시도 로직 + 에러 핸들링 |

### 모니터링 (CloudWatch Alarms)

```typescript
// 중요 알람
1. ECS CPU > 70% → Scale Out
2. ECS Memory > 80% → Scale Out
3. ECS Running Tasks < 2 → 경고
4. ALB 5xx > 10건/5분 → 경고
5. RDS 커넥션 > 45개 → 경고
```

---

## 📊 Phase 6 추가 최적화 (선택 사항)

### 향후 3-6개월 ($56 → $45/월)

1. **RDS Reserved Instance (1년)** (-$4/월)
   - db.t4g.micro: $13/월 → $9/월 (30% 할인)

2. **CloudFront CDN 도입** (-$3/월)
   - S3 정적 파일 CDN 캐싱
   - ALB 요청 감소

3. **ECS Min Capacity 0** (-$4/월)
   - 야간 시간대 완전 종료 (개발 단계만)
   - 프로덕션에서는 비추천

---

## 📝 체크리스트

### 코드 변경
- [ ] `server/src/file/file.service.ts` 생성
- [ ] `server/src/file/file.controller.ts` 생성
- [ ] `server/src/file/file.module.ts` 생성
- [ ] `mobile/services/fileUploadService.ts` 생성
- [ ] `server/src/main.ts` HTTP Keep-Alive 추가
- [ ] `server/prisma/schema.prisma` Pool 최적화

### Terraform 변경
- [ ] `modules/ecs/main.tf` Spot 90% 변경
- [ ] `environments/startup-prod/main.tf` Task 수 2 변경
- [ ] `terraform plan` 실행
- [ ] `terraform apply` 실행

### 테스트
- [ ] Pre-signed URL 생성 확인
- [ ] S3 직접 업로드 테스트
- [ ] HTTP Keep-Alive 헤더 확인
- [ ] Spot 중단 시 자동 복구 확인
- [ ] CloudWatch 알람 확인

### 모니터링
- [ ] ECS Task 수 모니터링 (최소 2개 유지)
- [ ] RDS 커넥션 수 모니터링 (< 45개)
- [ ] ALB 5xx 에러 모니터링
- [ ] 비용 대시보드 확인 (매주)

---

**최종 업데이트**: 2025-01-14
**다음 리뷰**: 2025-02-01
**문서 버전**: v1.0
