#!/bin/bash

# Glimpse 전체 서비스 시작 스크립트
# 사용법: ./scripts/start-all.sh [service]
# 서비스 옵션: all, server, mobile, web, admin

set -e

# 색깔 출력을 위한 함수들
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
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

print_header() {
    echo -e "${CYAN}$1${NC}"
}

show_help() {
    echo "Glimpse 개발 서버 시작 스크립트"
    echo ""
    echo "사용법:"
    echo "  ./scripts/start-all.sh [service]"
    echo ""
    echo "서비스 옵션:"
    echo "  all     - 모든 서비스 (서버 + 모바일) [기본값]"
    echo "  server  - 백엔드 API 서버만"
    echo "  mobile  - React Native 모바일 앱만"
    echo "  web     - Vite 랜딩 페이지만"
    echo "  admin   - Next.js 관리자 대시보드만"
    echo ""
    echo "예시:"
    echo "  ./scripts/start-all.sh          # 기본 개발 서버 (서버 + 모바일)"
    echo "  ./scripts/start-all.sh web      # 랜딩 페이지만"
    echo "  ./scripts/start-all.sh admin    # 관리자 대시보드만"
    echo ""
}

# 현재 디렉토리가 프로젝트 루트인지 확인
if [ ! -f "package.json" ]; then
    print_error "package.json이 없습니다. 프로젝트 루트에서 실행해주세요."
    exit 1
fi

# 인자 처리
SERVICE=${1:-all}

case $SERVICE in
    "help" | "-h" | "--help")
        show_help
        exit 0
        ;;
    "all")
        print_header "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        print_header "🚀 Glimpse 개발 서버 전체 시작"
        print_header "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        print_status "서비스 포트:"
        echo "  📱 모바일 앱: http://localhost:8081 (Expo)"
        echo "  🚀 서버 API: http://localhost:3002"
        echo ""
        print_status "추가 서비스 (별도 실행):"
        echo "  🌐 랜딩 페이지: npm run dev:web (포트 5173)"
        echo "  🛠 관리자 대시보드: npm run dev:admin (포트 3000)"
        echo ""
        npm run dev
        ;;
    "server")
        print_header "🚀 Glimpse 백엔드 서버 시작"
        echo "📍 URL: http://localhost:3002"
        npm run dev:server
        ;;
    "mobile")
        print_header "📱 Glimpse 모바일 앱 시작"
        echo "📍 URL: http://localhost:8081"
        npm run dev:mobile
        ;;
    "web")
        print_header "🌐 Glimpse 랜딩 페이지 시작"
        echo "📍 URL: http://localhost:5173"
        npm run dev:web
        ;;
    "admin")
        print_header "🛠 Glimpse 관리자 대시보드 시작"
        echo "📍 URL: http://localhost:3000"
        npm run dev:admin
        ;;
    *)
        print_error "알 수 없는 서비스: $SERVICE"
        echo ""
        show_help
        exit 1
        ;;
esac