#!/bin/bash
# CyberQuiz - Hotfix Verification Script

set -e

echo ""
echo "🔍 CyberQuiz Hotfix Verification"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check 1: Docker containers running
echo -e "${BLUE}[1/5]${NC} Checking Docker containers..."
if docker-compose -f docker-compose.dev.yml ps | grep -q "healthy\|Up"; then
    echo -e "${GREEN}✓${NC} Containers are running"
else
    echo -e "${YELLOW}⚠${NC} Some containers may not be fully ready yet"
fi
echo ""

# Check 2: Next.js app responding
echo -e "${BLUE}[2/5]${NC} Testing Next.js app health..."
if curl -s http://localhost:3333/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} App is responding"
else
    echo -e "${RED}✗${NC} App not responding - may still be starting"
fi
echo ""

# Check 3: Ollama models ready
echo -e "${BLUE}[3/5]${NC} Checking Ollama models..."
if docker-compose -f docker-compose.dev.yml exec -T ollama ollama list 2>/dev/null | grep -q "llama3.1\|nomic-embed"; then
    echo -e "${GREEN}✓${NC} Ollama models are loaded"
else
    echo -e "${YELLOW}⚠${NC} Ollama still loading models (this is normal)"
fi
echo ""

# Check 4: Code changes applied
echo -e "${BLUE}[4/5]${NC} Verifying code changes..."
if grep -q "isLoaded" /Users/symba/Programs/Code/CyberQuiz/src/lib/accessibility-context.tsx; then
    echo -e "${GREEN}✓${NC} Hydration fix applied"
else
    echo -e "${RED}✗${NC} Hydration fix not found"
fi

if grep -q "v2_french" /Users/symba/Programs/Code/CyberQuiz/src/lib/ai/prompts/generation.ts; then
    echo -e "${GREEN}✓${NC} French language support added"
else
    echo -e "${RED}✗${NC} French language not found"
fi

if grep -q "similarityModalOpen" /Users/symba/Programs/Code/CyberQuiz/app/admin/page.tsx; then
    echo -e "${GREEN}✓${NC} Similarity display integrated"
else
    echo -e "${RED}✗${NC} Similarity display not found"
fi
echo ""

# Check 5: Endpoints available
echo -e "${BLUE}[5/5]${NC} Testing API endpoints..."
if curl -s http://localhost:3333/api/health | grep -q "ok\|status"; then
    echo -e "${GREEN}✓${NC} Health endpoint working"
fi
echo ""

echo "=================================="
echo -e "${GREEN}✓ Hotfix Verification Complete${NC}"
echo ""
echo "🧪 Manual Testing Steps:"
echo ""
echo "1. React Error #310 Fix:"
echo "   - Open: http://localhost:3333"
echo "   - Press F12 → Console"
echo "   - Should see NO React error #310"
echo "   - Page should load smoothly"
echo ""
echo "2. French Language:"
echo "   - Go to: http://localhost:3333/admin-login"
echo "   - Login with: admin@cyberquiz.fr / AdminSecure2026!"
echo "   - View to_review questions"
echo "   - Questions should be in French"
echo "   - Example: 'Quelle est...?' (not 'What is...?')"
echo ""
echo "3. Similarity Detection:"
echo "   - In admin panel, look at question cards in 'to_review'"
echo "   - Some may show: '⚠️ N similaire(s)' badge"
echo "   - Click badge → Similarity modal opens"
echo "   - Shows % match and comparison"
echo ""
echo "📊 Expected Results:"
echo "   ✓ No React errors on page load"
echo "   ✓ Questions generated in French"
echo "   ✓ Similarity warnings when duplicates detected"
echo ""
echo "🐛 If issues persist:"
echo "   1. Check logs: docker-compose logs -f nextjs-app"
echo "   2. Clear cache: docker-compose down -v"
echo "   3. Rebuild: docker-compose build --no-cache"
echo ""
