# Glimpse 프로젝트 문서

## 📚 문서 구조

Glimpse 프로젝트의 모든 문서는 다음과 같이 구성되어 있습니다:

```
docs/
├── PROJECT_OVERVIEW.md      # 프로젝트 전체 개요
├── requirements.md          # 프로젝트 요구사항 명세
│
├── guides/                  # 개발 및 운영 가이드
│   ├── DEVELOPMENT_GUIDE.md # 개발 환경 설정
│   ├── DEPLOYMENT_GUIDE.md  # 배포 가이드
│   ├── SECURITY_GUIDE.md    # 보안 가이드
│   ├── security-checklist.md # 보안 체크리스트
│   ├── PROJECT_OPTIMIZATION.md # 프로젝트 최적화
│   ├── OPTIMIZATION_SUMMARY.md # 최적화 요약
│   └── CRITICAL_IMPROVEMENTS_NEEDED.md # 개선 필요사항
│
├── api/                     # API 관련 문서
│   ├── API_DOCUMENTATION.md # 전체 API 문서
│   └── INSTANT_MEETING_API.md # 즉석 모임 API
│
├── architecture/            # 아키텍처 및 설계
│   ├── ARCHITECTURE.md      # 시스템 아키텍처
│   ├── ANONYMOUS_PROFILE_SYSTEM.md # 익명 프로필 시스템
│   ├── FIGMA_DESIGN_SYSTEM.md # Figma 디자인 시스템
│   ├── FIGMA_STRUCTURE.md   # Figma 구조
│   ├── figma-screens.json   # Figma 화면 정의
│   ├── figma-tokens.json    # Figma 토큰
│   └── figma-component-generator.js # 컴포넌트 생성기
│
├── features/                # 기능 명세
│   ├── USER_STORIES.md      # 사용자 스토리
│   ├── USER_SCENARIOS.md    # 사용자 시나리오
│   ├── SCREEN_SPECIFICATIONS.md # 화면 명세
│   ├── FEATURE_MATCHING_ALGORITHM.md # 매칭 알고리즘
│   ├── INSTANT_MEETING_FEATURE.md # 즉석 모임 기능
│   ├── INSTANT_MEETING_REVISED.md # 즉석 모임 개정판
│   ├── INSTANT_MEETING_AUTO_MATCH.md # 자동 매칭
│   └── INSTANT_MEETING_UI_DESIGN.md # UI 디자인
│
├── deployment/              # 배포 관련
│   ├── DEPLOYMENT.md        # 배포 프로세스
│   ├── MONITORING.md        # 모니터링 설정
│   └── TEST_RESULTS.md      # 테스트 결과
│
└── development/             # 개발 규칙
    └── rules/              # 기술별 개발 규칙
        ├── react-native.md
        ├── typescript.md
        ├── express.md
        ├── prisma.mdc
        └── ...
```

## 🎯 주요 문서 가이드

### 시작하기

1. **[프로젝트 개요](./PROJECT_OVERVIEW.md)** - Glimpse가 무엇인지, 왜 만들어졌는지 이해
2. **[개발 가이드](./guides/DEVELOPMENT_GUIDE.md)** - 개발 환경 설정 방법
3. **[요구사항 명세](./requirements.md)** - 프로젝트의 상세 요구사항

### 개발자를 위한 문서

- **[API 문서](./api/API_DOCUMENTATION.md)** - 모든 API 엔드포인트 상세 설명
- **[아키텍처](./architecture/ARCHITECTURE.md)** - 시스템 설계 및 구조
- **[사용자 스토리](./features/USER_STORIES.md)** - 주요 사용자 시나리오
- **[보안 가이드](./guides/SECURITY_GUIDE.md)** - 보안 구현 가이드

### 운영자를 위한 문서

- **[배포 가이드](./guides/DEPLOYMENT_GUIDE.md)** - 프로덕션 배포 방법
- **[모니터링](./deployment/MONITORING.md)** - 시스템 모니터링 설정
- **[보안 체크리스트](./guides/security-checklist.md)** - 보안 점검 사항

### 기획자/디자이너를 위한 문서

- **[사용자 시나리오](./features/USER_SCENARIOS.md)** - 상세 사용자 플로우
- **[화면 명세](./features/SCREEN_SPECIFICATIONS.md)** - 모든 화면 상세 설명
- **[디자인 시스템](./architecture/FIGMA_DESIGN_SYSTEM.md)** - Figma 디자인 가이드

## 🔍 문서 검색 가이드

### 특정 기능을 찾고 있다면

- **인증/로그인**: [API 문서](./api/API_DOCUMENTATION.md#인증-api) > 인증 API
- **매칭 시스템**: [매칭 알고리즘](./features/FEATURE_MATCHING_ALGORITHM.md)
- **즉석 모임**: [즉석 모임 기능](./features/INSTANT_MEETING_FEATURE.md)
- **결제 시스템**: [API 문서](./api/API_DOCUMENTATION.md#프리미엄--결제-api) > 결제 API

### 기술 스택별 가이드

- **React Native**: [개발 규칙](../rules/react-native.md)
- **TypeScript**: [개발 규칙](../rules/typescript.md)
- **Express.js**: [개발 규칙](../rules/express.md)
- **Prisma**: [개발 규칙](../rules/prisma.mdc)

## 📝 문서 작성 규칙

### 1. 파일명 규칙
- 대문자와 언더스코어 사용: `FEATURE_NAME.md`
- 가이드 문서는 `_GUIDE` 접미사 사용
- API 문서는 `_API` 접미사 사용

### 2. 문서 구조
- 제목: `# 문서 제목`
- 개요: 문서의 목적과 대상 독자 명시
- 목차: 긴 문서의 경우 목차 포함
- 본문: 논리적 순서로 구성
- 예시: 실제 코드나 사용 예시 포함

### 3. 마크다운 스타일
- 제목은 `#`로 계층 구분
- 코드는 ` ``` ` 블록 사용
- 중요 내용은 **굵은 글씨**
- 링크는 상대 경로 사용

## 🔄 문서 업데이트

문서는 다음과 같은 경우 업데이트되어야 합니다:

1. **새로운 기능 추가**: features/ 폴더에 문서 추가
2. **API 변경**: API_DOCUMENTATION.md 업데이트
3. **아키텍처 변경**: ARCHITECTURE.md 업데이트
4. **배포 프로세스 변경**: DEPLOYMENT_GUIDE.md 업데이트

## ❓ 도움이 필요하신가요?

- **Slack**: #glimpse-dev 채널
- **Email**: dev@glimpse.kr
- **GitHub Issues**: 문서 관련 이슈 제보

---

*마지막 업데이트: 2025년 1월 31일*