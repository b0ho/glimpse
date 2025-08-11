#!/bin/bash

# ============================================
# Glimpse 로컬 개발 환경 리셋 스크립트
# ============================================
# 문제가 발생했을 때 완전히 초기화하는 스크립트
# ============================================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${RED}========================================${NC}"
echo -e "${RED}⚠️  Glimpse 로컬 개발 환경 완전 리셋${NC}"
echo -e "${RED}========================================${NC}"
echo ""
echo -e "${YELLOW}이 작업은 다음을 수행합니다:${NC}"
echo "  • 모든 프로세스 종료"
echo "  • Docker 컨테이너 삭제 및 재생성"
echo "  • 데이터베이스 완전 초기화 및 목데이터 추가"
echo "  • node_modules 재설치"
echo ""
echo -e "${RED}계속하시겠습니까? (y/N)${NC}"
read -r response
if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "작업이 취소되었습니다."
    exit 0
fi

# 1. 모든 프로세스 종료
echo -e "\n${YELLOW}📋 Step 1: 모든 프로세스 종료${NC}"
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:8081 | xargs kill -9 2>/dev/null || true
lsof -ti:8082 | xargs kill -9 2>/dev/null || true
rm -f .server.pid .mobile.pid
echo -e "${GREEN}✅ 프로세스 종료 완료${NC}"

# 2. Docker 컨테이너 완전 삭제
echo -e "\n${YELLOW}📋 Step 2: Docker 컨테이너 삭제${NC}"
docker stop glimpse-postgres-dev 2>/dev/null || true
docker rm glimpse-postgres-dev 2>/dev/null || true
docker stop glimpse-redis-dev 2>/dev/null || true
docker rm glimpse-redis-dev 2>/dev/null || true
echo -e "${GREEN}✅ Docker 컨테이너 삭제 완료${NC}"

# 3. Docker 컨테이너 재생성
echo -e "\n${YELLOW}📋 Step 3: Docker 컨테이너 재생성${NC}"

# PostgreSQL
docker run -d \
    --name glimpse-postgres-dev \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=glimpse_dev \
    -p 5432:5432 \
    --health-cmd="pg_isready -U postgres" \
    --health-interval=10s \
    --health-timeout=5s \
    --health-retries=5 \
    postgres:16-alpine

# Redis
docker run -d \
    --name glimpse-redis-dev \
    -p 6379:6379 \
    --health-cmd="redis-cli ping" \
    --health-interval=10s \
    --health-timeout=5s \
    --health-retries=5 \
    redis:7-alpine

echo "컨테이너 시작 대기 중..."
sleep 10
echo -e "${GREEN}✅ Docker 컨테이너 재생성 완료${NC}"

# 3-1. .env 파일 확인 및 생성
echo -e "\n${YELLOW}📋 Step 3-1: 환경 변수 설정${NC}"
cd "$PROJECT_ROOT/server"

# .env 파일이 없으면 .env.example에서 복사
if [ ! -f ".env" ]; then
    echo ".env 파일이 없습니다. .env.example을 복사합니다..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        # DATABASE_URL을 postgres/postgres로 수정
        sed -i.bak 's|postgresql://[^@]*@|postgresql://postgres:postgres@|' .env
        rm .env.bak
        echo -e "${GREEN}✅ .env 파일 생성 완료${NC}"
    else
        echo -e "${RED}❌ .env.example 파일을 찾을 수 없습니다.${NC}"
        echo "DATABASE_URL을 수동으로 설정해주세요:"
        echo "  postgresql://postgres:postgres@localhost:5432/glimpse_dev?schema=public"
    fi
fi

# 3-2. 데이터베이스 초기화 및 시드 데이터 추가
echo -e "\n${YELLOW}📋 Step 3-2: 데이터베이스 스키마 적용 및 시드 데이터 추가${NC}"

# Prisma 스키마 적용
echo "Prisma 스키마를 데이터베이스에 적용 중..."
npx prisma db push --force-reset
echo -e "${GREEN}✅ 데이터베이스 스키마 적용 완료${NC}"

