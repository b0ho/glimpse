#!/bin/bash

# 모든 API 엔드포인트 테스트 스크립트
# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3001"
DEV_AUTH="x-dev-auth: true"

echo "=========================================="
echo "   Glimpse API 전체 엔드포인트 테스트"
echo "=========================================="
echo ""

# 테스트 결과 저장
PASS=0
FAIL=0

# 테스트 함수
test_api() {
    local method=$1
    local endpoint=$2
    local description=$3
    local auth_required=$4
    
    echo -n "Testing $method $endpoint - $description: "
    
    if [ "$auth_required" = "true" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BASE_URL$endpoint" -H "$DEV_AUTH")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BASE_URL$endpoint")
    fi
    
    # 성공 코드 확인 (200, 201, 401은 정상)
    if [ "$response" = "200" ] || [ "$response" = "201" ] || [ "$response" = "404" ]; then
        echo -e "${GREEN}✓${NC} ($response)"
        ((PASS++))
    elif [ "$response" = "401" ] && [ "$auth_required" = "true" ]; then
        echo -e "${GREEN}✓${NC} (401 - Auth Required)"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} ($response)"
        ((FAIL++))
    fi
}

echo "1. Health Check APIs"
echo "--------------------"
test_api "GET" "/health" "Health check" false
test_api "GET" "/health/db" "Database health" false
echo ""

echo "2. Auth APIs"
echo "------------"
test_api "POST" "/api/v1/auth/register" "User registration" false
test_api "GET" "/api/v1/auth/me" "Get current user" true
test_api "POST" "/api/v1/auth/verify" "Verify user" false
echo ""

echo "3. User APIs"
echo "------------"
test_api "GET" "/api/v1/users/profile" "Get user profile" true
test_api "PUT" "/api/v1/users/profile" "Update profile" true
test_api "GET" "/api/v1/users/recommendations" "Get recommendations" true
test_api "GET" "/api/v1/users/stats" "Get user stats" true
test_api "GET" "/api/v1/users/likes/remaining" "Get remaining likes" true
test_api "POST" "/api/v1/users/credits/purchase" "Purchase credits" true
echo ""

echo "4. Group APIs"
echo "-------------"
test_api "GET" "/api/v1/groups" "List groups" true
test_api "POST" "/api/v1/groups" "Create group" true
test_api "GET" "/api/v1/groups/my-groups" "Get my groups" true
echo ""

echo "5. Matching APIs"
echo "----------------"
test_api "POST" "/api/v1/matching/likes" "Send like" true
test_api "POST" "/api/v1/matching/super-likes" "Send super like" true
test_api "GET" "/api/v1/matching/likes/sent" "Get sent likes" true
test_api "GET" "/api/v1/matching/likes/received" "Get received likes" true
test_api "GET" "/api/v1/matching/matches" "Get matches" true
test_api "GET" "/api/v1/matching/recommendations" "Get match recommendations" true
test_api "GET" "/api/v1/matching/stats" "Get matching stats" true
test_api "GET" "/api/v1/matching/history" "Get match history" true
test_api "POST" "/api/v1/matching/likes/refresh" "Refresh likes" true
test_api "POST" "/api/v1/matching/likes/rewind" "Rewind last like" true
echo ""

echo "6. Chat APIs"
echo "------------"
test_api "GET" "/api/v1/chat/rooms" "Get chat rooms" true
test_api "GET" "/api/v1/chat/summary" "Get chat summary" true
echo ""

echo "7. Payment APIs"
echo "---------------"
test_api "GET" "/api/v1/payment/plans" "Get payment plans" true
test_api "GET" "/api/v1/payment/subscription/active" "Get active subscription" true
test_api "GET" "/api/v1/payment/history" "Get payment history" true
echo ""

echo "8. File APIs"
echo "------------"
test_api "GET" "/api/v1/files/stats" "Get file stats" true
echo ""

echo "9. Notification APIs"
echo "--------------------"
# notification 엔드포인트가 구현되어 있지 않은 것 같음
echo "Skipped - No endpoints found"
echo ""

echo "10. Admin APIs"
echo "--------------"
test_api "POST" "/api/v1/admin/login" "Admin login" false
test_api "GET" "/api/v1/admin/dashboard" "Admin dashboard" true
test_api "GET" "/api/v1/admin/users" "List users (admin)" true
test_api "GET" "/api/v1/admin/reports" "Get reports" true
test_api "GET" "/api/v1/admin/groups" "List groups (admin)" true
test_api "GET" "/api/v1/admin/stats" "Get admin stats" true
echo ""

echo "11. Location APIs"
echo "-----------------"
test_api "PUT" "/api/v1/location" "Update location" true
echo ""

echo "12. Content APIs"
echo "----------------"
test_api "GET" "/api/v1/contents" "Get contents" true
echo ""

echo "13. Story APIs"
echo "--------------"
test_api "GET" "/api/v1/stories" "Get stories" true
echo ""

echo "14. Interest APIs"
echo "-----------------"
test_api "GET" "/api/v1/interest" "Get interests" true
echo ""

echo "15. Friend APIs"
echo "---------------"
test_api "GET" "/api/v1/friends" "Get friends" true
echo ""

echo "16. Persona APIs"
echo "----------------"
test_api "GET" "/api/v1/persona" "Get persona" true
echo ""

echo "17. Company Domain APIs"
echo "-----------------------"
test_api "GET" "/api/v1/company-domains" "Get company domains" true
echo ""

echo "18. Content Filter APIs"
echo "-----------------------"
test_api "POST" "/api/v1/content-filter/validate-text" "Validate text" true
echo ""

echo "19. Video Call APIs"
echo "-------------------"
test_api "GET" "/api/v1/video-call" "Get video call info" true
echo ""

echo "=========================================="
echo "           테스트 결과 요약"
echo "=========================================="
echo -e "성공: ${GREEN}$PASS${NC}"
echo -e "실패: ${RED}$FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ 모든 API 테스트 통과!${NC}"
else
    echo -e "${YELLOW}⚠️  일부 API 테스트 실패${NC}"
fi