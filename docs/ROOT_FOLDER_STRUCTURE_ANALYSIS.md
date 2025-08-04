# Root 폴더 구조 분석 및 정리 제안

## 현재 Root 폴더 구조

### 1. **Core Workspaces (유지)**
- `mobile/` - React Native 모바일 앱
- `server/` - NestJS 백엔드 서버  
- `shared/` - 공통 타입 및 유틸리티
- `web/` - Next.js 관리자 대시보드

### 2. **문서 관련 (정리 필요)**
- `docs/` - 주요 문서 디렉토리 ✅
- `*.md` 파일들 - root에 산재한 문서들
  - CLAUDE.md (유지 - AI 가이드)
  - README.md (유지 - 프로젝트 소개)
  - 나머지는 docs/로 이동 필요

### 3. **설정 파일 (정리 필요)**
- `package.json` - monorepo 설정 ✅
- `tsconfig.json` - 공통 TypeScript 설정 ✅
- `babel.config.js` - mobile 전용 (이동 필요)
- `metro.config.js` - mobile 전용 (이동 필요)
- `eslint.config.js` - 공통 설정 ✅
- `playwright.config.ts` - e2e 테스트 설정 ✅

### 4. **테스트 관련 (통합 필요)**
- `e2e/` - E2E 테스트
- `test/` - 통합 테스트
- `tests/` - 추가 테스트
- `playwright-report/` - 테스트 리포트
- `test-results/` - 테스트 결과
→ 하나의 `tests/` 폴더로 통합 권장

### 5. **인프라 관련 (유지)**
- `docker/` - Docker 설정 ✅
- `scripts/` - 유틸리티 스크립트 ✅
- `monitoring/` - 모니터링 설정 ✅
- `nginx/` - 웹서버 설정 ✅
- `prisma/` - DB 스키마 ✅

### 6. **기타 (정리 필요)**
- `assets/` - 앱 아이콘 (mobile/assets로 이동)
- `config/` - 환경변수 예제 ✅
- `node_modules/` - 의존성 (자동 생성)
- `package-lock.json` - 의존성 잠금 파일 ✅

## 정리 제안사항

### 1. 즉시 이동/삭제 필요
```bash
# Mobile 전용 파일 이동
mv babel.config.js mobile/
mv metro.config.js mobile/
mv assets/* mobile/assets/

# 문서 파일 정리
mv CONFIG_FILES.md docs/development/
mv CONTRIBUTING.md docs/
mv E2E_TEST_VERIFICATION_REPORT.md docs/deployment/
mv ROOT_FOLDER_STRUCTURE_ANALYSIS.md docs/

# 테스트 폴더 통합
mkdir -p tests/e2e
mkdir -p tests/integration
mkdir -p tests/unit
mv e2e/* tests/e2e/
mv test/* tests/integration/
rm -rf e2e/ test/
```

### 2. 중복 파일 확인 및 제거
- `server/prisma/` vs `prisma/` - 하나로 통합
- 여러 테스트 설정 파일들 통합

### 3. 최종 권장 구조
```
glimpse-monorepo/
├── mobile/          # React Native 앱
├── server/          # NestJS 백엔드
├── shared/          # 공통 코드
├── web/             # Next.js 대시보드
├── docs/            # 모든 문서
├── tests/           # 통합된 테스트
├── scripts/         # 유틸리티 스크립트
├── docker/          # Docker 설정
├── monitoring/      # 모니터링 설정
├── nginx/           # 웹서버 설정
├── prisma/          # DB 스키마
├── config/          # 환경 설정 예제
├── package.json     # Monorepo 설정
├── tsconfig.json    # 공통 TS 설정
├── README.md        # 프로젝트 소개
└── CLAUDE.md        # AI 가이드

```

### 4. 불필요한 파일/폴더
- `playwright-report/` - .gitignore에 추가
- `test-results/` - .gitignore에 추가
- 중복된 prisma 폴더
- root의 mobile 전용 설정 파일들

### 5. 설정 파일 통합
- ESLint 설정: root에 하나, 각 workspace에서 extend
- Prettier 설정: root에 하나만
- TypeScript 설정: root 기본 + 각 workspace에서 extend

## 실행 스크립트

```bash
# 정리 스크립트
#!/bin/bash

# 1. Mobile 파일 이동
echo "Moving mobile-specific files..."
mv babel.config.js mobile/
mv metro.config.js mobile/
mv assets/* mobile/assets/

# 2. 문서 정리
echo "Organizing documentation..."
mv CONFIG_FILES.md docs/development/
mv CONTRIBUTING.md docs/
mv E2E_TEST_VERIFICATION_REPORT.md docs/deployment/

# 3. 테스트 통합
echo "Consolidating test directories..."
mkdir -p tests/e2e
mkdir -p tests/integration
mv e2e/* tests/e2e/
mv test/* tests/integration/
rmdir e2e/ test/

# 4. 정리 완료
echo "Cleanup complete!"
```