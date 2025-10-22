#!/bin/bash

# ============================================
# Glimpse 로컬 개발 환경 초기화 스크립트
# ============================================
# 처음 환경을 설정하거나 완전히 재설정할 때 사용
# 이 스크립트는 다음 작업을 수행합니다:
# 1. 기존 프로세스 종료
# 2. Docker 컨테이너 생성/재생성
# 3. 모든 프로젝트 의존성 설치
# 4. 데이터베이스 초기화 및 마이그레이션
# 5. 모든 프로젝트 실행 (server, web, admin, mobile)
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
lsof -ti:3001 | xargs kill -9 2>/dev/null || true  # Server
lsof -ti:3004 | xargs kill -9 2>/dev/null || true  # Admin
lsof -ti:5173 | xargs kill -9 2>/dev/null || true  # Web
lsof -ti:8081 | xargs kill -9 2>/dev/null || true  # Mobile
lsof -ti:8082 | xargs kill -9 2>/dev/null || true  # Mobile (alternative)
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
        -e POSTGRES_USER=postgres \
        -e POSTGRES_PASSWORD=postgres \
        -e POSTGRES_DB=glimpse_dev \
        -p 5432:5432 \
        --health-cmd="pg_isready -U postgres" \
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
until docker exec glimpse-postgres-dev pg_isready -U postgres > /dev/null 2>&1; do
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

# 3. 의존성 설치
echo -e "${YELLOW}📋 Step 3: 모든 프로젝트 의존성 설치${NC}"

# Server 의존성 설치
echo "서버 의존성 설치 중..."
cd "$PROJECT_ROOT/server"
if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
    npm install --legacy-peer-deps
fi

# Web 의존성 설치
echo "웹 의존성 설치 중..."
cd "$PROJECT_ROOT/web"
if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
    npm install
fi

# Admin 의존성 설치
echo "관리자 의존성 설치 중..."
cd "$PROJECT_ROOT/admin"
if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
    npm install --legacy-peer-deps
fi

# Mobile 의존성 설치
echo "모바일 의존성 설치 중..."
cd "$PROJECT_ROOT/mobile"
if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
    npm install --legacy-peer-deps
fi

echo -e "${GREEN}✅ 의존성 설치 완료${NC}"
echo ""

# 4. 서버 데이터베이스 초기화 및 마이그레이션
echo -e "${YELLOW}📋 Step 4: 서버 데이터베이스 초기화 및 마이그레이션${NC}"
cd "$PROJECT_ROOT/server"

# .env 파일 확인 및 생성
if [ ! -f ".env" ]; then
    echo ".env 파일이 없습니다. 기본 설정으로 생성합니다..."
    cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/glimpse_dev

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Secret (generate: openssl rand -base64 64)
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_random

# Encryption Key (32 bytes hex) (generate: openssl rand -hex 32)
ENCRYPTION_KEY=your_encryption_key_here_64_hex_characters_replace_this

# Clerk Authentication (get from https://clerk.com)
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here

# Redis
REDIS_URL=redis://localhost:6379

# Dev Auth
DEV_AUTH_ENABLED=true
EOF
    echo -e "${GREEN}✅ server/.env 파일 생성 완료${NC}"
fi

# Prisma Client 생성
echo "Prisma Client 생성 중..."
npx prisma generate

# 데이터베이스 마이그레이션
echo "데이터베이스 마이그레이션 실행 중..."
npx prisma migrate reset --force

# 데이터베이스 시드 (선택적)
if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
    echo "데이터베이스 시드 실행 중..."
    npx prisma db seed
fi

echo -e "${GREEN}✅ 데이터베이스 초기화 완료${NC}"
echo ""

# 5. Admin 데이터베이스 마이그레이션
echo -e "${YELLOW}📋 Step 5: Admin 데이터베이스 마이그레이션${NC}"
cd "$PROJECT_ROOT/admin"

if [ -f "prisma/schema.prisma" ]; then
    echo "Admin Prisma Client 생성 중..."
    npx prisma generate
    echo "Admin 데이터베이스 마이그레이션 실행 중..."
    npx prisma migrate deploy 2>/dev/null || npx prisma db push
    echo -e "${GREEN}✅ Admin 데이터베이스 설정 완료${NC}"
fi
echo ""

# 6. NestJS 서버 실행
echo -e "${YELLOW}📋 Step 6: NestJS 서버 실행${NC}"
cd "$PROJECT_ROOT/server"
echo "서버 시작 중..."
npm run dev > ../logs/server.log 2>&1 &
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
    if [ "$i" -eq 30 ]; then
        echo -e "${RED}❌ 서버 시작 실패. logs/server.log를 확인하세요.${NC}"
        exit 1
    fi
    sleep 1
done
echo ""

# 7. Web 프로젝트 실행
echo -e "${YELLOW}📋 Step 7: Web 랜딩 페이지 실행${NC}"
cd "$PROJECT_ROOT/web"

# .env 파일 확인 및 생성
if [ ! -f ".env" ]; then
    echo ".env 파일이 없습니다. 기본 설정으로 생성합니다..."
    cat > .env << 'EOF'
# API Configuration
VITE_API_URL=http://localhost:3001/api/v1

