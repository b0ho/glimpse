#!/bin/bash

# Glimpse 관리자 대시보드 시작 스크립트
# 사용법: ./scripts/start-admin.sh

set -e

echo "🛠 Glimpse 관리자 대시보드 시작 중..."
echo ""

# 색깔 출력을 위한 함수들
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 현재 디렉토리가 프로젝트 루트인지 확인
if [ ! -f "package.json" ]; then
    print_error "package.json이 없습니다. 프로젝트 루트에서 실행해주세요."
    exit 1
fi

# admin 디렉토리 존재 확인
if [ ! -d "admin" ]; then
    print_error "admin 디렉토리가 없습니다."
    exit 1
fi

print_status "의존성 확인 중..."

# Node.js 버전 확인
node_version=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$node_version" -lt 18 ]; then
    print_warning "Node.js 18+ 버전을 권장합니다. 현재: $(node -v)"
fi

# 의존성 설치 확인
if [ ! -d "admin/node_modules" ]; then
    print_status "의존성 설치 중..."
    npm install
    if [ $? -eq 0 ]; then
        print_success "의존성 설치 완료!"
    else
        print_error "의존성 설치 실패"
        exit 1
    fi
else
    print_success "의존성이 이미 설치되어 있습니다."
fi

print_status "관리자 대시보드 서버 시작 중..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛠 Glimpse 관리자 대시보드"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 URL: http://localhost:3004"
echo "📁 프로젝트: Next.js + TypeScript + shadcn/ui"
echo "✨ 특징: 사용자/그룹/게시글/스토리 관리, 시스템 모니터링"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔥 서버를 중지하려면 Ctrl+C를 누르세요"
echo ""

# 관리자 대시보드 실행
npm run dev:admin