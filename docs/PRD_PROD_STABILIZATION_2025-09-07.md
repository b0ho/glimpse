## 운영 배포 안정화 PRD (Server + Mobile)

### 배경
- 운영 중이던 Server/Mobile 배포가 특정 시점 이후 간헐/지속 실패 보고됨.
- 관측 결과:
  - 루트 도메인 `https://www.glimpse.contact/`는 200 응답(정적, Vercel 캐시 HIT).
  - `https://www.glimpse.contact/api/v1/health`는 JSON 정상 응답 (env: vercel, service: glimpse-api).
  - `https://glimpse.contact/api/v1/health`는 Redirecting… (Apex→WWW 리다이렉트 추정).
  - 모바일이 참조 중인 `https://glimpse-server.up.railway.app/api/v1`는 404 Not Found.
  - 과거 가이드의 `https://glimpse-server-psi.vercel.app/api/v1/health`는 NOT_FOUND (서비스 미존재/라우팅 변경).
- 환경 이슈 이력:
  - 2025-09-03 전후 Vercel 환경변수 변경으로 인증 이슈 발생 기록.
  - Cloudflare + Clerk 보안 체크로 세션 생성 실패 이슈 기록.

### 문제 정의
1) API 베이스 도메인/호스트가 산재(Railway, Vercel, glimpse.contact path)되어 모바일/서버 간 드리프트 발생.
2) Apex/WWW 리다이렉트와 경로 기반 API 노출(`www.glimpse.contact/api/...`)로 모바일이 Railway 하드코딩 시 404 노출.
3) 플랫폼 설정(Cloudflare, Vercel, Clerk) 변경이 인증/세션 및 라우팅에 간접 영향.

### 목표(정렬)
- 단일 Canonical API 도메인 확정 및 전 서비스 일원화.
- 모바일/웹/관리자에서 API URL 하드코딩 제거, 환경변수 일원화.
- Cloudflare/Vercel/Clerk 설정을 Canonical 도메인 기준으로 재정렬.
- 배포/롤백/모니터링 표준화.

### 가설 및 근거
- 가설 A: Railway 인스턴스/경로 변경 또는 중지로 `glimpse-server.up.railway.app` 404 → 모바일 API 실패.
  - 근거: 실제 404 응답, 코드에 Railway 하드코딩 탐지.
```12:20:mobile/services/api/config.ts
  if (isProduction) {
    return 'https://glimpse-server.up.railway.app/api/v1';
  }
// ... 더 있음
```
- 가설 B: API는 현재 Vercel 배후에서 `www.glimpse.contact/api/v1` 경로로 노출, Apex는 리다이렉트 정책만 존재.
  - 근거: `www.glimpse.contact/api/v1/health` 정상, `glimpse.contact/api/v1/health` Redirecting.
- 가설 C: Vercel/Cloudflare/Clerk 설정 변화가 인증/세션/라우팅에 추가 장애 유발.
  - 근거: 운영 이슈 문서들 기록.

### 범위
- 포함: Server API 라우팅/도메인 일원화, Mobile API URL 설정, CORS/Origin, Cloudflare/Vercel/Clerk 설정, 모니터링.
- 제외: 신규 기능 개발, 데이터 모델 변경.

### 결정(제안)
- Canonical API 도메인: `https://glimpse-server.up.railway.app` (경로: `/api/v1`).
- 모바일/웹/관리자 환경변수:
  - EXPO_PUBLIC_API_URL(or _BASE_URL) = `https://glimpse-server.up.railway.app/api/v1`
  - EXPO_PUBLIC_SOCKET_URL = `wss://glimpse-server.up.railway.app`
  - 하드코딩 제거는 유지하되 기본값은 Railway 호스트로 통일.
- 서버 CORS 허용 Origin: `https://www.glimpse.contact`, `https://glimpse.contact`, `https://glimpse-mobile.vercel.app`, `https://glimpse-web.vercel.app`, `https://glimpse-admin.vercel.app` (코드에 이미 반영되어 있음).
- Cloudflare: 웹 도메인에 대한 정책 유지. API는 Railway 직접 접근이므로 Cloudflare 영향 없음.
- Clerk: 웹/앱 도메인만 허용 관리(변경 없음).

### 구현 계획
1) 단기(오늘)
- 모바일 앱: API URL 환경변수 적용(EAS/Expo Config), Railway 하드코딩 제거.
- 서버: CORS 로그/설정 확인(이미 광범위 허용됨), 헬스 체크 확인.
- Cloudflare: 보안 수준 완화(임시), 캐시 무효화.
- 검증: `/api/v1/health`, 주요 API 스모크, Clerk OAuth→세션 생성 확인.

2) 중기(3일)
- `api.glimpse.contact` 서브도메인 발급, Vercel(or LB)으로 라우팅.
- 모든 클라이언트 환경변수 `api.glimpse.contact`로 전환.
- 모니터링 대시보드(헬스/지표/로그) 캡처링 정비.

3) 장기(2주)
- IaC(환경변수/라우팅) 관리로 대시보드 수동 변경 최소화.
- 운영 체크리스트 자동화(헬스/엔드포인트/도메인 검증 CI Step).

### 테스트/검증
- 헬스체크: `GET https://www.glimpse.contact/api/v1/health` = 200 ok.
- 주요 API: 인증 필요/불필요 엔드포인트 샘플 호출.
- 웹/앱 통합: 로그인→세션→보호 API 흐름 E2E.
- CORS: Origin별 허용/차단 로그 확인.

### 롤백 전략
- 모바일: 이전 환경변수(또는 OTA 롤백)로 되돌림.
- 서버: 이전 라우팅/Origin 설정 복원.
- DNS/클라우드: 레코드/정책 이전 상태로 복구.

### 리스크
- Cloudflare 보안 완화로 일시적 방어력 저하.
- 프록시 체인(WWW Path 기반)에서 웹/API 캐시 간섭 가능성.
- 앱 스토어 퍼블리시 리드타임.

### 오픈 이슈(확인 필요)
1) API 실행 주체가 현재 Vercel Functions인가, Railway/독립 서버인가? 단일화 대상 확정 필요.
2) `api.glimpse.contact` 서브도메인 보유/발급 가능 여부.
3) Expo OTA 사용 범위(긴급 핫픽스 적용 경로) 확인.

### 승인/요청
- 상기 Railway 단일 호스트 결정으로 진행.
- 향후 필요 시 `api.glimpse.contact`로 마이그레이션 옵션만 백로그에 유지.

### 부록(근거 스냅샷)
```1:24:server/src/app.controller.ts
@Get('api/v1/health')
getApiV1Health() {
  return { status: 'ok', service: 'glimpse-api-v1', ... };
}
```
```27:41:server/src/main.ts
const port = process.env.PORT || configService.get<number>('PORT', 3000);
// ... CORS 설정과 productionOrigins에 glimpse.contact 계열 포함
```
```111:130:docs/PRODUCTION_DEPLOYMENT_GUIDE.md
NEXT_PUBLIC_API_URL="https://api.glimpse.app"
# (현상과 상이, 도메인 드리프트 존재)
```
```1:27:mobile/eas.json
"EXPO_PUBLIC_API_URL": "https://api.glimpse.app"
# (실제 실행 코드는 Railway 하드코딩 fallback 존재)
```


