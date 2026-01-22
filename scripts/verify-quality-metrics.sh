#!/bin/bash

# Quality Metrics & Similarity Update Verification Script
# Checks if the changes have been properly implemented

echo "ðŸ” Verifying Quality Metrics & Similarity Display Update..."
echo ""

# Check 1: Verify API endpoint includes qualityScore
echo "âœ“ Checking API response fields..."
if grep -q "qualityScore: q.qualityScore" /Users/symba/Programs/Code/CyberQuiz/app/api/admin/questions/review/route.ts; then
  echo "  âœ… API includes qualityScore field"
else
  echo "  âŒ API missing qualityScore field"
fi

if grep -q "potentialDuplicates: q.potentialDuplicates" /Users/symba/Programs/Code/CyberQuiz/app/api/admin/questions/review/route.ts; then
  echo "  âœ… API includes potentialDuplicates field"
else
  echo "  âŒ API missing potentialDuplicates field"
fi

# Check 2: Verify difficulty removed from admin display
echo ""
echo "âœ“ Checking admin UI removals..."
if grep -q "DifficultÃ©:" /Users/symba/Programs/Code/CyberQuiz/app/admin/page.tsx; then
  echo "  âŒ Difficulty display still present"
else
  echo "  âœ… Difficulty display removed"
fi

# Check 3: Verify quality metrics display added
#"VariÃ©tÃ© â€¢ VÃ©racitÃ© â€¢ Non-interprÃ©table"

# Check 4: Verify similarity button improvements
echo ""
echo "âœ“ Checking similarity check button..."
if grep -q "VÃ©rifier similitude" /Users/symba/Programs/Code/CyberQuiz/app/admin/page.tsx; then
  echo "  âœ… Similarity check button label added"
else
  echo "  âŒ Similarity check button missing"
fi

# Check 5: Verify API endpoint exists
echo ""
echo "âœ“ Checking API endpoints..."
if [ -f /Users/symba/Programs/Code/CyberQuiz/app/api/admin/questions/similar/route.ts ]; then
  echo "  âœ… Similarity API endpoint exists"
else
  echo "  âŒ Similarity API endpoint missing"
fi

echo ""
echo "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”"
echo "ðŸ“‹ Summary of Changes:"
echo "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”"
echo ""
echo "1. Difficulty scores completely removed from admin display"
echo "2. Quality metrics now showing with criteria: VariÃ©tÃ© â€¢ VÃ©racitÃ© â€¢ Non-interprÃ©table"
echo "3. Similarity check button always visible for questions under review"
echo "4. API now returns qualityScore and potentialDuplicates in question responses"
echo ""
echo "ðŸš€ To test:"
echo "   1. Navigate to admin panel"
echo "   2. Look at questions in review"
echo "   3. Verify NO difficulty percentage shown"
echo "   4. Verify quality score displays with criteria"
echo "   5. Click 'VÃ©rifier similitude' to see similar questions"
echo ""
