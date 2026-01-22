# Code Audit Report - Duplicate Detection & Embeddings

## 🔴 Critical Issues Found

### 1. **Duplicate `generateQuestionHash()` Function**
- **Location 1**: `src/lib/services/question-generator.ts:24`
- **Location 2**: `src/lib/services/buffer-maintenance.ts:242`
- **Issue**: Same function implemented twice with identical logic
- **Impact**: Code duplication, harder to maintain, inconsistent updates

```typescript
// Both files implement:
function generateQuestionHash(questionText: string): string {
  const normalized = questionText
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return crypto.createHash('sha256').update(normalized).digest('hex');
}
```

### 2. **Duplicate Embedding/Similarity Logic**
Both services independently implement:
- `checkForDuplicates()` function (buffer-maintenance.ts:214)
- Question embedding generation logic
- Qdrant search/similarity threshold checking
- Result interpretation logic

### 3. **Shared Dependencies With Different Thresholds**
- `buffer-maintenance.ts`: Uses `SEMANTIC_DUPLICATE_THRESHOLD = 0.90`
- `question-generator.ts`: Uses similar but separate duplicate detection
- Risk: Inconsistent duplicate handling across generation paths

## ✅ Refactoring Actions Completed

### 1. **Restored Old Admin UI**
- **From**: git commit `4042a65`
- **Components Restored**:
  - Full question list with filters (all, to_review, accepted, rejected)
  - Stats cards showing pool status
  - Accept/Reject buttons with proper status transitions
  - Potential duplicate detection display
  - Manual question addition dialog
  - Answer display (OUI/Vaux)

### 2. **Cleaned Up Unused Code**
- Deleted: `src/components/QuestionPoolViewer.tsx` (replaced by restored admin page)
- Deleted: `app/api/admin/questions/route.ts` (not needed with old API structure)
- Removed: Separate `/admin/pools` page (merged back to `/admin`)
- Updated: AdminSidebar to remove "Pool de Questions" link

### 3. **Updated Navigation**
- Changed sidebar from "Génération" + "Pool de Questions" to single "Banque de Questions" entry
- All question management now in main admin page with filters

## 📋 Recommended Next Steps

### Priority 1: Extract Duplicate Code
Create `src/lib/services/duplicate-detection.ts`:
```typescript
export const SEMANTIC_DUPLICATE_THRESHOLD = 0.90;
export const MAX_GENERATION_RETRIES = 3;
export const RECENT_QUESTIONS_WINDOW_HOURS = 48;

export function generateQuestionHash(questionText: string): string {
  // Single implementation
}

export async function checkForDuplicates(
  questionText: string,
  embedding: number[]
): Promise<boolean> {
  // Unified duplicate detection logic
}
```

Then update both services to import from this single source.

### Priority 2: Consolidate Embedding Operations
Create `src/lib/services/embedding-operations.ts`:
- Centralize Qdrant upsert logic
- Standardize embedding payload format
- Single responsibility for similarity searches

### Priority 3: Performance Optimization
- Current `generateQuestionHash()` normalizes in runtime
  - Optimize for repeated calls
  - Cache normalized forms if frequently re-checked

## 🔍 Code Locations Reference

### Hash Generation
- `src/lib/services/question-generator.ts:24-30` ← MOVE TO duplicate-detection.ts
- `src/lib/services/buffer-maintenance.ts:242-250` ← DELETE (use imported)

### Duplicate Detection
- `src/lib/services/buffer-maintenance.ts:214-236` ← CONSOLIDATE
- `src/lib/services/question-generator.ts:68-80` ← CONSOLIDATE (different path)

### Embedding Operations
- `src/lib/services/buffer-maintenance.ts:184-190`
- `src/lib/services/question-generator.ts:265-273`
- `src/lib/services/question-generator.ts:417-425`
- `src/lib/services/question-generator.ts:571-579`
- `src/lib/services/question-generator.ts:673-681`

## ✨ Frontend Status

### Restored Features
✅ Filter questions by status (all, to_review, accepted, rejected)
✅ Display question metadata with badges
✅ Show AI provider information
✅ Display potential duplicates with similarity scores
✅ Manual question addition
✅ Accept/Reject buttons
✅ Pool status indicators
✅ Statistics cards

### Features Still Available
✅ Export/Import functionality (moved to action bar)
✅ Generation Settings panel
✅ Real-time buffer status monitoring
✅ Accessibility standards compliance
