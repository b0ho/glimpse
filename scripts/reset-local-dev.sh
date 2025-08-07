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
echo "  • 데이터베이스 완전 초기화"
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
    -e POSTGRES_USER=glimpse \
    -e POSTGRES_PASSWORD=glimpse123 \
    -e POSTGRES_DB=glimpse_dev \
    -p 5432:5432 \
    --health-cmd="pg_isready -U glimpse" \
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
echo -e "${GREEN}✅ 리셋 완료!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}이제 다음 명령으로 개발 환경을 시작할 수 있습니다:${NC}"
echo "  ./scripts/start-local-dev.sh"
echo ""