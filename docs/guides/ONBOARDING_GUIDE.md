# Glimpse 신규 개발자 온보딩 가이드

## 👋 환영합니다!

Glimpse 개발팀에 오신 것을 환영합니다! 이 가이드는 새로운 개발자가 프로젝트에 빠르게 적응하고 생산적으로 기여할 수 있도록 돕기 위해 작성되었습니다.

## 📚 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [개발 환경 설정](#개발-환경-설정)
3. [코드베이스 이해하기](#코드베이스-이해하기)
4. [개발 워크플로우](#개발-워크플로우)
5. [주요 기술 스택](#주요-기술-스택)
6. [첫 번째 작업](#첫-번째-작업)
7. [팀 문화와 규칙](#팀-문화와-규칙)
8. [유용한 리소스](#유용한-리소스)

## 🎯 프로젝트 개요

### Glimpse란?
Glimpse는 **익명성과 프라이버시**를 중시하는 한국형 데이팅 앱입니다. 회사, 대학교, 취미 그룹 기반의 매칭 시스템을 통해 안전하고 신뢰할 수 있는 만남을 제공합니다.

### 핵심 가치
- **프라이버시 우선**: 상호 관심 표현 전까지 완전한 익명성 보장
- **그룹 기반 매칭**: 공통 소속감을 통한 신뢰도 향상
- **한국 시장 최적화**: 한국 문화와 사용자 경험에 맞춘 설계

### 비즈니스 모델
- **무료 사용자**: 일일 1회 좋아요 + 크레딧 구매
- **프리미엄 구독**: 월 ₩9,900 / 연 ₩99,000
- **크레딧 팩**: ₩2,500 ~ ₩19,000

## 🛠 개발 환경 설정

### 1. 필수 도구 설치

```bash
# Node.js 20+ 설치 (nvm 사용 권장)
nvm install 20
nvm use 20

# 전역 도구 설치
npm install -g expo-cli@latest
npm install -g eas-cli@latest

# PostgreSQL 14+ 설치
# macOS
brew install postgresql@14
brew services start postgresql@14

# Ubuntu
sudo apt update
sudo apt install postgresql-14

# Redis 설치
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt install redis-server
```

### 2. 프로젝트 클론 및 설정

```bash
# 저장소 클론
git clone https://github.com/glimpse-app/glimpse-fe.git
cd glimpse-fe

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 편집하여 필요한 값 설정
```

### 3. 외부 서비스 계정 설정

다음 서비스들의 개발 계정이 필요합니다:

1. **Clerk** (인증)
   - https://dashboard.clerk.com 에서 개발 앱 생성
   - Publishable Key와 Secret Key 복사

2. **AWS** (S3, SES)
   - IAM 사용자 생성 및 Access Key 발급
   - S3 버킷 생성 (개발용)

3. **Stripe** (결제 - 선택사항)
   - 테스트 모드 API 키 발급

4. **Firebase** (푸시 알림 - 선택사항)
   - 프로젝트 생성 및 서비스 계정 키 다운로드

### 4. 데이터베이스 초기화

```bash
# 데이터베이스 생성
createdb glimpse_dev

# Prisma 마이그레이션 실행
npm run db:migrate

# 시드 데이터 생성
npm run db:seed

# Prisma Studio 실행 (데이터베이스 GUI)
npm run db:studio
```

### 5. 개발 서버 실행

```bash
# 모든 서비스 동시 실행 (권장)
npm run dev

# 또는 개별 실행
npm run dev:server  # 백엔드 서버
npm run dev:mobile  # 모바일 앱
```

## 📁 코드베이스 이해하기

### 프로젝트 구조

```
glimpse-fe/
├── mobile/          # React Native 모바일 앱
│   ├── components/  # 재사용 가능한 UI 컴포넌트
│   ├── screens/     # 화면별 컴포넌트
│   ├── services/    # API 통신 및 외부 서비스
│   ├── store/       # Zustand 상태 관리
│   └── utils/       # 유틸리티 함수
├── server/          # Node.js 백엔드 서버
│   ├── src/
│   │   ├── controllers/  # API 엔드포인트
│   │   ├── services/     # 비즈니스 로직
│   │   ├── middleware/   # Express 미들웨어
│   │   └── routes/       # 라우트 정의
│   └── prisma/      # 데이터베이스 스키마
├── shared/          # 공유 타입 및 상수
│   ├── types/       # TypeScript 인터페이스
│   └── constants/   # 공통 상수
└── docs/            # 프로젝트 문서
```

### 주요 파일 설명

| 파일 | 설명 |
|------|------|
| `CLAUDE.md` | AI 어시스턴트를 위한 프로젝트 컨텍스트 |
| `server/prisma/schema.prisma` | 데이터베이스 스키마 정의 |
| `mobile/App.tsx` | 모바일 앱 진입점 |
| `server/src/index.ts` | 서버 진입점 |
| `shared/types/index.ts` | 프론트엔드-백엔드 공유 타입 |

### 데이터 플로우

```
사용자 액션 (Mobile)
    ↓
API 서비스 호출 (mobile/services/)
    ↓
HTTP 요청 (with JWT)
    ↓
Express 라우터 (server/routes/)
    ↓
컨트롤러 (server/controllers/)
    ↓
서비스 레이어 (server/services/)
    ↓
Prisma ORM (데이터베이스)
```

## 💻 개발 워크플로우

### 1. 브랜치 전략

```bash
main
├── develop              # 개발 통합 브랜치
│   ├── feature/user-profile   # 기능 개발
│   ├── fix/chat-bug          # 버그 수정
│   └── refactor/api-service  # 리팩토링
└── release/v1.2.0      # 릴리스 준비
```

### 2. 커밋 컨벤션

```bash
# 형식: <type>(<scope>): <subject>

feat(auth): 카카오 로그인 기능 추가
fix(chat): 메시지 전송 실패 버그 수정
docs(api): WebSocket 이벤트 문서 업데이트
style(mobile): 코드 포맷팅 적용
refactor(server): 사용자 서비스 구조 개선
test(matching): 매칭 알고리즘 테스트 추가
chore(deps): 의존성 업데이트
```

### 3. 개발 프로세스

1. **이슈 생성**: GitHub Issues에서 작업 내용 정의
2. **브랜치 생성**: `feature/issue-번호-설명` 형식
3. **개발 및 테스트**: 로컬에서 개발 및 테스트
4. **PR 생성**: 코드 리뷰를 위한 Pull Request
5. **코드 리뷰**: 최소 1명의 리뷰어 승인 필요
6. **머지**: develop 브랜치로 머지

### 4. 코드 품질 관리

```bash
# 타입 체크
npm run typecheck

# 린트 실행
npm run lint

# 테스트 실행
npm test

# 포맷팅
npm run format

# 모든 검사 실행 (PR 전 필수)
npm run pre-commit
```

## 🔧 주요 기술 스택

### Frontend (Mobile)
- **React Native + Expo**: 크로스 플랫폼 모바일 개발
- **TypeScript**: 타입 안정성
- **Zustand**: 상태 관리
- **React Query**: 서버 상태 관리
- **Socket.IO Client**: 실시간 통신

### Backend (Server)
- **Node.js + Express**: 서버 프레임워크
- **TypeScript**: 타입 안정성
- **Prisma**: ORM
- **Socket.IO**: WebSocket 서버
- **JWT**: 인증 토큰

### Infrastructure
- **PostgreSQL**: 메인 데이터베이스
- **Redis**: 캐싱 및 세션
- **AWS S3**: 파일 스토리지
- **Docker**: 컨테이너화

## 🚀 첫 번째 작업

### 시작하기 좋은 이슈들

1. **Good First Issue** 라벨이 붙은 이슈들
2. 문서 개선
3. 테스트 코드 추가
4. 작은 버그 수정

### 예제: 간단한 기능 추가하기

```typescript
// 1. 공유 타입 정의 (shared/types/index.ts)
export interface UserPreference {
  notifications: boolean;
  language: 'ko' | 'en';
}

// 2. API 엔드포인트 추가 (server/src/controllers/UserController.ts)
export class UserController {
  async updatePreferences(req: Request, res: Response) {
    const { userId } = req.user;
    const preferences: UserPreference = req.body;
    
    const updated = await userService.updatePreferences(userId, preferences);
    res.json({ success: true, data: updated });
  }
}

// 3. 프론트엔드 서비스 추가 (mobile/services/userService.ts)
export const updatePreferences = async (preferences: UserPreference) => {
  const response = await api.put('/users/preferences', preferences);
  return response.data;
};
```

## 👥 팀 문화와 규칙

### 커뮤니케이션
- **Slack**: 일상적인 소통 (#dev-general)
- **GitHub**: 코드 리뷰 및 기술 토론
- **주간 미팅**: 매주 월요일 10시 스프린트 계획
- **데일리 스탠드업**: 매일 오전 10시 (선택)

### 코드 리뷰 문화
- 건설적이고 친절한 피드백
- "왜"를 설명하는 리뷰
- 작은 PR 선호 (500줄 이하)
- 24시간 내 리뷰 응답

### 개발 원칙
1. **타입 안정성**: TypeScript strict mode 사용
2. **테스트 우선**: 중요 로직은 테스트 필수
3. **문서화**: 복잡한 로직은 주석 추가
4. **성능 고려**: 특히 모바일 환경
5. **보안 우선**: 사용자 데이터 보호

## 📖 유용한 리소스

### 내부 문서
- [API 문서](./API_DOCUMENTATION.md)
- [데이터베이스 스키마](../server/prisma/schema.prisma)
- [테스트 가이드](./TESTING_GUIDE.md)
- [배포 가이드](./DEPLOYMENT_GUIDE.md)

### 외부 리소스
- [React Native 공식 문서](https://reactnative.dev/)
- [Expo 문서](https://docs.expo.dev/)
- [Prisma 문서](https://www.prisma.io/docs/)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/handbook/)

### 팀 연락처
- **Tech Lead**: tech-lead@glimpse.kr
- **DevOps**: devops@glimpse.kr
- **긴급 연락**: #dev-emergency (Slack)

## ✅ 온보딩 체크리스트

### Day 1
- [ ] 팀 소개 및 환영
- [ ] 개발 환경 설정 완료
- [ ] 저장소 접근 권한 확인
- [ ] Slack 및 GitHub 팀 초대

### Week 1
- [ ] 코드베이스 전체 구조 파악
- [ ] 로컬에서 앱 실행 성공
- [ ] 첫 번째 PR 생성
- [ ] 코드 리뷰 참여

### Month 1
- [ ] 주요 기능 하나 구현
- [ ] 버그 3개 이상 수정
- [ ] 테스트 코드 작성
- [ ] 문서 개선 기여

## 🎉 마무리

Glimpse 팀의 일원이 되신 것을 다시 한 번 환영합니다! 궁금한 점이 있으면 언제든지 팀에게 질문해주세요. 함께 훌륭한 제품을 만들어갑시다!

**Happy Coding! 🚀**