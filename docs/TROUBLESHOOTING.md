# Glimpse 트러블슈팅 가이드

## 🔴 Vercel 운영환경 무한 새로고침 문제

### 문제 증상
- vercel.app 도메인에서 무한 새로고침 발생
- Clerk 인증 오류: "Production Keys are only allowed for domain glimpse.contact"

### 근본 원인
**2025년 9월 3일 이후 Vercel 대시보드에서 환경변수가 변경됨**

- 9월 3일까지: 정상 작동 (개발 키 사용)
- 9월 3일 이후: 문제 발생 (프로덕션 키로 변경됨)
- 코드 변경 없이 환경변수만 변경되어 발생한 문제

### 증거
1. App.tsx는 9월 1-4일 사이 변경 없음
2. 9월 3일 커밋 `9eb184e`는 API 클라이언트 중앙화만 수행
3. Clerk 오류 메시지가 프로덕션 키 사용을 명시

### 해결 방법

#### 즉시 해결 (현재 적용됨)
`.env.production` 파일에 개발 키 명시:
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
```

#### 영구 해결 옵션

**옵션 1: Vercel 대시보드 환경변수 수정**
1. https://vercel.com/dashboard 접속
2. 프로젝트 → Settings → Environment Variables
3. `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` 값을 개발 키로 변경
4. `EXPO_PUBLIC_CLERK_FRONTEND_API` 삭제

**옵션 2: Clerk Dashboard 도메인 추가**
1. https://dashboard.clerk.com 접속
2. Production 인스턴스 → Settings → Domains
3. `glimpse-mobile.vercel.app` 추가

**옵션 3: 커스텀 도메인 연결**
1. Vercel에서 `app.glimpse.contact` 도메인 연결
2. Clerk에서 해당 도메인 허용
3. 프로덕션 키 사용 가능

### Vercel 환경변수 변경 이력 확인 방법

1. **Vercel 대시보드에서 확인**
   - Project → Settings → Environment Variables
   - "Last edited" 날짜 확인

2. **Vercel CLI로 확인**
   ```bash
   vercel env ls production
   ```

3. **팀 Activity Log 확인**
   - Vercel Dashboard → Team Settings → Activity
   - 환경변수 변경 이력 확인

### 예방 조치

1. **환경변수 변경 시 알림 설정**
   - Vercel → Project Settings → Notifications
   - Environment Variable 변경 알림 활성화

2. **환경변수 문서화**
   - 모든 환경변수를 `.env.example`에 문서화
   - 변경 시 PR 필수

3. **Infrastructure as Code**
   - `vercel.json`에 환경변수 정의 고려
   - Git으로 변경 이력 추적

## 📝 교훈

**환경변수 변경은 코드 변경만큼 중요합니다.**

- Vercel 대시보드에서 직접 변경 시 추적이 어려움
- 팀원 간 커뮤니케이션 필수
- 변경 전 테스트 환경에서 확인

## 🚨 긴급 연락처

문제 발생 시:
1. Vercel 대시보드 접근 권한자 확인
2. 최근 환경변수 변경자 확인
3. 롤백 또는 수정 진행

---

*Last updated: 2025-09-05*
*Issue discovered: 2025-09-05*
*Root cause: Environment variable changed on Vercel Dashboard around 2025-09-03*