# Glimpse E2E 테스트 가이드

## 개요
Glimpse 앱의 모든 기능과 요구사항을 검증하는 포괄적인 E2E 테스트 스위트입니다.

## 테스트 구조

```
e2e/
├── tests/                    # 테스트 파일들
│   ├── auth.spec.ts         # 인증 및 회원가입
│   ├── group.spec.ts        # 그룹 가입 및 관리
│   ├── matching.spec.ts     # 익명 좋아요 및 매칭
│   ├── chat.spec.ts         # 실시간 채팅
│   ├── payment.spec.ts      # 한국형 결제 시스템
│   ├── company-verification.spec.ts  # 회사 인증
│   ├── location-group.spec.ts       # 위치 기반 그룹
│   ├── story.spec.ts        # 24시간 스토리
│   ├── friend.spec.ts       # 친구 시스템
│   ├── push-notification.spec.ts    # 푸시 알림
│   ├── admin-dashboard.spec.ts      # 관리자 도구
│   ├── performance.spec.ts  # 성능 테스트
│   ├── security.spec.ts     # 보안 테스트
│   └── accessibility.spec.ts # 접근성 테스트
├── pages/                    # Page Object Models
│   ├── auth.page.ts
│   ├── group.page.ts
│   ├── matching.page.ts
│   └── chat.page.ts
├── setup/                    # 테스트 설정
│   └── test-data.ts         # 테스트 데이터
├── test-assets/             # 테스트용 파일
└── playwright.config.ts     # Playwright 설정

```

## 실행 방법

### 사전 준비
```bash
# 의존성 설치
npm install

# 개발 서버 실행 (별도 터미널)
npm run dev:server
npm run dev:mobile
```

### 테스트 실행
```bash
# 모든 테스트 실행
npm run test:e2e

# 특정 테스트만 실행
npx playwright test auth.spec.ts

# UI 모드로 실행 (디버깅용)
npm run test:e2e:ui

# 디버그 모드
npm run test:e2e:debug

# 특정 브라우저만 테스트
npx playwright test --project=chromium
```

### 리포트 확인
```bash
# HTML 리포트 열기
npx playwright show-report
```

## 테스트 분류

### 1. 기능 테스트
- **인증**: SMS 인증, 회원가입/로그인
- **그룹**: 4가지 그룹 타입 (공식/생성/인스턴스/위치)
- **매칭**: 익명 좋아요, 상호 매칭, 크레딧 시스템
- **채팅**: 실시간 메시징, 암호화, 이미지 전송
- **결제**: 토스페이/카카오페이, 프리미엄 구독
- **회사 인증**: 이메일 도메인, OCR 인증
- **위치**: GPS 기반 그룹, QR 코드
- **스토리**: 24시간 임시 콘텐츠
- **친구**: 친구 요청/관리, 프로필 공개
- **알림**: FCM 푸시 알림, 개별 설정
- **관리자**: 대시보드, 사용자/그룹 관리, 모니터링

### 2. 비기능 테스트
- **성능**: 대용량 처리, 동시 접속, 메모리 관리
- **보안**: 인증, SQL 인젝션, XSS, CSRF 방지
- **접근성**: WCAG 준수, 키보드/스크린리더 지원

## 테스트 데이터

테스트용 계정은 `setup/test-data.ts`에 정의되어 있습니다:
- 일반 사용자: 01012345678
- 프리미엄 사용자: 01077777777
- 관리자: admin@glimpse.app

## 주의사항

1. **환경 변수**: `.env.test` 파일에 테스트용 환경 변수 설정 필요
2. **데이터베이스**: 테스트용 데이터베이스 사용 권장
3. **외부 서비스**: 테스트 모드 API 키 사용 (Stripe, Toss, Kakao 등)
4. **병렬 실행**: 일부 테스트는 순차 실행 필요 (특히 성능 테스트)

## 트러블슈팅

### 테스트 실패 시
1. 개발 서버가 실행 중인지 확인
2. 데이터베이스 연결 상태 확인
3. 환경 변수 설정 확인
4. 브라우저 드라이버 업데이트: `npx playwright install`

### 타임아웃 오류
- `playwright.config.ts`에서 타임아웃 값 조정
- 네트워크 상태 확인
- 서버 응답 속도 확인

## 기여 가이드

1. 새 기능 추가 시 반드시 E2E 테스트 작성
2. Page Object Model 패턴 사용
3. 테스트는 독립적으로 실행 가능해야 함
4. 의미 있는 테스트 이름 사용 (한글 가능)
5. 적절한 대기 시간과 재시도 로직 포함

## 참고 자료
- [Playwright 문서](https://playwright.dev)
- [E2E 테스트 검증 리포트](../E2E_TEST_VERIFICATION_REPORT.md)
- [프로젝트 요구사항](../docs/requirements.md)