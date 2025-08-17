#!/bin/bash

# ============================================
# Glimpse 로컬 개발 환경 시작 스크립트 (빠른 시작)
# ============================================
# 이미 설정된 환경을 빠르게 시작하는 스크립트
# - 기존 서비스는 종료하지 않음
# - Docker 컨테이너가 없으면 시작
# - 모든 프로젝트 재시작 (server, web, admin, mobile)
# ============================================

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

# 로그 디렉토리 생성
mkdir -p logs

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

# 2. 서버 데이터베이스 마이그레이션 확인
echo -e "${YELLOW}📋 Step 2: 데이터베이스 마이그레이션 확인${NC}"

# Server DB 마이그레이션
cd "$PROJECT_ROOT/server"
if [ -f "prisma/schema.prisma" ]; then
    echo "서버 Prisma Client 확인 중..."
    if [ ! -d "node_modules/@prisma/client" ]; then
        npx prisma generate
    fi
    # 마이그레이션 필요 시 적용
    npx prisma migrate deploy 2>/dev/null || true
fi

# Admin DB 마이그레이션
cd "$PROJECT_ROOT/admin"
if [ -f "prisma/schema.prisma" ]; then
    echo "Admin Prisma Client 확인 중..."
    if [ ! -d "node_modules/@prisma/client" ]; then
        npx prisma generate
    fi
    # 마이그레이션 필요 시 적용
    npx prisma migrate deploy 2>/dev/null || true
fi

echo -e "${GREEN}✅ 데이터베이스 준비 완료${NC}"
echo ""

# 3. 서버 상태 확인 및 시작
echo -e "${YELLOW}📋 Step 3: NestJS 서버 확인${NC}"

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
        npm run dev > ../logs/server.log 2>&1 &
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
    if [ ! -d "node_modules/@prisma/client" ]; then
        echo "Prisma Client 생성 중..."
        npx prisma generate
    fi
    
    npm run dev > ../logs/server.log 2>&1 &
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
            echo -e "${RED}❌ 서버 시작 실패. logs/server.log를 확인하세요.${NC}"
            exit 1
        fi
        sleep 1
    done
fi
echo ""

# 4. Web 프로젝트 상태 확인 및 시작
echo -e "${YELLOW}📋 Step 4: Web 랜딩 페이지 확인${NC}"

# Web이 이미 실행 중인지 확인 (포트 5173 체크)
if lsof -ti:5173 > /dev/null 2>&1; then
    echo "✅ Web 랜딩 페이지가 이미 실행 중입니다."
    echo "   재시작하시겠습니까? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "Web 재시작 중..."
        lsof -ti:5173 | xargs kill -9 2>/dev/null || true
        sleep 2
        cd "$PROJECT_ROOT/web"
        npm run dev > ../logs/web.log 2>&1 &
        WEB_PID=$!
        
        # Web 시작 대기
        sleep 5
        if lsof -ti:5173 > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Web 재시작 완료${NC}"
        fi
    else
        WEB_PID=$(lsof -ti:5173 | head -1)
    fi
else
    echo "Web 랜딩 페이지 시작 중..."
    cd "$PROJECT_ROOT/web"
    
    # 의존성 확인
    if [ ! -d "node_modules" ]; then
        echo "의존성 설치 중..."
        npm install
    fi
    
    npm run dev > ../logs/web.log 2>&1 &
    WEB_PID=$!
    
    # Web 시작 대기
    sleep 5
    if lsof -ti:5173 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Web 랜딩 페이지 시작 완료${NC}"
        echo "   URL: http://localhost:5173"
    else
        echo -e "${YELLOW}⚠️ Web이 시작 중입니다. logs/web.log를 확인하세요.${NC}"
    fi
fi
echo ""

# 5. Admin 프로젝트 상태 확인 및 시작
echo -e "${YELLOW}📋 Step 5: Admin 대시보드 확인${NC}"

# Admin이 이미 실행 중인지 확인 (포트 3004 체크)
if lsof -ti:3004 > /dev/null 2>&1; then
    echo "✅ Admin 대시보드가 이미 실행 중입니다."
    echo "   재시작하시겠습니까? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "Admin 재시작 중..."
        lsof -ti:3004 | xargs kill -9 2>/dev/null || true
        sleep 2
        cd "$PROJECT_ROOT/admin"
        npm run dev > ../logs/admin.log 2>&1 &
        ADMIN_PID=$!
        
        # Admin 시작 대기
        sleep 8
        if lsof -ti:3004 > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Admin 재시작 완료${NC}"
        fi
    else
        ADMIN_PID=$(lsof -ti:3004 | head -1)
    fi
