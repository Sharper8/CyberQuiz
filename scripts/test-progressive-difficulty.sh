#!/bin/bash

# Test progressive difficulty in quiz
# This script simulates a quiz session and shows which difficulty levels are selected

API_URL="http://localhost:3333"
USERNAME="test_progression_$(date +%s)"

echo "🎯 Testing Progressive Difficulty System"
echo "=========================================="
echo ""

# Start quiz session
echo "📝 Starting quiz session..."
SESSION=$(curl -s -X POST "$API_URL/api/quiz/start" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$USERNAME\"}" | jq -r '.sessionId')

if [ -z "$SESSION" ] || [ "$SESSION" == "null" ]; then
  echo "❌ Failed to start session"
  exit 1
fi

echo "✅ Session started: $SESSION"
echo ""

# Simulate 40 questions to see progression
for i in {1..40}; do
  # Get next question
  QUESTION=$(curl -s "$API_URL/api/quiz/$SESSION/next")
  
  QUESTION_ID=$(echo "$QUESTION" | jq -r '.question.id')
  QUESTION_TEXT=$(echo "$QUESTION" | jq -r '.question.questionText' | cut -c1-60)
  
  if [ -z "$QUESTION_ID" ] || [ "$QUESTION_ID" == "null" ]; then
    echo "❌ No more questions available at question $i"
    break
  fi
  
  # Get difficulty from database
  DIFFICULTY=$(docker compose -f docker-compose.dev.yml exec -T postgres psql -U cyberquiz -d cyberquiz -t -c "SELECT \"adminDifficulty\" FROM \"Question\" WHERE id=$QUESTION_ID;" | xargs)
  
  echo "Q$i: [$DIFFICULTY] $QUESTION_TEXT..."
  
  # Auto-answer (always correct for this test)
  CORRECT_ANSWER=$(curl -s "$API_URL/api/questions/$QUESTION_ID" | jq -r '.correctAnswer')
  curl -s -X POST "$API_URL/api/quiz/$SESSION/answer" \
    -H "Content-Type: application/json" \
    -d "{\"questionId\": $QUESTION_ID, \"answer\": \"$CORRECT_ANSWER\"}" > /dev/null
  
  # Small delay
  sleep 0.2
done

echo ""
echo "📊 Difficulty Distribution Summary:"
echo "-----------------------------------"
docker compose -f docker-compose.dev.yml exec -T postgres psql -U cyberquiz -d cyberquiz -c "
SELECT 
  q.\"adminDifficulty\",
  COUNT(*) as times_shown,
  ROUND(AVG(qsq.\"questionOrder\"), 1) as avg_position
FROM \"QuizSessionQuestion\" qsq
JOIN \"Question\" q ON q.id = qsq.\"questionId\"
WHERE qsq.\"sessionId\" = $SESSION
GROUP BY q.\"adminDifficulty\"
ORDER BY avg_position;
"

echo ""
echo "✅ Test complete!"
