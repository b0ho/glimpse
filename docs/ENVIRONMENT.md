# 환경변수 관리 가이드

## 개요

Glimpse 프로젝트는 보안과 편의성을 위해 체계적인 환경변수 관리 시스템을 사용합니다.

## 빠른 시작

### 1. 초기 설정

```bash
# 환경변수 파일 생성
npm run env:setup

# 환경변수 검증
npm run env:check
```

### 2. 환경변수 파일 구조

```
glimpse-fe/
├── .env                    # 루트 환경변수 (서버 기본값)
├── .env.example            # 환경변수 템플릿
├── server/
│   └── .env               # 서버 전용 환경변수
├── mobile/
│   └── .env               # 모바일 앱 환경변수 (EXPO_PUBLIC_*)
└── web/
    └── .env.local         # Next.js 환경변수 (NEXT_PUBLIC_*)
```

## 환경변수 카테고리

### 1. 서버 설정
- `NODE_ENV` - 실행 환경 (development/staging/production)
- `PORT` - 서버 포트
- `API_URL` - API 베이스 URL

### 2. 데이터베이스
- `DATABASE_URL` - PostgreSQL 연결 문자열
- `REDIS_URL` - Redis 연결 문자열

### 3. 인증 (Clerk)
- `CLERK_PUBLISHABLE_KEY` - 클라이언트용 공개 키
- `CLERK_SECRET_KEY` - 서버용 비밀 키
- `CLERK_WEBHOOK_SECRET` - 웹훅 서명 검증용

### 4. 결제 서비스
#### Stripe
- `STRIPE_PUBLISHABLE_KEY` - 클라이언트용 공개 키
- `STRIPE_SECRET_KEY` - 서버용 비밀 키
- `STRIPE_WEBHOOK_SECRET` - 웹훅 서명 검증용

#### 한국 결제
- `TOSSPAY_CLIENT_KEY` / `TOSSPAY_SECRET_KEY`
- `KAKAOPAY_ADMIN_KEY` / `KAKAOPAY_CID`

### 5. 클라우드 서비스
- AWS S3 (파일 업로드)
- Firebase (푸시 알림)

### 6. 외부 API
- Kakao API (지도, OCR)
- Naver API (OCR, 검색)

### 7. 보안
- `JWT_SECRET` - JWT 토큰 서명용 (최소 32자)
- `ENCRYPTION_KEY` - 데이터 암호화용 (32자)

## 보안 가이드

### 절대 하지 말아야 할 것들
- ❌ `.env` 파일을 Git에 커밋하지 마세요
- ❌ 민감한 키를 코드에 하드코딩하지 마세요
- ❌ 프로덕션 키를 개발 환경에서 사용하지 마세요

### 권장 사항
- ✅ 환경별로 다른 키 사용 (개발/스테이징/프로덕션)
- ✅ 정기적인 키 로테이션
- ✅ 최소 권한 원칙 적용
- ✅ dotenv-vault를 사용한 암호화된 환경변수 관리

## dotenv-vault 사용법

### 1. 초기화
```bash
npm run env:vault new
```

### 2. 환경변수 암호화
```bash
npm run env:vault push
```

### 3. 팀원과 공유
```bash
npm run env:vault pull
```

## 환경별 설정

### 개발 환경 (Development)
```env
NODE_ENV=development
API_URL=http://localhost:3001
DATABASE_URL="postgresql://glimpse:glimpse_password@localhost:5432/glimpse_db"
```

### 스테이징 환경 (Staging)
```env
NODE_ENV=staging
API_URL=https://staging-api.glimpse.dating
DATABASE_URL="postgresql://user:pass@staging-db.amazonaws.com:5432/glimpse_staging"
```

### 프로덕션 환경 (Production)
```env
NODE_ENV=production
API_URL=https://api.glimpse.dating
DATABASE_URL="postgresql://user:pass@prod-db.amazonaws.com:5432/glimpse_prod"
```

## 문제 해결

### 환경변수가 로드되지 않을 때
1. `.env` 파일이 올바른 위치에 있는지 확인
2. 파일 권한 확인 (`chmod 600 .env`)
3. 환경변수 이름에 공백이 없는지 확인

### 타입 에러가 발생할 때
```typescript
// env.d.ts 파일 생성
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'staging';
    DATABASE_URL: string;
    // ... 기타 환경변수
  }
}
```

### CI/CD에서 환경변수 설정
GitHub Actions 예시:
```yaml
env:
  NODE_ENV: production
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
```

## 추가 리소스
- [dotenv-vault 문서](https://www.dotenv.org/docs/security/vault)
- [Next.js 환경변수](https://nextjs.org/docs/basic-features/environment-variables)
- [Expo 환경변수](https://docs.expo.dev/guides/environment-variables/)