#!/bin/bash
# ==============================================
# GLIMPSE 프로젝트 보안 스캔
# ==============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=== Glimpse 보안 스캔 ==="
echo ""

ISSUES=0

# 1. Git에 추적 중인 환경 파일
echo "[1/4] 환경 파일 검사..."
TRACKED_ENV=$(git ls-files | grep -E '\.env$|secrets\.env' | grep -v 'example' || true)
if [ -n "$TRACKED_ENV" ]; then
    echo -e "${RED}[CRITICAL]${NC} Git에 환경 파일 있음: $TRACKED_ENV"
    ISSUES=$((ISSUES + 1))
fi

# 2. 민감 파일 존재
echo "[2/4] 민감 파일 검사..."
SENSITIVE=$(find . -type f \( -name "*.pem" -o -name "*.key" -o -name "serviceAccountKey.json" \) 2>/dev/null | grep -v "node_modules\|\.git\|debug" || true)
if [ -n "$SENSITIVE" ]; then
    echo -e "${RED}[CRITICAL]${NC} 민감 파일 발견:"
    echo "$SENSITIVE"
    ISSUES=$((ISSUES + 1))
fi

# 3. 하드코딩된 키 (소스 코드만)
echo "[3/4] 하드코딩 키 검사..."
HARDCODED=$(grep -rE "AKIA[0-9A-Z]{16}|sk_live_[a-zA-Z0-9]{20}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.java" . 2>/dev/null | grep -v "node_modules\|\.example\|your_\|placeholder" || true)
if [ -n "$HARDCODED" ]; then
    echo -e "${RED}[CRITICAL]${NC} 하드코딩된 키 발견"
    ISSUES=$((ISSUES + 1))
fi

# 4. npm audit
echo "[4/4] 의존성 취약점 검사..."
if command -v npm &> /dev/null; then
    npm audit --audit-level=high 2>/dev/null | head -20 || true
fi

echo ""
if [ "$ISSUES" -gt 0 ]; then
    echo -e "${RED}=== $ISSUES건의 보안 이슈 발견 ===${NC}"
    exit 1
else
    echo -e "${GREEN}=== 보안 검사 통과 ===${NC}"
    exit 0
fi
