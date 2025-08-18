#!/bin/bash

# ==========================================
# Glimpse 전체 시스템 통합 테스트
# ==========================================

echo "=========================================="
echo "   Glimpse 전체 시스템 통합 테스트"
echo "=========================================="
echo ""

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 로컬 및 운영 URL
LOCAL_URL="http://localhost:3001"
PROD_URL="https://glimpse-server.vercel.app"

# 테스트 결과 저장
LOCAL_PASS=0
LOCAL_FAIL=0
PROD_PASS=0
PROD_FAIL=0

echo "1. 로컬 환경 테스트"
echo "==================="

# 로컬 서버 헬스체크
echo -n "Health Check: "
if curl -s "$LOCAL_URL/health" | grep -q "ok"; then
    echo -e "${GREEN}✓${NC}"
    ((LOCAL_PASS++))
else
    echo -e "${RED}✗${NC}"
    ((LOCAL_FAIL++))
fi

# 로컬 데이터베이스 연결
echo -n "Database Connection: "
if curl -s "$LOCAL_URL/health/db" -H "x-dev-auth: true" | grep -q "connected"; then
    echo -e "${GREEN}✓${NC}"
    ((LOCAL_PASS++))
else
    echo -e "${YELLOW}⚠ DB not configured${NC}"
fi

# 로컬 API 테스트
echo -n "Groups API: "
GROUPS_COUNT=$(curl -s "$LOCAL_URL/api/v1/groups" -H "x-dev-auth: true" | jq '.data | length' 2>/dev/null)
if [ "$GROUPS_COUNT" -gt 0 ] 2>/dev/null; then
    echo -e "${GREEN}✓ ($GROUPS_COUNT groups)${NC}"
    ((LOCAL_PASS++))
else
    echo -e "${RED}✗${NC}"
    ((LOCAL_FAIL++))
fi

echo ""
echo "2. Vercel 운영 환경 테스트"
echo "=========================="

# 운영 서버 헬스체크
echo -n "Health Check: "
PROD_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/health")
if [ "$PROD_HEALTH" = "200" ]; then
    echo -e "${GREEN}✓${NC}"
    ((PROD_PASS++))
else
    echo -e "${RED}✗ (HTTP $PROD_HEALTH)${NC}"
    ((PROD_FAIL++))
    echo "  Note: 환경변수 설정이 필요할 수 있습니다"
fi

# 운영 데이터베이스 연결
echo -n "Database Connection: "
PROD_DB=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/health/db")
if [ "$PROD_DB" = "200" ]; then
    echo -e "${GREEN}✓${NC}"
    ((PROD_PASS++))
else
    echo -e "${YELLOW}⚠ Database not connected (HTTP $PROD_DB)${NC}"
    echo "  Note: DATABASE_URL 환경변수 설정 필요"
fi

# 운영 API 테스트
echo -n "Groups API: "
PROD_API=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/api/v1/groups" -H "x-dev-auth: true")
if [ "$PROD_API" = "200" ]; then
    echo -e "${GREEN}✓${NC}"
    ((PROD_PASS++))
else
    echo -e "${RED}✗ (HTTP $PROD_API)${NC}"
    ((PROD_FAIL++))
fi

echo ""
echo "3. Clerk 인증 테스트"
echo "===================="

# Clerk API 연결 테스트
echo -n "Clerk API Connection: "
CLERK_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://api.clerk.com/v1/users?limit=1" \
    -H "Authorization: Bearer sk_test_ahquE3eARWKYofKL7BQoMLfHl7474tiTuMSm1twG4C")

if [ "$CLERK_TEST" = "200" ]; then
    echo -e "${GREEN}✓ Clerk API 연결 성공${NC}"
else
    echo -e "${RED}✗ Clerk API 연결 실패${NC}"
fi

echo ""
echo "=========================================="
echo "           테스트 결과 요약"
echo "=========================================="
echo ""
echo "로컬 환경:"
echo -e "  성공: ${GREEN}$LOCAL_PASS${NC}"
echo -e "  실패: ${RED}$LOCAL_FAIL${NC}"
echo ""
echo "Vercel 운영:"
echo -e "  성공: ${GREEN}$PROD_PASS${NC}"
echo -e "  실패: ${RED}$PROD_FAIL${NC}"
echo ""

if [ $LOCAL_FAIL -eq 0 ] && [ $PROD_FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ 모든 테스트 통과!${NC}"
else
    echo -e "${YELLOW}⚠️  일부 테스트 실패${NC}"
    echo ""
    echo "다음 단계:"
    if [ $PROD_FAIL -gt 0 ]; then
        echo "1. Vercel Dashboard에서 환경변수 설정 확인"
        echo "   - DATABASE_URL (Railway/Supabase PostgreSQL)"
        echo "   - CLERK_SECRET_KEY"
        echo "   - JWT_SECRET"
        echo "2. 재배포: git push 또는 vercel --prod"
    fi
fi

echo ""
echo "=========================================="
echo "테스트 완료 시간: $(date '+%Y-%m-%d %H:%M:%S')"
echo "==========================================" 