# Prisma Client 생성
echo "Prisma Client 생성 중..."
npx prisma generate
echo -e "${GREEN}✅ Prisma Client 생성 완료${NC}"

# 목데이터 마이그레이션 (앱의 하드코딩된 데이터를 실제 DB로)
echo "목데이터 마이그레이션 중..."
echo "  • 앱의 하드코딩된 목데이터를 실제 데이터베이스로 이관"
echo "  • 사용자 데이터 (9명 - mockData.ts의 dummyUsers + WhoLikesYou 더미 데이터)"
echo "  • 그룹 데이터 (8개 - generateDummyGroups의 모든 그룹)"
echo "  • 좋아요 및 매칭 데이터 (상호 좋아요 + 단방향 좋아요)"
echo "  • 채팅 메시지 데이터 (초기 대화 내용)"
echo "  • 커뮤니티 포스트 (generateDummyContent 기반)"
npx tsx prisma/migrate-mockdata.ts
echo -e "${GREEN}✅ 목데이터 마이그레이션 완료${NC}"

# 회사 도메인 시드 데이터 추가
echo "회사 도메인 시드 데이터 추가 중..."
echo "  • 한국 주요 기업 도메인 (삼성, 카카오, 네이버 등)"
echo "  • 주요 대학교 도메인 (서울대, 연세대, 고려대 등)"
echo "  • 스타트업 및 컨설팅 회사 도메인"
if npm run seed:domains 2>/dev/null; then
    echo -e "${GREEN}✅ 회사 도메인 시드 데이터 추가 완료${NC}"
else
    echo -e "${YELLOW}⚠️ 회사 도메인 시드 데이터 추가 실패 (선택적)${NC}"
fi

cd "$PROJECT_ROOT"

# 4. 의존성 재설치
echo -e "\n${YELLOW}📋 Step 4: 의존성 재설치${NC}"
echo "node_modules를 재설치하시겠습니까? (시간이 오래 걸립니다) (y/N)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "node_modules 삭제 중..."
    rm -rf node_modules
    rm -rf mobile/node_modules
    rm -rf server/node_modules
    rm -rf web/node_modules
    rm -rf shared/node_modules
    
    echo "패키지 재설치 중..."
    npm install
    echo -e "${GREEN}✅ 의존성 재설치 완료${NC}"
else
    echo "의존성 재설치를 건너뜁니다."
fi

# 5. 캐시 정리
echo -e "\n${YELLOW}📋 Step 5: 캐시 정리${NC}"
rm -rf mobile/.expo
rm -rf mobile/dist
rm -rf server/dist
rm -rf web/.next
rm -f server.log mobile.log
echo -e "${GREEN}✅ 캐시 정리 완료${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ 리셋 및 데이터 초기화 완료!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}마이그레이션된 목데이터:${NC}"
echo "  • 테스트 사용자: 9명 (앱의 하드코딩된 사용자 데이터 기반)"
echo "  • 그룹: 8개 (카카오/네이버 등 공식, 독서모임/러닝크루 등 생성 그룹)"
echo "  • 좋아요 및 매칭: 7개 좋아요, 2개 매칭 (상호 좋아요 기반)"
echo "  • 채팅 메시지: 4개 (매칭된 사용자들 간 초기 대화)"
echo "  • 커뮤니티 포스트: 4개 (generateDummyContent 스타일)"
echo "  • 회사 도메인: 60+ 한국 기업 및 대학교"
echo ""
echo -e "${BLUE}이제 다음 명령으로 개발 환경을 시작할 수 있습니다:${NC}"
echo "  ./scripts/start-local-dev.sh"
echo ""
echo -e "${YELLOW}💡 테스트 계정 정보:${NC}"
echo "  • 일반 사용자: +821012345678 ~ +821089012345 (비밀번호: password123)"
echo "  • 관리자: +821000000000 (비밀번호: admin123)"
echo ""