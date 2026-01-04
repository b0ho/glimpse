# AWS Cognito 연동 가이드

## 개요

이 가이드는 Glimpse 앱에 AWS Cognito를 연동하는 방법을 설명합니다.

---

## 🏗️ 아키텍처

### 하이브리드 방식 (권장)

```
┌─────────────┐    Cognito SDK    ┌─────────────┐
│   Mobile    │ ──────────────────▶│  AWS Cognito │
└─────────────┘                    └─────────────┘
     │                                   │
     │ Cognito ID Token                  │ SMS 인증
     ▼                                   ▼
┌─────────────┐    자체 JWT       ┌─────────────┐
│   Backend   │ ──────────────────▶│    RDS      │
└─────────────┘  (기존 유지)       └─────────────┘
```

**장점**:
- 기존 코드 최소 수정
- SMS 비용 절감 (AWS SNS 사용)
- AWS 관리형 인증 시스템 활용

---

## 📋 사전 준비

### 1. Terraform 배포

```bash
cd infrastructure/terraform/environments/startup-minimal

# terraform.tfvars 파일 작성
cp terraform.tfvars.example terraform.tfvars

# Cognito 리소스 배포
terraform init
terraform plan
terraform apply
```

### 2. Cognito Outputs 확인

```bash
terraform output -json

# 출력 예시:
# {
#   "cognito_user_pool_id": "ap-northeast-2_XXXXX",
#   "cognito_client_id": "1234567890abcdef",
#   "cognito_user_pool_arn": "arn:aws:cognito-idp:..."
# }
```

---

## 🔧 Backend 설정

### 1. 환경 변수 설정

`.env` 파일 또는 환경 변수:

```bash
# AWS Cognito
AWS_COGNITO_USER_POOL_ID=ap-northeast-2_XXXXX
AWS_COGNITO_CLIENT_ID=1234567890abcdef
AWS_REGION=ap-northeast-2
```

### 2. Gradle 의존성 설치

```bash
cd backend
./gradlew build --refresh-dependencies
```

### 3. 서버 실행 및 확인

```bash
./gradlew bootRun

# Swagger UI에서 확인
# http://localhost:3001/swagger-ui.html
# POST /api/v1/auth/login/cognito 엔드포인트 확인
```

---

## 📱 Mobile 설정

### 1. 의존성 설치

```bash
cd mobile
npm install

# 새로 추가된 패키지:
# - aws-amplify
# - amazon-cognito-identity-js
```

### 2. 환경 변수 설정

`.env` 파일:

```bash
# Cognito
EXPO_PUBLIC_COGNITO_USER_POOL_ID=ap-northeast-2_XXXXX
EXPO_PUBLIC_COGNITO_CLIENT_ID=1234567890abcdef
EXPO_PUBLIC_AWS_REGION=ap-northeast-2
```

### 3. App.tsx 수정 (Cognito 초기화)

```typescript
// App.tsx (이미 수정됨)
import { configureCognito } from '@/services/auth/cognito-config';

export default function App() {
  // Cognito는 AuthProvider 내부에서 자동 초기화됨
  return (
    <AuthProvider>
      {/* ... */}
    </AuthProvider>
  );
}
```

---

## 💻 사용 방법

### 1. Cognito 회원가입

```typescript
import { useAuth } from '@/providers/AuthProvider';

const { signUpWithCognito, confirmSignUpWithCognito } = useAuth();

// 1단계: 전화번호 + 비밀번호로 회원가입 (SMS 발송)
const result = await signUpWithCognito('01012345678', 'MyPassword123!');

if (result.success && result.needsConfirmation) {
  // 2단계: SMS 인증 코드 확인
  const confirmed = await confirmSignUpWithCognito('01012345678', '123456');
  
  if (confirmed.success) {
    console.log('회원가입 완료!');
  }
}
```

### 2. Cognito 로그인

```typescript
const { signInWithCognito } = useAuth();

// Cognito 로그인 → Backend JWT 자동 발급
const result = await signInWithCognito('01012345678', 'MyPassword123!');

if (result.success) {
  console.log('로그인 성공!', result.userId);
  // 이후 기존 API 호출 가능 (자체 JWT 토큰 사용)
}
```

### 3. 기존 방식과 병행 사용

