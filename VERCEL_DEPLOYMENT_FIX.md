# Vercel 배포 문제 해결 가이드

## 🚨 현재 문제
- **증상**: 로그인은 되지만 백엔드 API 연동 실패
- **원인**: Clerk 프로덕션 키가 `glimpse.contact` 도메인만 허용
- **임시 도메인**: `glimpse-mobile.vercel.app`

## 🔧 즉시 해결 방법

### 옵션 1: Vercel 대시보드에서 환경 변수 수정 (권장)
1. Vercel 대시보드 접속
2. Project Settings > Environment Variables
3. 다음 변수 수정:
   ```
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
   ```
4. Redeploy 실행

### 옵션 2: Clerk Dashboard에서 도메인 추가
1. Clerk Dashboard 접속
2. Settings > Domains
3. `glimpse-mobile.vercel.app` 도메인 추가
4. Production 키 사용 가능

### 옵션 3: 커스텀 도메인 설정
1. Vercel 대시보드에서 Custom Domain 추가
2. `app.glimpse.contact` 또는 `mobile.glimpse.contact` 설정
3. DNS 설정 완료 후 프로덕션 키 사용

## 📝 임시 해결책 (코드 수정)

`mobile/App.tsx` 파일에서 Vercel 도메인 감지 시 개발 키 강제:

```typescript
if (hostname.includes('vercel.app')) {
  // Vercel 도메인에서는 무조건 개발 키 사용
  clerkPublishableKey = 'pk_test_your_clerk_publishable_key_here';
  clerkFrontendApi = undefined;
  console.log('⚠️ FORCING development Clerk key for Vercel domain');
}
```

## 🎯 영구 해결책

1. **Production 준비**:
   - `glimpse.contact` 도메인에 모바일 앱 배포
   - 또는 서브도메인 설정 (예: `app.glimpse.contact`)

2. **Clerk 설정**:
   - Production 도메인 등록
   - 프로덕션 키 사용

3. **환경 변수 정리**:
   - 개발/운영 환경 분리
   - 도메인별 키 관리

## 🔍 디버깅 체크리스트

- [ ] Clerk 대시보드에서 허용된 도메인 확인
- [ ] Vercel 환경 변수 확인
- [ ] 브라우저 콘솔에서 Clerk 오류 메시지 확인
- [ ] API 엔드포인트 CORS 설정 확인

## 📞 지원 연락처
- Clerk Support: https://clerk.com/support
- Vercel Support: https://vercel.com/support

---
*작성일: 2025-09-06*
*문제 해결 시 이 문서를 삭제하거나 업데이트하세요.*