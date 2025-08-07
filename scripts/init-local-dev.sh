#!/bin/bash

# ============================================
# Glimpse 로컬 개발 환경 초기화 스크립트
# ============================================
# 처음 환경을 설정하거나 완전히 재설정할 때 사용
# 이 스크립트는 다음 작업을 수행합니다:
# 1. 기존 프로세스 종료
# 2. Docker 컨테이너 생성/재생성
# 3. 데이터베이스 초기화
# 4. 서버와 앱 시작
# ============================================

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 프로젝트 루트 디렉토리 설정
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🚀 Glimpse 로컬 개발 환경 구축 시작${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. 기존 프로세스 정리
echo -e "${YELLOW}📋 Step 1: 기존 프로세스 정리${NC}"
echo "기존 서버 프로세스 종료 중..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:8081 | xargs kill -9 2>/dev/null || true
lsof -ti:8082 | xargs kill -9 2>/dev/null || true
echo -e "${GREEN}✅ 프로세스 정리 완료${NC}"
echo ""

# 2. Docker 컨테이너 확인 및 실행
echo -e "${YELLOW}📋 Step 2: Docker 컨테이너 실행${NC}"

# Docker 실행 확인
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker가 실행되지 않습니다. Docker Desktop을 시작해주세요.${NC}"
    exit 1
fi

# PostgreSQL 컨테이너 확인 및 실행
if docker ps | grep -q "glimpse-postgres-dev"; then
    echo "PostgreSQL 컨테이너가 이미 실행 중입니다."
else
    echo "PostgreSQL 컨테이너 시작 중..."
    docker start glimpse-postgres-dev 2>/dev/null || \
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
fi

# Redis 컨테이너 확인 및 실행
if docker ps | grep -q "glimpse-redis-dev"; then
    echo "Redis 컨테이너가 이미 실행 중입니다."
else
    echo "Redis 컨테이너 시작 중..."
    docker start glimpse-redis-dev 2>/dev/null || \
    docker run -d \
        --name glimpse-redis-dev \
        -p 6379:6379 \
        --health-cmd="redis-cli ping" \
        --health-interval=10s \
        --health-timeout=5s \
        --health-retries=5 \
        redis:7-alpine
fi

# 컨테이너 상태 확인
echo "컨테이너 health check 대기 중..."
sleep 5

# PostgreSQL 연결 확인
until docker exec glimpse-postgres-dev pg_isready -U glimpse > /dev/null 2>&1; do
    echo "PostgreSQL 시작 대기 중..."
    sleep 2
done

# Redis 연결 확인
until docker exec glimpse-redis-dev redis-cli ping > /dev/null 2>&1; do
    echo "Redis 시작 대기 중..."
    sleep 2
done

echo -e "${GREEN}✅ Docker 컨테이너 실행 완료${NC}"
echo ""

# 3. 데이터베이스 초기화
echo -e "${YELLOW}📋 Step 3: 데이터베이스 초기화${NC}"
cd "$PROJECT_ROOT/server"

# Prisma Client 생성
echo "Prisma Client 생성 중..."
npx prisma generate

# 데이터베이스 스키마 적용
echo "데이터베이스 스키마 적용 중..."
npx prisma db push --force-reset

echo -e "${GREEN}✅ 데이터베이스 초기화 완료${NC}"
echo ""

# 4. NestJS 서버 실행
echo -e "${YELLOW}📋 Step 4: NestJS 서버 실행${NC}"
echo "서버 시작 중..."
npm run dev > ../server.log 2>&1 &
SERVER_PID=$!

# 서버 시작 대기
echo "서버 시작 대기 중..."
for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ NestJS 서버 실행 완료${NC}"
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
echo ""

# 5. Mobile 앱 실행 (웹 모드)
echo -e "${YELLOW}📋 Step 5: Mobile 앱 웹 모드 실행${NC}"
cd "$PROJECT_ROOT/mobile"

# Icon 컴포넌트 import 문제 수정 (필요한 경우)
if grep -q "import Icon from '@/components/IconWrapper'" navigation/AppNavigator.tsx; then
    echo "Icon import 수정 중..."
    sed -i '' "s/import Icon from '@\/components\/IconWrapper'/import { IconWrapper as Icon } from '@\/components\/IconWrapper'/" navigation/AppNavigator.tsx
fi

echo "Mobile 앱 시작 중..."
npx expo start --web --clear > ../mobile.log 2>&1 &
MOBILE_PID=$!

# Mobile 앱 시작 대기
echo "Mobile 앱 시작 대기 중..."
for i in {1..60}; do
    if curl -s http://localhost:8081 | grep -q "<title>Glimpse</title>"; then
        echo -e "${GREEN}✅ Mobile 웹 앱 실행 완료${NC}"
        echo "   URL: http://localhost:8081"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "${RED}❌ Mobile 앱 시작 실패. mobile.log를 확인하세요.${NC}"
        exit 1
    fi
    sleep 1
done
echo ""

# 6. 최종 상태 확인
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 시스템 상태 확인${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "\n${YELLOW}Docker 컨테이너:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep glimpse || true

echo -e "\n${YELLOW}서버 Health Check:${NC}"
curl -s http://localhost:3001/health | jq '.' 2>/dev/null || echo "서버 응답 없음"

echo -e "\n${YELLOW}실행 중인 서비스:${NC}"
echo "✅ PostgreSQL: localhost:5432"
echo "✅ Redis: localhost:6379"
echo "✅ NestJS Server: http://localhost:3001"
echo "✅ Mobile Web App: http://localhost:8081"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 로컬 개발 환경 구축 완료!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}📱 브라우저에서 http://localhost:8081 을 열어 테스트하세요.${NC}"
echo ""
echo -e "${YELLOW}💡 개발 모드 기능:${NC}"
echo "   • 자동 로그인 활성화"
echo "   • 프리미엄 계정 자동 설정"
echo "   • 모든 기능 테스트 가능"
echo ""
echo -e "${YELLOW}📝 로그 확인:${NC}"
echo "   • 서버 로그: tail -f server.log"
echo "   • Mobile 로그: tail -f mobile.log"
echo ""
echo -e "${YELLOW}🛑 종료하려면:${NC}"
echo "   • Ctrl+C를 누르거나"
echo "   • ./scripts/stop-local-dev.sh 실행"
echo ""

# 프로세스 ID 저장
echo "$SERVER_PID" > .server.pid
echo "$MOBILE_PID" > .mobile.pid

# 종료 시그널 처리
trap 'echo -e "\n${YELLOW}종료 중...${NC}"; kill $SERVER_PID $MOBILE_PID 2>/dev/null; exit' INT TERM

# 프로세스 유지
wait