```typescript
// 기존 SMS 인증 (Cognito 없이)
const { signInWithPhone, sendVerificationCode } = useAuth();

await sendVerificationCode('01012345678');
const result = await signInWithPhone('01012345678', '123456');

// Cognito 인증 (새로운 방식)
const { signInWithCognito } = useAuth();
const result = await signInWithCognito('01012345678', 'MyPassword123!');

// 두 방식 모두 동일한 Backend JWT 토큰 발급!
```

---

## 🔄 마이그레이션 전략

### Phase 1: 현재 (기존 유지)
- ✅ 기존 SMS 인증 유지 (Solapi)
- ✅ Cognito 인프라만 배포

### Phase 2: Cognito 추가 (선택적 사용)
- ✅ Backend에 Cognito 토큰 검증 추가
- ✅ Mobile에 Cognito 옵션 추가
- 신규 사용자 → Cognito 권장
- 기존 사용자 → 기존 방식 유지

### Phase 3: 전면 전환 (선택 사항)
- 모든 사용자 Cognito로 전환
- Solapi SMS 비용 절감
- 기존 SMS 로직 제거

---

## 💰 비용 비교

| 항목 | 현재 (Solapi) | Cognito |
|------|---------------|---------|
| **SMS 비용** | 건당 ~20원 | AWS SNS (건당 ~15원) |
| **인증 비용** | 무료 (자체 구현) | 월 50,000 MAU 무료 |
| **관리 비용** | 직접 관리 | AWS 관리형 |

**예상 절감액** (월 10,000명 기준):
- SMS: ₩200,000 → ₩150,000 (25% 절감)
- 관리 시간: 개발자 시간 절약

---

## 🐛 문제 해결

### Cognito 토큰 검증 실패

```
Error: 유효하지 않은 Cognito 토큰입니다
```

**원인**: JWKS URL 연결 실패 또는 잘못된 User Pool ID

**해결**:
```bash
# User Pool ID 확인
terraform output cognito_user_pool_id

# Backend 로그 확인
tail -f backend/logs/application.log

# JWKS URL 직접 확인
curl https://cognito-idp.ap-northeast-2.amazonaws.com/ap-northeast-2_XXXXX/.well-known/jwks.json
```

### Mobile에서 Cognito 메서드 없음

```
TypeError: signUpWithCognito is not a function
```

**원인**: 환경 변수 미설정

**해결**:
```bash
# .env 파일 확인
cat mobile/.env

# 필수 변수 확인
echo $EXPO_PUBLIC_COGNITO_USER_POOL_ID
echo $EXPO_PUBLIC_COGNITO_CLIENT_ID

# 앱 재시작
npm run start -- --clear
```

### Amplify 초기화 오류

```
Error: Amplify has not been configured
```

**해결**:
```typescript
// AuthProvider.tsx에서 자동 초기화되므로
// 별도 설정 불필요. 환경 변수만 확인하세요.
```

---

## ✅ 체크리스트

### Backend
- [x] `build.gradle`에 AWS Cognito 의존성 추가
- [x] `CognitoTokenVerifier` 서비스 구현
- [x] `AuthService.loginWithCognito()` 메서드 추가
- [x] `AuthController` POST `/login/cognito` 엔드포인트 추가
- [x] `application.yml`에 Cognito 설정 추가
- [ ] 환경 변수 설정 (`.env` 또는 시스템 환경 변수)

### Mobile
- [x] `package.json`에 `aws-amplify` 추가
- [x] `cognito-config.ts` 생성
- [x] `cognito-service.ts` 생성
- [x] `AuthProvider.tsx`에 Cognito 메서드 추가
- [ ] 환경 변수 설정 (`.env`)
- [ ] UI 화면에 Cognito 로그인 옵션 추가 (선택)

### Infrastructure
- [ ] Terraform 배포 (`terraform apply`)
- [ ] Cognito User Pool 생성 확인
- [ ] Outputs 값 확인 및 환경 변수 설정

---

## 📚 참고 자료

- [AWS Cognito 공식 문서](https://docs.aws.amazon.com/cognito/)
- [AWS Amplify Gen 2 문서](https://docs.amplify.aws/gen2/)
- [Glimpse AWS 아키텍처 문서](../architecture/AWS_MIGRATION_ARCHITECTURE.md)

---

**Last Updated**: 2025-01-14  
**Version**: 1.0

