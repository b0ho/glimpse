#!/bin/bash

# ============================================
# Glimpse 로컬 개발 환경 종료 스크립트
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

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🛑 Glimpse 로컬 개발 환경 종료${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. 서버 프로세스 종료
echo -e "${YELLOW}📋 서버 프로세스 종료 중...${NC}"

# PID 파일에서 프로세스 종료
if [ -f .server.pid ]; then
    SERVER_PID=$(cat .server.pid)
    kill $SERVER_PID 2>/dev/null || true
    rm .server.pid
fi

if [ -f .mobile.pid ]; then
    MOBILE_PID=$(cat .mobile.pid)
    kill $MOBILE_PID 2>/dev/null || true
    rm .mobile.pid
fi

# 포트 기반 프로세스 종료
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:8081 | xargs kill -9 2>/dev/null || true
lsof -ti:8082 | xargs kill -9 2>/dev/null || true

echo -e "${GREEN}✅ 서버 프로세스 종료 완료${NC}"
echo ""

# 2. Docker 컨테이너 중지 (선택적)
echo -e "${YELLOW}Docker 컨테이너를 중지하시겠습니까? (y/N)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Docker 컨테이너 중지 중..."
    docker stop glimpse-postgres-dev 2>/dev/null || true
    docker stop glimpse-redis-dev 2>/dev/null || true
    echo -e "${GREEN}✅ Docker 컨테이너 중지 완료${NC}"
else
    echo "Docker 컨테이너는 계속 실행됩니다."
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ 로컬 개발 환경이 종료되었습니다.${NC}"
echo -e "${GREEN}========================================${NC}"