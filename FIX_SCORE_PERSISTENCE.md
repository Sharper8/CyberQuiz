# 🔧 Quiz Score Persistence Fix

## Problem
After completing a quiz, the score was not appearing on the homepage leaderboard.

## Root Cause
The quiz flow had a critical missing step:

1. User enters username and selects mode on homepage
2. **MISSING**: Create quiz session via `/api/quiz/start` endpoint
3. Redirect to quiz page with `sessionId` parameter
4. User completes quiz
5. Call `/api/quiz/complete` with `sessionId` to save score

**What was happening:**
- Steps 2-3 were skipped
- User was redirected directly to `/quiz` WITHOUT a `sessionId`
- When quiz completed, `saveScore()` checked for `sessionId` in URL
- Finding none, it would `console.warn()` and return early - **silently skipping the save**
- Score was never persisted to database
- Leaderboard remained empty

## Solution
Modified `app/page.tsx` `handleStart()` function to:

```typescript
// BEFORE: Direct redirect (missing sessionId)
router.push(`/quiz?mode=${mode}&pseudo=${encodeURIComponent(trimmed)}`);

// AFTER: Create session first, then redirect with sessionId
const response = await fetch('/api/quiz/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: trimmed }),
});

const data = await response.json();
const { sessionId } = data;

router.push(`/quiz?mode=${mode}&pseudo=${encodeURIComponent(trimmed)}&sessionId=${sessionId}`);
```

## Changes Made

### Files Modified
1. **app/page.tsx**
   - Made `handleStart()` async
   - Added `/api/quiz/start` call to create session
   - Extract `sessionId` from response
   - Pass `sessionId` in URL to quiz page

2. **app/quiz/page.tsx**
   - Added debug logging to `saveScore()` function
   - Log sessionId, score, and API response

3. **app/api/quiz/complete/route.ts**
   - Added debug logging at key points:
     - Request received with parameters
     - Session found (or not found)
     - Score record created
     - Session marked as completed

### Logging Added
For troubleshooting future issues, added console.logs with `[saveScore]` and `[API/quiz/complete]` prefixes to trace the complete flow.

## Validation

### Test Case
```bash
# 1. Create session
POST /api/quiz/start
Body: {"username": "TestPlayer123"}
Response: {"sessionId": 1, ...}

# 2. Complete quiz with session
POST /api/quiz/complete
Body: {
  "sessionId": 1,
  "score": 8,
  "totalQuestions": 10
}
Response: {"success": true, "scoreId": 1}

# 3. Verify on leaderboard
GET /api/scores
Response: {"leaderboard": [{"username": "TestPlayer123", "score": 8, ...}]}
```

### Result
✅ Score persists to database
✅ Score appears on leaderboard
✅ Score visible on homepage after quiz completion

## Testing Instructions

1. **Start a quiz:**
   - Go to homepage (http://localhost:3333)
   - Enter username
   - Select a mode
   - Click "Commencer"
   - Check browser console - should see logs with sessionId

2. **Complete the quiz:**
   - Answer all questions
   - Finish the quiz
   - Check browser console - should see `[saveScore] Success!`
   - Check app logs - should see `[API/quiz/complete] Score created`

3. **Verify on leaderboard:**
   - You should be redirected to `/score` page showing your score
   - Your score should appear on homepage leaderboard (below quiz section)
   - Can verify via API: `curl http://localhost:3333/api/scores`

## Commit
- **Hash**: 92befd1
- **Message**: "fix: Missing sessionId in quiz flow - create session before redirecting to quiz page"
- **Impact**: Leaderboard now fully functional, scores persist properly

## Before & After

### Before
```
Homepage → Click Start → /quiz (no sessionId) → Quiz complete → saveScore skips → Score lost
                                                                     ❌ Returns early
```

### After
```
Homepage → Click Start → Call /api/quiz/start → Get sessionId → /quiz?sessionId=X 
         → Quiz complete → saveScore with sessionId → Score saved ✅ → Shows on leaderboard
```
