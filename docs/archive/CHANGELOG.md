# CyberQuiz - Recent Updates

## Summary of Changes

This document outlines the recent improvements and fixes implemented in the CyberQuiz platform.

## 1. Fixed React Hydration Error (#310)

**Problem:** Application error on page load with React error #310 (hydration mismatch)

**Solution:** 
- Removed dynamic import with `ssr: false` for the Leaderboard component
- Changed to standard import to avoid hydration mismatches
- File: `app/page.tsx`

## 2. Similarity Detection System (Gabriel's Branch Integration)

**Problem:** Similarity calculations were not accessible to admins for review

**Solution:**
- Added `potentialDuplicates` JSON field to Question model (stores `[{id: 123, similarity: 0.85}, ...]`)
- Created new API endpoint: `GET /api/admin/questions/similar?id=123`
- Updated question generator to calculate and store similarity for ALL question states (to_review, accepted, rejected)
- Admins can now see similar questions when reviewing to avoid duplicates

**Files Modified:**
- `prisma/schema.prisma` - Added potentialDuplicates field
- `prisma/migrations/20260114155034_add_potential_duplicates/migration.sql` - Migration
- `app/api/admin/questions/similar/route.ts` - New endpoint
- `src/lib/services/question-generator.ts` - Updated to store similarity scores

## 3. Ollama Model Download on Deployment

**Problem:** Docker containers started before Ollama models were downloaded, causing "model not found" errors

**Solution:**
- Updated `scripts/init-ollama.sh` to pull models in FOREGROUND (not background)
- Added healthcheck to Ollama container that verifies models are available
- Updated nextjs container dependency to wait for `ollama: service_healthy` instead of `service_started`
- Models now fully download before app starts accepting requests

**Configuration:**
- Start period: 5 minutes (allows time for model downloads)
- Healthcheck: `ollama list` command every 30 seconds

**Files Modified:**
- `scripts/init-ollama.sh`
- `docker-compose.dev.yml`

## 4. Redesigned Question Generation Pool System

**Problem:** Manual question generation was slow and required waiting for batch completion

**Solution - Smart Auto-Generation:**
- **Target Pool Size:** Admin sets a target number of questions to maintain (default: 50)
- **Auto-Generation on Review:** When admin approves a question, system automatically generates 1 new question in the background
- **Always-Full Pool:** The "to_review" queue stays filled without manual intervention
- **Non-Blocking:** Generation happens in background; admin can continue reviewing

**How it Works:**
1. Admin sets target pool size via `/api/admin/generation-settings` (e.g., 100 questions)
2. System generates questions up to target when below threshold
3. Each time admin accepts a question, 1 new question auto-generates
4. Pool stays at target size automatically

**API Endpoints:**
- `GET /api/admin/generation-settings` - Get current settings
- `POST /api/admin/generation-settings` - Update settings (targetPoolSize, autoGenerateEnabled, etc.)
- `POST /api/admin/maintain-pool` - Manually trigger pool maintenance

**Files Modified:**
- `app/api/admin/generation-settings/route.ts` (already existed)
- `app/api/admin/questions/review/route.ts` - Added auto-generation trigger
- `src/lib/services/question-generator.ts` - Uses GenerationSettings from DB

## 5. Environment Configuration

**Updated:**
- `.env.local` - Changed default admin password to be more secure
- Both `.env.dev` and `.env.local` now have consistent structure

## Database Schema Changes

### New Field: potentialDuplicates (Question table)
```sql
ALTER TABLE "Question" ADD COLUMN "potentialDuplicates" JSONB;
```

Stores array of similar questions: `[{id: 123, similarity: 0.85}, {id: 456, similarity: 0.78}]`

### Existing Table: GenerationSettings
Already in schema, now actively used for:
- `targetPoolSize` - Number of questions to maintain in to_review
- `autoGenerateEnabled` - Enable/disable auto-generation
- `generationTopic` - Default topic for generation
- `generationDifficulty` - Default difficulty level
- `maxConcurrentGeneration` - Max questions per batch

## Migration Required

After pulling these changes, run:
```bash
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d --build
```

The migration will automatically apply on container startup.

## Testing the Changes

### 1. Test Ollama Model Download
```bash
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml logs -f ollama
# Wait for "✅ llama3.1:8b pulled successfully"
# Wait for "✅ nomic-embed-text pulled successfully"
```

### 2. Test Similarity Detection
1. Go to Admin panel
2. Generate some questions
3. Review a question in "to_review"
4. Click on question to see similar questions (if any exist with similarity > 0.75)

### 3. Test Auto-Generation
1. Set target pool size: `POST /api/admin/generation-settings` with `{"targetPoolSize": 50}`
2. Check current pool: `GET /api/admin/questions/review?stats=true`
3. Accept a question
4. Check pool again - should have triggered generation of 1 new question

## Performance Improvements

- **Faster Startup:** Models download once and persist in Docker volume
- **Background Generation:** No more waiting for question batches
- **Similarity Pre-calculated:** No real-time calculation needed during admin review

## Security Note

Changed default admin password from `change-this-secure-password` to `AdminSecure2026!` in `.env.local`. 

**⚠️ IMPORTANT:** Change this in production!

## Future Enhancements

Potential improvements for next iteration:
- Web UI for generation settings (currently API-only)
- Multiple topic pools with different target sizes
- Batch similarity recalculation for existing questions
- Admin notification when pool falls below threshold

---

**Questions?** Check the API documentation or review the code comments in modified files.
