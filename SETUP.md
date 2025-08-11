# Glimpse 로컬 개발 환경 설정 가이드

## 🚀 빠른 시작 (Quick Start)

새로운 PC에서 프로젝트를 클론한 후 다음 명령어를 실행하세요:

```bash
# 1. 프로젝트 클론
git clone [repository-url]
cd glimpse

# 2. 의존성 설치
npm install

# 3. 개발 환경 초기화 (처음 한 번만)
./scripts/init-local-dev.sh

# 4. 개발 서버 시작
npm run dev
```

## 📋 환경 설정 상세

### 1. 필수 요구사항

- **Node.js**: 18.x 이상
- **npm**: 9.x 이상
- **Docker Desktop**: 최신 버전
- **운영체제**: macOS, Linux, Windows (WSL2)

### 2. 데이터베이스 설정

프로젝트는 다음 데이터베이스 설정을 사용합니다:

```
Host: localhost
Port: 5432
Database: glimpse_dev
Username: postgres
Password: postgres
```

### 3. 스크립트 설명

#### `init-local-dev.sh`
- **용도**: 처음 환경을 설정할 때 사용
- **수행 작업**:
  - Docker 컨테이너 생성 (PostgreSQL, Redis)
  - 데이터베이스 스키마 적용
  - .env 파일 자동 생성
  - 개발 서버 시작

#### `start-local-dev.sh`
- **용도**: 일상적인 개발 시작
- **수행 작업**:
  - Docker 컨테이너 시작
  - 개발 서버 시작
  - 포트 충돌 확인

#### `reset-local-dev.sh`
- **용도**: 문제 발생 시 완전 초기화
- **수행 작업**:
  - 모든 컨테이너 삭제 및 재생성
  - 데이터베이스 완전 초기화
  - 목데이터 및 시드 데이터 추가
  - node_modules 재설치 (선택적)

### 4. 환경 변수 (.env)

서버의 `.env` 파일은 자동으로 생성됩니다. 필요한 경우 다음 위치의 파일을 수정하세요:

- `server/.env` - 실제 환경 변수
- `server/.env.example` - 환경 변수 템플릿

### 5. 포트 사용

| 서비스 | 포트 | 설명 |
|--------|------|------|
| NestJS Server | 3001 | 백엔드 API 서버 |
| Expo Web | 8081 | 웹 버전 개발 서버 |
| Expo Metro | 8082 | React Native 번들러 |
| PostgreSQL | 5432 | 데이터베이스 |
| Redis | 6379 | 캐시 및 세션 |

### 6. 테스트 계정

개발 환경에서 사용 가능한 테스트 계정:

```
일반 사용자:
- Phone: +821012345678 ~ +821089012345
- Password: password123

관리자:
- Phone: +821000000000
- Password: admin123
```

## 🔧 문제 해결

### Docker 관련 오류

```bash
# Docker가 실행되지 않는 경우
# Docker Desktop을 시작하고 다시 시도

# 컨테이너 충돌 시
docker rm -f glimpse-postgres-dev glimpse-redis-dev
./scripts/init-local-dev.sh
```

### 포트 충돌

```bash
# 포트 사용 중인 프로세스 확인
lsof -i :3001
lsof -i :5432

# 프로세스 종료
kill -9 [PID]
```

### 데이터베이스 연결 오류

```bash
# .env 파일 확인
cat server/.env | grep DATABASE_URL

# 올바른 값인지 확인
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/glimpse_dev?schema=public"

# 데이터베이스 재초기화
./scripts/reset-local-dev.sh
```

### npm 관련 오류

```bash
# 캐시 정리
npm cache clean --force

# node_modules 재설치
rm -rf node_modules package-lock.json
rm -rf server/node_modules mobile/node_modules
npm install
```

## 📝 추가 정보

### 개발 모드 특징

- **Hot Reload**: 코드 변경 시 자동 재시작
- **개발 인증**: `x-dev-auth: true` 헤더로 간편 인증
- **목데이터**: 테스트용 사용자, 그룹, 매칭 데이터 자동 생성
- **디버그 로그**: 상세한 로그 출력

### 프로덕션 배포 시 주의사항

프로덕션 환경에서는 다음 설정을 변경해야 합니다:

1. 데이터베이스 자격 증명 변경
2. JWT_SECRET 변경
3. USE_DEV_AUTH=false 설정
4. 실제 API 키 설정 (AWS, Firebase, Payment 등)

## 🤝 기여하기

1. 이 저장소를 Fork
2. Feature 브랜치 생성 (`git checkout -b feature/AmazingFeature`)
3. 변경사항 커밋 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 Push (`git push origin feature/AmazingFeature`)
5. Pull Request 생성

## 📧 문의

문제가 지속되면 다음으로 연락주세요:
- Issue Tracker: [GitHub Issues]
- Email: dev@glimpse.app