else
    echo "Admin 대시보드 시작 중..."
    cd "$PROJECT_ROOT/admin"
    
    # 의존성 확인
    if [ ! -d "node_modules" ]; then
        echo "의존성 설치 중..."
        npm install --legacy-peer-deps
    fi
    
    npm run dev > ../logs/admin.log 2>&1 &
    ADMIN_PID=$!
    
    # Admin 시작 대기
    sleep 8
    if lsof -ti:3004 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Admin 대시보드 시작 완료${NC}"
        echo "   URL: http://localhost:3004"
    else
        echo -e "${YELLOW}⚠️ Admin이 시작 중입니다. logs/admin.log를 확인하세요.${NC}"
    fi
fi
echo ""

# 6. Mobile 앱 상태 확인 및 시작
echo -e "${YELLOW}📋 Step 6: Mobile 앱 확인${NC}"

# Mobile 앱이 이미 실행 중인지 확인 (포트 8081 체크)
if lsof -ti:8081 > /dev/null 2>&1; then
    echo "✅ Mobile 앱이 이미 실행 중입니다."
    echo "   앱을 재시작하시겠습니까? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "Mobile 앱 재시작 중..."
        lsof -ti:8081 | xargs kill -9 2>/dev/null || true
        sleep 2
        cd "$PROJECT_ROOT/mobile"
        npx expo start --web > ../logs/mobile.log 2>&1 &
        MOBILE_PID=$!
        
        # 앱 시작 대기
        sleep 10
        if grep -q "Metro waiting on" ../logs/mobile.log 2>/dev/null || grep -q "Web Bundled" ../logs/mobile.log 2>/dev/null; then
            echo -e "${GREEN}✅ Mobile 앱 재시작 완료${NC}"
        fi
    else
        MOBILE_PID=$(lsof -ti:8081 | head -1)
    fi
else
    echo "Mobile 앱 시작 중..."
    cd "$PROJECT_ROOT/mobile"
    
    # 의존성 확인
    if [ ! -d "node_modules" ]; then
        echo "의존성 설치 중..."
        npm install --legacy-peer-deps
    fi
    
    npx expo start --web > ../logs/mobile.log 2>&1 &
    MOBILE_PID=$!
    
    # Mobile 앱 시작 대기
    echo "Mobile 앱 시작 대기 중..."
    sleep 10
    if grep -q "Metro waiting on" ../logs/mobile.log 2>/dev/null || grep -q "Web Bundled" ../logs/mobile.log 2>/dev/null; then
        echo -e "${GREEN}✅ Mobile 앱 시작 완료${NC}"
        echo "   Metro Bundler: http://localhost:8081"
    else
        echo -e "${YELLOW}⚠️ Mobile 앱이 시작 중입니다. logs/mobile.log를 확인하세요.${NC}"
    fi
fi
echo ""

# 7. 상태 요약
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 서비스 상태${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}✅ 모든 서비스가 실행 중입니다!${NC}"
echo ""
echo "• PostgreSQL: localhost:5432"
echo "• Redis: localhost:6379"
echo "• NestJS Server: http://localhost:3001"
echo "• Web Landing Page: http://localhost:5173"
echo "• Admin Dashboard: http://localhost:3004"
echo "• Mobile App: http://localhost:8081"
echo ""
echo -e "${BLUE}📱 접속 방법:${NC}"
echo "• 랜딩 페이지: http://localhost:5173"
echo "• 관리자 대시보드: http://localhost:3004"
echo "• 모바일 웹 앱: http://localhost:8081"
echo "• API 문서: http://localhost:3001/docs"
echo ""
echo -e "${BLUE}📱 Expo 앱 실행 방법:${NC}"
echo "• 웹: 터미널에서 'w' 키"
echo "• iOS: 터미널에서 'i' 키 (Mac만 가능)"
echo "• Android: 터미널에서 'a' 키"
echo ""
echo -e "${YELLOW}💡 팁:${NC}"
echo "• 로그 확인: tail -f logs/[서비스명].log"
echo "• 종료: ./scripts/stop-local-dev.sh"
echo "• 완전 초기화: ./scripts/reset-local-dev.sh"
echo ""

# 프로세스 ID 저장
echo "$SERVER_PID" > .server.pid
echo "$WEB_PID" > .web.pid
echo "$ADMIN_PID" > .admin.pid
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
    tail -f logs/server.log logs/web.log logs/admin.log logs/mobile.log
fi