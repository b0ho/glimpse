#!/bin/bash
# ==============================================
# GLIMPSE Pre-commit 보안 검사 (간소화 버전)
# ==============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

echo -e "${GREEN}[보안 검사]${NC} 민감정보 검사 중..."

# 스테이징된 파일
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null)

if [ -z "$STAGED_FILES" ]; then
    echo -e "${GREEN}✓${NC} 커밋할 파일 없음"
    exit 0
fi

# 1. 금지된 파일
FORBIDDEN='\.env$|\.env\.|secrets\.env|\.pem$|\.key$|\.p12$|\.jks$|serviceAccountKey|firebase-admin.*\.json$|id_rsa$|id_ecdsa$'

for file in $STAGED_FILES; do
    if echo "$file" | grep -qE "$FORBIDDEN"; then
        # debug.keystore는 허용
        if echo "$file" | grep -q "debug\.keystore"; then
            continue
        fi
        echo -e "${RED}[ERROR]${NC} 금지된 파일: $file"
        ERRORS=$((ERRORS + 1))
    fi
done

# 2. 민감정보 패턴 (핵심만)
PATTERNS=(
    'AKIA[0-9A-Z]{16}'                    # AWS Access Key
    'sk_live_[a-zA-Z0-9]'                 # Stripe Live Key
    'sk_test_[a-zA-Z0-9]{20}'             # Stripe Test Key (긴 것만)
    'ghp_[A-Za-z0-9]{30}'                 # GitHub Token
    'glpat-[A-Za-z0-9]{20}'               # GitLab Token
    'BEGIN.*PRIVATE KEY'                  # Private Keys
    'AIza[0-9A-Za-z_-]{30}'               # Firebase/Google API Key
)

EXCLUDE='\.md$|\.txt$|\.example$|node_modules|scripts/|\.husky/'

for file in $STAGED_FILES; do
    if echo "$file" | grep -qE "$EXCLUDE"; then
        continue
    fi
    
    if [ -f "$file" ]; then
        CONTENT=$(git show ":$file" 2>/dev/null || cat "$file" 2>/dev/null)
        
        for pattern in "${PATTERNS[@]}"; do
            if echo "$CONTENT" | grep -qE "$pattern"; then
                # 플레이스홀더 무시
                MATCH=$(echo "$CONTENT" | grep -oE "$pattern" | head -1)
                if echo "$MATCH" | grep -qiE "your_|example|placeholder|test_value|sample"; then
                    continue
                fi
                echo -e "${RED}[ERROR]${NC} 민감정보 발견: $file"
                echo -e "        패턴: ${MATCH:0:30}..."
                ERRORS=$((ERRORS + 1))
                break
            fi
        done
    fi
done

# 결과
if [ "$ERRORS" -gt 0 ]; then
    echo ""
    echo -e "${RED}커밋 차단: ${ERRORS}건의 보안 이슈${NC}"
    echo -e "우회: git commit --no-verify"
    exit 1
fi

echo -e "${GREEN}✓${NC} 보안 검사 통과"
exit 0
