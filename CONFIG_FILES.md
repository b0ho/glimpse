# 프로젝트 설정 파일 구조

## 루트 디렉토리 설정 파일

### 환경 변수
- `.env` - 로컬 개발 환경 변수 (Git 제외)
- `config/env-examples/` - 환경 변수 예제 파일들
  - `.env.example` - 개발 환경 예제
  - `.env.docker.example` - Docker 환경 예제
  - `.env.production.example` - 프로덕션 환경 예제

### 코드 품질 도구
- `.eslintrc.js` / `eslint.config.js` - ESLint 설정
- `.prettierrc.js` - Prettier 코드 포맷터 설정
- `.prettierignore` - Prettier 제외 파일

### Git 설정
- `.gitignore` - Git 제외 파일
- `.github/` - GitHub Actions 및 설정

### 프로젝트 설정
- `package.json` - 프로젝트 메타데이터 및 스크립트
- `tsconfig.json` - TypeScript 컴파일러 설정

### React Native 설정 (모노레포 루트에 위치)
- `babel.config.js` - Babel 트랜스파일러 설정
- `metro.config.js` - Metro 번들러 설정

### 기타
- `.expo/` - Expo 캐시 및 설정 (자동 생성)
- `.idea/` - IntelliJ IDEA 설정 (Git 제외 권장)
- `.claude/` - Claude AI 설정
- `CLAUDE.md` - Claude AI를 위한 프로젝트 가이드

## 서브 디렉토리 설정 파일

### mobile/
- `app.json` - Expo 앱 설정
- `jest.config.js` - Jest 테스트 설정
- `tsconfig.json` - 모바일 앱 TypeScript 설정

### server/
- `jest.config.js` - 서버 테스트 설정
- `tsconfig.json` - 서버 TypeScript 설정

### web/
- `next.config.ts` - Next.js 설정
- `tsconfig.json` - 웹 TypeScript 설정
- `postcss.config.mjs` - PostCSS 설정
- `components.json` - shadcn/ui 컴포넌트 설정

### tests/
- `playwright.config.ts` - Playwright E2E 테스트 설정

## 설정 파일 관리 가이드

### 1. 환경 변수
- 민감한 정보는 절대 커밋하지 않기
- 새 환경 변수 추가 시 예제 파일 업데이트
- 환경별로 다른 값 사용 (.env.development, .env.production)

### 2. 코드 품질
- ESLint와 Prettier 설정은 팀 전체가 공유
- VS Code 사용 시 확장 프로그램 설치 권장
- pre-commit 훅으로 자동 검사

### 3. TypeScript
- 루트 tsconfig.json은 공통 설정
- 각 패키지는 자체 tsconfig.json으로 확장
- strict 모드 사용 권장

### 4. 모노레포 관리
- 워크스페이스별 package.json 관리
- 공통 의존성은 루트에 설치
- 패키지별 스크립트는 루트에서 실행 가능