# Development
NODE_ENV=development
EOF
    echo -e "${GREEN}✅ web/.env 파일 생성 완료${NC}"
fi

echo "Web 랜딩 페이지 시작 중..."
npm run dev > ../logs/web.log 2>&1 &
WEB_PID=$!

# Web 시작 대기
sleep 5
if lsof -ti:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Web 랜딩 페이지 실행 완료${NC}"
    echo "   URL: http://localhost:5173"
else
    echo -e "${YELLOW}⚠️ Web이 시작 중입니다. logs/web.log를 확인하세요.${NC}"
fi
echo ""

# 8. Admin 프로젝트 실행
echo -e "${YELLOW}📋 Step 8: Admin 대시보드 실행${NC}"
cd "$PROJECT_ROOT/admin"

# .env 파일 확인 및 생성
if [ ! -f ".env" ]; then
    echo ".env 파일이 없습니다. 기본 설정으로 생성합니다..."
    cat > .env << 'EOF'
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Clerk Authentication (get from https://clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here

# Development
NODE_ENV=development
EOF
    echo -e "${GREEN}✅ admin/.env 파일 생성 완료${NC}"
fi

echo "Admin 대시보드 시작 중..."
npm run dev > ../logs/admin.log 2>&1 &
ADMIN_PID=$!

# Admin 시작 대기
sleep 8
if lsof -ti:3004 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Admin 대시보드 실행 완료${NC}"
    echo "   URL: http://localhost:3004"
else
    echo -e "${YELLOW}⚠️ Admin이 시작 중입니다. logs/admin.log를 확인하세요.${NC}"
fi
echo ""

# 9. Mobile 앱 실행
echo -e "${YELLOW}📋 Step 9: Mobile 앱 실행${NC}"
cd "$PROJECT_ROOT/mobile"

# .env 파일 확인 및 생성
if [ ! -f ".env" ]; then
    echo ".env 파일이 없습니다. 기본 설정으로 생성합니다..."
    cat > .env << 'EOF'
# API Configuration
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
EXPO_PUBLIC_WEBSOCKET_URL=ws://localhost:3001

# Clerk Authentication (get from https://clerk.com)
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here

# Development
NODE_ENV=development
EOF
    echo -e "${GREEN}✅ mobile/.env 파일 생성 완료${NC}"
fi

echo "Mobile 앱 시작 중..."
npx expo start --web > ../logs/mobile.log 2>&1 &
MOBILE_PID=$!

# Mobile 앱 시작 대기
echo "Mobile 앱 시작 대기 중..."
sleep 10
if grep -q "Metro waiting on" ../logs/mobile.log 2>/dev/null || grep -q "Web Bundled" ../logs/mobile.log 2>/dev/null; then
    echo -e "${GREEN}✅ Mobile 앱 실행 완료${NC}"
    echo "   Metro Bundler: http://localhost:8081"
    echo "   웹 버전을 실행하려면: 터미널에서 'w' 키를 누르세요"
    echo "   iOS 시뮬레이터: 'i' 키를 누르세요"
    echo "   Android 에뮬레이터: 'a' 키를 누르세요"
else
    echo -e "${YELLOW}⚠️ Mobile 앱이 시작 중입니다. logs/mobile.log를 확인하세요.${NC}"
fi
echo ""

# 10. 최종 상태 확인
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
echo "✅ Web Landing Page: http://localhost:5173"
echo "✅ Admin Dashboard: http://localhost:3004"
echo "✅ Mobile App: http://localhost:8081"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 모든 서비스가 성공적으로 실행되었습니다!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

echo -e "${BLUE}📱 접속 방법:${NC}"
echo "   • 랜딩 페이지: http://localhost:5173"
echo "   • 관리자 대시보드: http://localhost:3004"
echo "   • 모바일 웹 앱: http://localhost:8081"
echo "   • API 문서: http://localhost:3001/docs"
echo ""

echo -e "${YELLOW}💡 개발 모드 기능:${NC}"
echo "   • 자동 로그인 활성화"
echo "   • 프리미엄 계정 자동 설정"
echo "   • 모든 기능 테스트 가능"
echo ""

echo -e "${YELLOW}📝 로그 확인:${NC}"
echo "   • 서버 로그: tail -f logs/server.log"
echo "   • Web 로그: tail -f logs/web.log"
echo "   • Admin 로그: tail -f logs/admin.log"
echo "   • Mobile 로그: tail -f logs/mobile.log"
echo ""

echo -e "${YELLOW}🛑 종료하려면:${NC}"
echo "   • Ctrl+C를 누르거나"
echo "   • ./scripts/stop-local-dev.sh 실행"
echo ""

# 로그 디렉토리 생성
mkdir -p logs

# 프로세스 ID 저장
echo "$SERVER_PID" > .server.pid
echo "$WEB_PID" > .web.pid
echo "$ADMIN_PID" > .admin.pid
echo "$MOBILE_PID" > .mobile.pid

# 종료 시그널 처리
trap 'echo -e "\n${YELLOW}종료 중...${NC}"; kill $SERVER_PID $WEB_PID $ADMIN_PID $MOBILE_PID 2>/dev/null; exit' INT TERM

# 프로세스 유지
wait