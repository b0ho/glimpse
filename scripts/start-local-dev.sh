#!/bin/bash

# ============================================
# Glimpse 로컬 개발 환경 시작 스크립트 (빠른 시작)
# ============================================
# 이미 설정된 환경을 빠르게 시작하는 스크립트
# - 기존 서비스는 종료하지 않음
# - Docker 컨테이너가 없으면 시작
# - 서버와 앱만 재시작
# ===== =======================================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 프로젝트 루트 디렉토리 설정
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🚀 Glimpse 로컬 개발 환경 시작${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. Docker 상태 확인
echo -e "${YELLOW}📋 Step 1: Docker 컨테이너 확인${NC}"

# Docker 실행 확인
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker가 실행되지 않습니다. Docker Desktop을 시작해주세요.${NC}"
    exit 1
fi

# PostgreSQL 확인 및 시작
if ! docker ps | grep -q "glimpse-postgres-dev"; then
    if docker ps -a | grep -q "glimpse-postgres-dev"; then
        echo "PostgreSQL 컨테이너 시작 중..."
        docker start glimpse-postgres-dev
    else
        echo -e "${YELLOW}PostgreSQL 컨테이너가 없습니다. init-local-dev.sh를 먼저 실행하세요.${NC}"
        echo -e "${BLUE}실행: ./scripts/init-local-dev.sh${NC}"
        exit 1
    fi
else
    echo "✅ PostgreSQL 이미 실행 중"
fi

# Redis 확인 및 시작
if ! docker ps | grep -q "glimpse-redis-dev"; then
    if docker ps -a | grep -q "glimpse-redis-dev"; then
        echo "Redis 컨테이너 시작 중..."
        docker start glimpse-redis-dev
    else
        echo -e "${YELLOW}Redis 컨테이너가 없습니다. init-local-dev.sh를 먼저 실행하세요.${NC}"
        echo -e "${BLUE}실행: ./scripts/init-local-dev.sh${NC}"
        exit 1
    fi
else
    echo "✅ Redis 이미 실행 중"
fi

# 컨테이너 준비 대기
echo "컨테이너 준비 대기 중..."
sleep 3

echo -e "${GREEN}✅ Docker 컨테이너 준비 완료${NC}"
echo ""

# 2. 서버 상태 확인 및 시작
echo -e "${YELLOW}📋 Step 2: NestJS 서버 확인${NC}"

# 서버가 이미 실행 중인지 확인
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ 서버가 이미 실행 중입니다."
    echo "   서버를 재시작하시겠습니까? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "서버 재시작 중..."
        lsof -ti:3001 | xargs kill -9 2>/dev/null || true
        sleep 2
        cd "$PROJECT_ROOT/server"
        npm run dev > ../server.log 2>&1 &
        SERVER_PID=$!
        
        # 서버 시작 대기
        for i in {1..30}; do
            if curl -s http://localhost:3001/health > /dev/null 2>&1; then
                echo -e "${GREEN}✅ 서버 재시작 완료${NC}"
                break
            fi
            sleep 1
        done
    else
        SERVER_PID=$(lsof -ti:3001 | head -1)
    fi
else
    echo "서버 시작 중..."
    cd "$PROJECT_ROOT/server"
    
    # Prisma Client 확인
    if [ ! -d "../node_modules/@prisma/client" ]; then
        echo "Prisma Client 생성 중..."
        npx prisma generate
    fi
    
    npm run dev > ../server.log 2>&1 &
    SERVER_PID=$!
    
    # 서버 시작 대기
    echo "서버 시작 대기 중..."
    for i in {1..30}; do
        if curl -s http://localhost:3001/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ 서버 시작 완료${NC}"
            echo "   URL: http://localhost:3001"
            echo "   API Docs: http://localhost:3001/docs"
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ 서버 시작 실패. server.log를 확인하세요.${NC}"
            exit 1
        fi
        sleep 1
    done
fi
echo ""

# 3. Mobile 앱 상태 확인 및 시작
echo -e "${YELLOW}📋 Step 3: Mobile 웹 앱 확인${NC}"

# Mobile 앱이 이미 실행 중인지 확인
if curl -s http://localhost:8081 | grep -q "<title>Glimpse</title>" 2>/dev/null; then
    echo "✅ Mobile 앱이 이미 실행 중입니다."
    echo "   앱을 재시작하시겠습니까? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "Mobile 앱 재시작 중..."
        lsof -ti:8081 | xargs kill -9 2>/dev/null || true
        lsof -ti:8082 | xargs kill -9 2>/dev/null || true
        sleep 2
        cd "$PROJECT_ROOT/mobile"
        npx expo start --web --clear > ../mobile.log 2>&1 &
        MOBILE_PID=$!
        
        # 앱 시작 대기
        for i in {1..60}; do
            if curl -s http://localhost:8081 | grep -q "<title>Glimpse</title>" 2>/dev/null; then
                echo -e "${GREEN}✅ Mobile 앱 재시작 완료${NC}"
                break
            fi
            sleep 1
        done
    else
        MOBILE_PID=$(lsof -ti:8081 | head -1)
    fi
else
    echo "Mobile 앱 시작 중..."
    cd "$PROJECT_ROOT/mobile"
    
    # Icon 컴포넌트 import 문제 확인 및 수정
    if grep -q "import Icon from '@/components/IconWrapper'" navigation/AppNavigator.tsx 2>/dev/null; then
        echo "Icon import 수정 중..."
        sed -i '' "s/import Icon from '@\/components\/IconWrapper'/import { IconWrapper as Icon } from '@\/components\/IconWrapper'/" navigation/AppNavigator.tsx
    fi
    
    npx expo start --web --clear > ../mobile.log 2>&1 &
    MOBILE_PID=$!
    
    # Mobile 앱 시작 대기
    echo "Mobile 앱 시작 대기 중..."
    for i in {1..60}; do
        if curl -s http://localhost:8081 | grep -q "<title>Glimpse</title>" 2>/dev/null; then
            echo -e "${GREEN}✅ Mobile 웹 앱 시작 완료${NC}"
            echo "   URL: http://localhost:8081"
            break
        fi
        if [ $i -eq 60 ]; then
            echo -e "${RED}❌ Mobile 앱 시작 실패. mobile.log를 확인하세요.${NC}"
            exit 1
        fi
        sleep 1
    done
fi
echo ""

# 4. 상태 요약
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 서비스 상태${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}✅ 모든 서비스가 실행 중입니다!${NC}"
echo ""
echo "• PostgreSQL: localhost:5432"
echo "• Redis: localhost:6379"
echo "• NestJS Server: http://localhost:3001"
echo "• Mobile Web App: http://localhost:8081"
echo ""
echo -e "${BLUE}📱 브라우저에서 http://localhost:8081 을 열어 테스트하세요.${NC}"
echo ""
echo -e "${YELLOW}💡 팁:${NC}"
echo "• 로그 확인: tail -f server.log 또는 tail -f mobile.log"
echo "• 종료: ./scripts/stop-local-dev.sh"
echo "• 완전 초기화: ./scripts/reset-local-dev.sh"
echo ""

# 프로세스 ID 저장
echo "$SERVER_PID" > .server.pid
echo "$MOBILE_PID" > .mobile.pid

# Ctrl+C 처리
trap 'echo -e "\n${YELLOW}종료하려면 ./scripts/stop-local-dev.sh를 실행하세요.${NC}"; exit' INT TERM

# 프로세스 유지
echo -e "${YELLOW}서비스가 백그라운드에서 실행 중입니다.${NC}"
echo -e "${YELLOW}이 터미널을 닫아도 서비스는 계속 실행됩니다.${NC}"
echo ""

# 로그 확인 옵션
echo "실시간 로그를 보시겠습니까? (y/N)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "${YELLOW}로그 모니터링 중... (Ctrl+C로 종료)${NC}"
    tail -f server.log mobile.log
fi