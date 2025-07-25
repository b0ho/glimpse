#\!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Glimpse Security Check ===${NC}"
echo ""

ISSUES=0

# Check for hardcoded secrets
echo -e "${GREEN}[INFO]${NC} Checking for hardcoded secrets..."
if grep -r -i "password\s*=\s*['\"]" --include="*.ts" --include="*.js" --exclude-dir=node_modules . 2>/dev/null | grep -v "example\|test"; then
    echo -e "${RED}[ERROR]${NC} Found hardcoded passwords\!"
    ((ISSUES++))
fi

# Check npm audit
echo -e "${GREEN}[INFO]${NC} Running npm audit..."
npm audit --production 2>&1 | grep -v "0 vulnerabilities" || echo -e "${GREEN}[INFO]${NC} No vulnerabilities found"

# Check for console.log
echo -e "${GREEN}[INFO]${NC} Checking for console.log statements..."
CONSOLE_COUNT=$(grep -r "console\." --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=tests . 2>/dev/null | wc -l)
echo -e "${YELLOW}[WARNING]${NC} Found $CONSOLE_COUNT console statements"

echo ""
if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ Security check passed\!${NC}"
else
    echo -e "${RED}❌ Found $ISSUES security issues${NC}"
fi
EOF < /dev/null