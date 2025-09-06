# Vercel 환경변수 설정 가이드

## 문제 상황
- Clerk 프로덕션 키가 `glimpse.contact` 도메인 전용으로 설정됨
- `vercel.app` 도메인에서는 CORS 오류로 인한 무한 새로고침 발생

## 해결 방법

### 옵션 1: Vercel 환경변수 수정 (임시 해결책)

Vercel 대시보드 (https://vercel.com/dashboard) 에서:

1. 프로젝트 선택 → Settings → Environment Variables
2. 다음 환경변수 수정:

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bGlrZWQtZG9nLTkzLmNsZXJrLmFjY291bnRzLmRldiQ
```

3. `EXPO_PUBLIC_CLERK_FRONTEND_API` 환경변수 삭제 또는 비활성화

### 옵션 2: Clerk Dashboard에서 도메인 추가 (영구 해결책)

Clerk Dashboard (https://dashboard.clerk.com) 에서:

1. Production 인스턴스 선택
2. Settings → Domains
3. 다음 도메인 추가:
   - `glimpse-mobile.vercel.app`
   - `*.vercel.app` (와일드카드)

### 옵션 3: 커스텀 도메인 연결 (최선의 해결책)

1. Vercel 프로젝트에 커스텀 도메인 연결:
   - `app.glimpse.contact` 또는
   - `mobile.glimpse.contact`

2. Clerk Dashboard에서 해당 도메인 허용

## 현재 적용된 임시 해결책

`mobile/App.tsx`에 Vercel 도메인 감지 로직 추가:

```typescript
// CRITICAL FIX: Vercel 도메인에서는 프로덕션 키와 frontendApi 완전 차단
let isVercelDomain = false;
if (typeof window !== 'undefined') {
  const hostname = window.location?.hostname || '';
  isVercelDomain = hostname.includes('vercel.app');
  if (isVercelDomain) {
    // Vercel에서는 무조건 개발 키만 사용, 환경변수 완전 무시
    clerkPublishableKey = 'pk_test_bGlrZWQtZG9nLTkzLmNsZXJrLmFjY291bnRzLmRldiQ';
    clerkFrontendApi = undefined;
    console.log('🔧 CRITICAL: Forcing development Clerk key for Vercel deployment');
  }
}
```

이 코드는 임시 해결책이며, 위의 옵션 1, 2, 또는 3을 적용한 후에는 제거 가능합니다.

## 주의사항

- 개발 키는 사용량 제한이 있으므로 프로덕션에서는 적절한 해결책 필요
- 커스텀 도메인 연결이 가장 프로페셔널한 해결책