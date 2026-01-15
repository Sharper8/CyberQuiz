#!/bin/bash
# Pre-Push Validation Script for CyberQuiz
# Ensures everything is ready for teammates to deploy

set -e  # Exit on error

echo "🔍 CyberQuiz Pre-Push Validation"
echo "=================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check function
check() {
    local description="$1"
    local command="$2"
    local critical="${3:-true}"
    
    printf "%-60s" "Checking $description..."
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
    else
        if [ "$critical" = "true" ]; then
            echo -e "${RED}✗ FAIL${NC}"
            ((ERRORS++))
        else
            echo -e "${YELLOW}⚠ WARN${NC}"
            ((WARNINGS++))
        fi
    fi
}

echo "📋 File Structure Checks"
echo "------------------------"
check "docker-compose.yml exists" "[ -f docker-compose.yml ]"
check "docker-compose.dev.yml exists" "[ -f docker-compose.dev.yml ]"
check ".env.example exists and not empty" "[ -s .env.example ]"
check ".env.dev.example exists" "[ -f .env.dev.example ]"
check "Dockerfile exists" "[ -f Dockerfile ]"
check "prisma/schema.prisma exists" "[ -f prisma/schema.prisma ]"
check "DEPLOYMENT_CHECKLIST.md exists" "[ -f DEPLOYMENT_CHECKLIST.md ]"
check "QUICKSTART_DEVELOPERS.md exists" "[ -f QUICKSTART_DEVELOPERS.md ]"
echo ""

echo "🔒 Security Checks"
echo "------------------"
check ".env is gitignored" "grep -q '^\\.env$' .gitignore"
check ".env.dev is gitignored" "grep -q '^\\.env\\.dev$' .gitignore"
check "No hardcoded secrets in docker-compose.yml" "! grep -q 'JWT_SECRET.*your-super-secret' docker-compose.yml || grep -q 'env_file' docker-compose.yml"
check ".env does not exist in git" "! git ls-files | grep -q '^\\.env$'" "false"
echo ""

echo "🐳 Docker Configuration Checks"
echo "-------------------------------"
check "docker-compose.yml syntax valid" "docker-compose config > /dev/null"
check "docker-compose.dev.yml syntax valid" "docker-compose -f docker-compose.dev.yml config > /dev/null"
check "Production uses env_file" "grep -q 'env_file' docker-compose.yml"
check "Dev uses env_file" "grep -q 'env_file' docker-compose.dev.yml"
check "Container names defined in prod" "grep -q 'container_name.*-prod' docker-compose.yml"
check "Container names defined in dev" "grep -q 'container_name.*-dev' docker-compose.dev.yml"
echo ""

echo "📦 Environment Configuration Checks"
echo "------------------------------------"
check ".env.example has DATABASE_URL" "grep -q 'DATABASE_URL' .env.example"
check ".env.example has JWT_SECRET" "grep -q 'JWT_SECRET' .env.example"
check ".env.example has ADMIN_EMAIL" "grep -q 'ADMIN_EMAIL' .env.example"
check ".env.example has ADMIN_PASSWORD" "grep -q 'ADMIN_PASSWORD' .env.example"
check ".env.example has OLLAMA_BASE_URL" "grep -q 'OLLAMA_BASE_URL' .env.example"
check ".env.example has QDRANT_URL" "grep -q 'QDRANT_URL' .env.example"
check ".env.example has NODE_ENV" "grep -q 'NODE_ENV' .env.example"
check ".env.example has helpful comments" "grep -q '#' .env.example"
check ".env.example has CHANGE_ME placeholders" "grep -q 'CHANGE_ME' .env.example"
echo ""

echo "🗄️ Database Schema Checks"
echo "-------------------------"
check "Question model has questionHash" "grep -q 'questionHash' prisma/schema.prisma"
check "DuplicateLog model exists" "grep -q 'model DuplicateLog' prisma/schema.prisma"
check "Question has potentialDuplicates" "grep -q 'potentialDuplicates' prisma/schema.prisma"
check "Migration for questionHash exists" "find prisma/migrations -name '*.sql' -exec grep -l 'questionHash' {} \; | head -1 | grep -q ."
check "Migration for DuplicateLog exists" "find prisma/migrations -name '*.sql' -exec grep -l 'DuplicateLog' {} \; | head -1 | grep -q ."
echo ""

echo "📝 Documentation Checks"
echo "------------------------"
check "README.md exists" "[ -f README.md ]"
check "QUICKSTART.md exists" "[ -f QUICKSTART.md ]" "false"
check "Deployment docs exist" "[ -f docs/DEPLOYMENT.md ] || [ -f DEPLOYMENT_CHECKLIST.md ]"
check "Developer guide exists" "[ -f QUICKSTART_DEVELOPERS.md ]"
echo ""

echo "🔧 Code Quality Checks"
echo "----------------------"
check "TypeScript compiles" "npx tsc --noEmit 2>&1 | grep -q 'error TS' && exit 1 || exit 0" "false"
check "Prisma client generated" "[ -d node_modules/@prisma/client ]" "false"
check "Next.js build files exist" "[ -f next.config.mjs ]"
check "Package.json exists" "[ -f package.json ]"
echo ""

echo "🆕 New Features Validation"
echo "--------------------------"
check "Question hash function exists" "grep -q 'generateQuestionHash' src/lib/services/question-generator.ts"
check "Duplicate logging function exists" "grep -q 'logDuplicate' src/lib/services/question-generator.ts"
check "Duplicate stats API exists" "[ -f app/api/admin/duplicate-stats/route.ts ]"
check "Admin panel shows similar questions text" "grep -q 'similarQuestion.questionText' app/admin/page.tsx"
check "Quality criteria text removed" "! grep -q 'Variété.*Véracité.*Non-interprétable' app/admin/page.tsx"
echo ""

# Summary
echo ""
echo "=================================="
echo "📊 Validation Summary"
echo "=================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "🚀 Ready to push!"
    echo ""
    echo "Next steps for your colleagues:"
    echo "1. Clone the repository"
    echo "2. Copy .env.example to .env and update credentials"
    echo "3. Run: docker-compose -f docker-compose.dev.yml up -d --build"
    echo "4. Access: http://localhost:3333"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Validation failed!${NC}"
    echo ""
    echo "Errors: $ERRORS"
    echo "Warnings: $WARNINGS"
    echo ""
    
    if [ $ERRORS -gt 0 ]; then
        echo -e "${RED}Please fix errors before pushing.${NC}"
        exit 1
    else
        echo -e "${YELLOW}Warnings found but not critical.${NC}"
        echo "Consider fixing warnings for better teammate experience."
        exit 0
    fi
fi
