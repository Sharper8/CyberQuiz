# Question Similarity Detection System

## Overview
The platform has a multi-layered similarity detection system to ensure question uniqueness and quality. This prevents duplicate questions from being added to the active quiz pool.

---

## How It Works

### 1️⃣ **Exact Duplicate Detection (During Generation)**

**Threshold:** 95% similarity  
**Action:** Auto-reject + retry up to 3 times

When a new question is generated:
```
1. Generate question text → Create embedding (vector)
2. Search Qdrant for similar questions (top 1 match)
3. If similarity > 0.95 → This is an exact duplicate
   → Reject this generation
   → Retry with different context prompt
   → Repeat up to 3 times
4. If all 3 attempts produce duplicates → Throw error, abort
```

**Example:**
- Generated: "HTTPS provides encryption for data in transit. True/False?"
- Existing: "HTTPS encrypts data transmitted over the network. True/False?"
- Similarity: 0.98 (98%) → REJECTED ✗

---

### 2️⃣ **Active Pool Conflict Detection (New)**

**Threshold:** 80% similarity to **accepted** questions  
**Action:** Auto-reject + retry up to 3 times

This is the KEY improvement that ensures new questions are always "new":

```
1. After passing exact duplicate check
2. Search all ACCEPTED questions in the pool
3. If any accepted question has > 80% similarity
   → This would duplicate the active pool
   → Reject this generation
   → Retry with different context
   → Repeat up to 3 times
4. If all 3 attempts conflict → Throw error, abort
```

**Why 80%?** Because:
- 95%+ = exact phrase duplicates (unacceptable)
- 80%+ = semantically very similar (waters down question diversity)
- <80% = meaningfully different (acceptable variation)

**Example:**
```
Active Pool Contains:
├─ Q1 (Accepted): "What does HTTPS protect against?"
└─ Q2 (Accepted): "HTTPS provides encryption. True/False?"

New Generation:
├─ "HTTPS secures communication. True/False?"
├─ Similarity to Q2: 0.82 (82%)
└─ ACTION: REJECT ✗ (conflicts with active pool)

Retry:
├─ "What is the role of SSL/TLS certificates?"
├─ Similarity to Q2: 0.65 (65%)
└─ ACTION: ACCEPT ✓ (meaningfully different)
```

---

### 3️⃣ **Semantic Similarity Flagging (For Admin Review)**

**Threshold:** 75-95% similarity  
**Action:** Allow but flag with badge in admin panel

Questions that pass the above checks but have 75-95% similarity are:
- **Stored** in the database with status `to_review`
- **Flagged** with a ⚠️ badge showing count of similar questions
- **Displayed** in admin modal for side-by-side comparison

```
Admin sees: "⚠️ 2 similaire(s)" badge
Can click to view:
  ├─ New question: "Network protocols like HTTPS use encryption"
  └─ Similar existing question: "HTTPS is an encrypted protocol. T/F?"
```

Admin can then:
- ✅ **Accept** if they think they're different enough
- ❌ **Reject** if they're actually duplicates
- 📊 **Decide** based on visual comparison

---

## Three-Layer Protection

```
Layer 1: EXACT DUPLICATES
═══════════════════════════
Threshold: > 95% similarity
Check: ALL questions
Action: Auto-reject + retry
Example: Word-for-word identical or rearranged

Layer 2: POOL CONFLICTS  (NEW)
═══════════════════════════════
Threshold: > 80% similarity to ACCEPTED questions
Check: Only active pool
Action: Auto-reject + retry
Example: Semantically covers same topic/answer
Result: Guarantees new questions are truly new

Layer 3: SEMANTIC FLAGS
═══════════════════════
Threshold: 75-95% similarity
Check: ALL questions
Action: Store + flag for admin review
Example: Similar but acceptable variations
Result: Admin gets visibility + final say
```

---

## Practical Impact

### Before This System:
❌ Could generate "HTTPS encrypts data. T/F?" and "HTTPS provides encryption. T/F?"  
❌ Could have 20 questions all asking about the same concept  
❌ No automatic deduplication logic  

### After This System:
✅ Cannot generate exact duplicates  
✅ Cannot generate questions too similar to accepted pool  
✅ Can review remaining semantic similarities with admin  
✅ Questions pool grows with meaningful variety  

---

## Configuration

In `src/lib/services/question-generator.ts`:

```typescript
const DUPLICATE_SIMILARITY_THRESHOLD = 0.95;           // Exact duplicates
const ACCEPTED_POOL_SIMILARITY_THRESHOLD = 0.80;       // Active pool conflicts
const SEMANTIC_SIMILARITY_THRESHOLD = 0.75;            // Admin review threshold
const MAX_GENERATION_RETRIES = 3;                      // Retry attempts
const CACHE_TARGET = 5;                                // Questions per category
```

Adjust these values to be more/less strict:
- **Higher threshold** = Allow more similar questions (less strict)
- **Lower threshold** = Reject more similar questions (more strict)

---

## Database & Search

- **Qdrant Vector DB:** Stores embeddings of all questions
- **Cosine Similarity:** Used to compare embeddings (0.0 = different, 1.0 = identical)
- **Max Searches:** Each generation searches up to 20 previous questions
- **Embedding Size:** 768-dimensional vectors (from embedding model)

---

## Troubleshooting

### "Failed to generate unique question after 3 attempts"
**Reason:** Category has too many similar questions already  
**Solution:**
- Review existing questions for this category
- Reject semantic duplicates from the "En attente" tab
- Increase `CACHE_TARGET` or create new categories

### Too many semantic similarity flags appearing
**Reason:** `SEMANTIC_SIMILARITY_THRESHOLD` is too low  
**Solution:**
- Increase from 0.75 to 0.80 to show only strong similarities
- Or keep low to give admin more visibility (recommended)

### New questions rejected too often
**Reason:** `ACCEPTED_POOL_SIMILARITY_THRESHOLD` might be too strict  
**Solution:**
- Lower from 0.80 to 0.75 (but still rejects pool conflicts)
- Or accept some pending questions to thin the to_review pile

---

## Summary

The system ensures **question diversity** through:

1. **Automatic rejection** of exact duplicates + retries
2. **Automatic rejection** of anything too similar to active pool + retries
3. **Admin visibility** of remaining semantic similarities
4. **Human judgment** as final arbitrator

Result: A high-quality, diverse question pool with no accidental duplicates.
