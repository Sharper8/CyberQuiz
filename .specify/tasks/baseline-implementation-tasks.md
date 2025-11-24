---

description: "Granular task list for CyberQuiz baseline implementation"

---

# Tasks: CyberQuiz Baseline Implementation

**Input**: `.specify/specs/baseline-cyberquiz-specification.md`, `.specify/plans/baseline-implementation-plan.md`
**Prerequisites**: Constitution ratified, implementation plan approved

## Legend
- ID format: T###
- [P]: Can run in parallel (different files / no blocking dependency)
- Story codes: US1 (Basic Quiz Generation & Taking), US2 (Advanced Customization), US3 (Admin Question Management), US4 (Adaptive Difficulty), US5 (Semantic Search)

---
## Phase 0: Environment & Next.js Setup (Foundational)

### T001 [P] Environment: Initialize Next.js App
Short Title: Init Next.js
Description: Scaffold Next.js 15 App Router project with TypeScript strict mode enabled.
Acceptance Criteria:
- `next.config.mjs`, `tsconfig.json` present and strict mode enabled
- App runs locally with `npm run dev` showing home page
Files/Components: `package.json`, `next.config.mjs`, `tsconfig.json`, `app/page.tsx`

### T002 [P] Install shadcn/ui & Tailwind
Short Title: UI Library Setup
Description: Add TailwindCSS, configure `tailwind.config.ts`, install shadcn/ui and initial base components.
Acceptance Criteria:
- Tailwind classes render correctly
- At least Button, Card, Input components available under `src/components/ui/`
- No build warnings for missing PostCSS config
Files/Components: `tailwind.config.ts`, `postcss.config.js`, `src/components/ui/*`, `components.json`

### T003 Docker Compose (Dev) Baseline
Short Title: Dev Compose
Description: Create `docker-compose.yml` with services: app, postgres, pgadmin, qdrant, ollama.
Acceptance Criteria:
- `docker-compose up -d` starts all containers
- Health checks succeed (manual curl / API routes) for DB, Qdrant, Ollama
Files/Components: `docker-compose.yml`, `Dockerfile`

### T004 Docker Compose (Prod) Configuration
Short Title: Prod Compose
Description: Create `docker-compose.prod.yml` with production-ready settings (resource limits, restart policies, volumes).
Acceptance Criteria:
- Containers restart on failure
- Data persisted via volumes for postgres & qdrant
- Environment variables are referenced not hard-coded
Files/Components: `docker-compose.prod.yml`

### T005 Prisma Initialization
Short Title: Prisma Init
Description: Add Prisma, define `schema.prisma` with base tables (questions, question_metadata, quiz_sessions, quiz_session_questions, response_history, scores, ai_request_logs, admin_users).
Acceptance Criteria:
- Migrations run (`npx prisma migrate dev`) successfully
- Tables visible in PostgreSQL
Files/Components: `prisma/schema.prisma`, `prisma/migrations/*`

### T006 Seed Script (Initial Admin & Sample Questions)
Short Title: Seed DB
Description: Write script to create admin user + minimal sample questions for smoke testing.
Acceptance Criteria:
- Running `npm run seed` inserts admin user and ≥3 questions
- Idempotent (second run doesn’t duplicate entries)
Files/Components: `prisma/seed.ts`

### T007 Qdrant Collection Creation Script
Short Title: Qdrant Init
Description: Script to create `cyberquiz_questions` collection with defined vector size and payload schema.
Acceptance Criteria:
- Executing script creates collection if absent
- Collection verified via Qdrant API
Files/Components: `src/lib/db/vector/qdrant-init.ts`

### T008 Health Check API Routes
Short Title: Health Routes
Description: Implement `/api/health`, `/api/health/db`, `/api/health/ai` routes.
Acceptance Criteria:
- Each returns 200 JSON with status details
- AI route shows active provider availability
Files/Components: `app/api/health/route.ts`, `app/api/health/db/route.ts`, `app/api/health/ai/route.ts`

---
## Phase 1: AI Provider Layer

### T009 Define AIProvider Interface
Short Title: AI Interface
Description: Create `AIProvider` TypeScript interface with methods: `generateQuestion`, `validateQuestion`, `generateEmbedding`, `isAvailable`.
Acceptance Criteria:
- Interface exported from `base.ts`
- Types documented with JSDoc
Files/Components: `src/lib/ai/providers/base.ts`, `src/types/ai.ts`

### T010 Ollama Provider Implementation
Short Title: Ollama Provider
Description: Implement provider using REST calls to local Ollama instance; handle model selection, JSON parsing.
Acceptance Criteria:
- Generates a single question using generation prompt template
- Embedding generation returns numeric array length 768
- Proper error handling + retries delegated to retry utility
Files/Components: `src/lib/ai/providers/ollama.ts`

### T011 OpenAI Fallback Provider
Short Title: OpenAI Provider
Description: Implement provider using OpenAI SDK; respects `ALLOW_EXTERNAL_AI` env flag.
Acceptance Criteria:
- Fallback triggered when Ollama `isAvailable()` false
- Logs fallback event
- Sanitizes prompts before sending
Files/Components: `src/lib/ai/providers/openai.ts`

### T012 Mock Provider for Tests
Short Title: Mock Provider
Description: Deterministic provider returning canned responses for unit/integration tests.
Acceptance Criteria:
- Always returns same predictable JSON matching schemas
- Embedding returns fixed vector with checksum validation
Files/Components: `src/lib/ai/providers/mock.ts`

### T013 Rate Limiter Utility
Short Title: Rate Limiter
Description: Implement token bucket limiter configurable per provider.
Acceptance Criteria:
- Rejects calls exceeding configured rate (e.g., 60/min)
- Emits structured log on throttle
Files/Components: `src/lib/ai/rate-limiter.ts`

### T014 Retry Logic Utility
Short Title: Retry Helper
Description: Implement exponential backoff retry (max 3 attempts, jitter).
Acceptance Criteria:
- Retries transient network errors
- Stops retrying on 4xx responses
Files/Components: `src/lib/ai/retry.ts`

### T015 Provider Factory + Fallback
Short Title: Provider Factory
Description: Factory to select primary provider (Ollama) with fallback (OpenAI) + mock override for tests.
Acceptance Criteria:
- Returns active provider instance
- Fallback path tested via simulated failure
Files/Components: `src/lib/ai/factory.ts`

### T016 Prompt Templates (Generation & Validation)
Short Title: Prompts
Description: Create versioned prompt templates with parameter injection.
Acceptance Criteria:
- Exported functions produce sanitized prompt strings
- Version constant included for audit
Files/Components: `src/lib/ai/prompts/generation.ts`, `src/lib/ai/prompts/validation.ts`

---
## Phase 2: Core Backend (Question Pipeline)

### T017 Question Zod Schemas
Short Title: Question Schemas
Description: Define schemas for generated question, stored question, validation result.
Acceptance Criteria:
- Parse AI JSON reliably
- Narrow types (difficulty 0-1, quality 0-1)
Files/Components: `src/lib/validators/question.ts`

### T018 Difficulty Scoring Utility
Short Title: Difficulty Scorer
Description: Implement scoring based on complexity, verbosity, ambiguity heuristics.
Acceptance Criteria:
- Returns number 0-1 consistent with rubric
- Unit tests for edge cases (short, verbose, ambiguous)
Files/Components: `src/lib/utils/difficulty-scorer.ts`

### T019 MITRE Mapping Utility
Short Title: MITRE Mapper
Description: Simple keyword → technique mapping (config map) for initial tagging.
Acceptance Criteria:
- Returns array of valid technique IDs
- Empty array when no match
Files/Components: `src/lib/utils/mitre-mapper.ts`

### T020 Duplicate Detection Utility
Short Title: Duplicate Check
Description: Compare new embedding with existing ones (cosine similarity) to reject near-duplicates.
Acceptance Criteria:
- Rejects similarity >0.95
- Returns boolean + similarity score
Files/Components: `src/lib/utils/duplicate-detector.ts`

### T021 Qdrant Client Wrapper
Short Title: Qdrant Client
Description: Abstraction for upsert/search/delete embedding operations.
Acceptance Criteria:
- `upsertEmbedding(questionId, vector, payload)` stores vector
- `searchSimilar(vector, k)` returns sorted matches
Files/Components: `src/lib/db/vector/qdrant.ts`

### T022 Question Repository (Prisma)
Short Title: Question Repo
Description: CRUD operations + filtered listing for questions.
Acceptance Criteria:
- `findFiltered` supports category, difficulty range, validated flag
- Transactions used for create + metadata write
Files/Components: `src/lib/db/repositories/questions.ts`

### T023 AI Request Log Repository
Short Title: Log Repo
Description: Persist AI request metadata (provider, model, latency, status).
Acceptance Criteria:
- Insert on every provider call
- Query by date range + provider
Files/Components: `src/lib/db/repositories/logs.ts`

### T024 Question Generation Service
Short Title: Generation Service
Description: Orchestrates provider call, scoring, metadata extraction, duplicate check, persistence.
Acceptance Criteria:
- Returns array of stored question IDs
- Skips duplicates gracefully (regenerates or reduces count)
Files/Components: `src/lib/services/question-generator.ts`

### T025 Question Validation Service
Short Title: Validation Service
Description: Runs second-pass AI validation; updates quality score + flags.
Acceptance Criteria:
- Sets `is_validated` false if quality <0.5
- Logs validation attempt
Files/Components: `src/lib/services/question-validator.ts`

### T026 Embedding Generation Endpoint
Short Title: Embed Route
Description: API route for generating embedding for arbitrary text (internal/admin use).
Acceptance Criteria:
- POST returns embedding length 768
- Validates input text length
Files/Components: `app/api/ai/embed/route.ts`

### T027 Question Generation API Route
Short Title: Generate Route
Description: Exposes question generation (`POST /api/ai/generate`) with topic, difficulty, count.
Acceptance Criteria:
- Validates request body via Zod
- Returns structured success response with question summaries
Files/Components: `app/api/ai/generate/route.ts`

### T028 Question Validation API Route
Short Title: Validate Route
Description: Exposes validation (`POST /api/ai/validate`) for existing question ID.
Acceptance Criteria:
- Returns updated quality score + recommendation
- Handles non-existent ID (404)
Files/Components: `app/api/ai/validate/route.ts`

### T029 Questions CRUD API
Short Title: Questions CRUD
Description: List/create via `GET/POST /api/questions`; detail/update/delete via `/api/questions/[id]`.
Acceptance Criteria:
- Pagination support (limit/offset)
- Delete cascades embedding removal
Files/Components: `app/api/questions/route.ts`, `app/api/questions/[id]/route.ts`

---
## Phase 3: Quiz Engine & Sessions (US1)

### T030 Quiz Session Schemas
Short Title: Session Schemas
Description: Zod schemas for creating session, submitting answers, fetching results.
Acceptance Criteria:
- Validation ensures question IDs belong to session
- Proper error messages on invalid answer format
Files/Components: `src/lib/validators/quiz.ts`

### T031 Quiz Engine Service
Short Title: Quiz Engine
Description: Creates sessions, selects questions, manages state transitions.
Acceptance Criteria:
- Respects requested count and difficulty filter
- Returns session object without correct answers
Files/Components: `src/lib/services/quiz-engine.ts`

### T032 Scoring Service
Short Title: Scoring Logic
Description: Calculates score, accuracy %, aggregates time taken.
Acceptance Criteria:
- Handles unanswered questions gracefully
- Returns consistent scoring object
Files/Components: `src/lib/services/scoring.ts`

### T033 Session Repository
Short Title: Session Repo
Description: CRUD + query for quiz sessions and join table operations.
Acceptance Criteria:
- Stores ordered question list
- Fetch includes session metadata
Files/Components: `src/lib/db/repositories/sessions.ts`

### T034 Scores Repository
Short Title: Scores Repo
Description: Persist score results + leaderboard queries.
Acceptance Criteria:
- Leaderboard sorted by accuracy desc, time asc
- Supports date range filtering
Files/Components: `src/lib/db/repositories/scores.ts`

### T035 Session Creation API Route
Short Title: Create Session Route
Description: `POST /api/quiz/sessions` initializes new session.
Acceptance Criteria:
- Returns sessionId + question stubs
- Validates difficulty + topic
Files/Components: `app/api/quiz/sessions/route.ts`

### T036 Session Fetch API Route
Short Title: Get Session Route
Description: `GET /api/quiz/sessions/[id]` returns current session state.
Acceptance Criteria:
- Does NOT include correct answers
- 404 for invalid id
Files/Components: `app/api/quiz/sessions/[id]/route.ts`

### T037 Submit Answers Route
Short Title: Submit Route
Description: `POST /api/quiz/sessions/[id]/submit` with answers array.
Acceptance Criteria:
- Prevent double submission
- Returns scoring summary
Files/Components: `app/api/quiz/sessions/[id]/submit/route.ts`

### T038 Results Route
Short Title: Results Route
Description: `GET /api/quiz/sessions/[id]/results` after submission.
Acceptance Criteria:
- Includes explanations + correctness breakdown
- 409 if session not submitted yet
Files/Components: `app/api/quiz/sessions/[id]/results/route.ts`

### T039 Leaderboard API
Short Title: Leaderboard Route
Description: `GET/POST /api/scores` for submitting and retrieving scores.
Acceptance Criteria:
- POST persists score
- GET filters by topic/difficulty/time period
Files/Components: `app/api/scores/route.ts`

---
## Phase 4: Frontend UI (US1, US2)

### T040 Home Page Topic Selection
Short Title: Home Topics
Description: Implement interactive topic cards with difficulty presets.
Acceptance Criteria:
- Selecting topic moves to quiz setup
- Responsive layout
Files/Components: `app/page.tsx`, `src/components/TopicCard.tsx`

### T041 Quiz Setup Component
Short Title: Quiz Setup
Description: Collect topic, difficulty, count, questionType.
Acceptance Criteria:
- Validation prevents out-of-range values
- Calls session creation route
Files/Components: `src/components/QuizSetup.tsx`

### T042 Question Display Component
Short Title: Question Card
Description: Render question text and options; manage selection state.
Acceptance Criteria:
- Only one answer selectable
- Emits change via callback
Files/Components: `src/components/QuestionCard.tsx`

### T043 Timer & Progress Components
Short Title: Timer/Progress
Description: Show elapsed time and progress bar.
Acceptance Criteria:
- Accurate second increments
- Progress updates instantly on answer
Files/Components: `src/components/Timer.tsx`, `src/components/ProgressIndicator.tsx`

### T044 Results Summary Component
Short Title: Results Summary
Description: Display score, accuracy %, time, and summary list.
Acceptance Criteria:
- Shows per-question correctness
- Allows toggling explanation details
Files/Components: `src/components/ResultsSummary.tsx`

### T045 Leaderboard Component
Short Title: Leaderboard UI
Description: Table view with filters (topic, difficulty, period).
Acceptance Criteria:
- Updates after score submission without reload
- Paginated if >10 entries
Files/Components: `src/components/Leaderboard.tsx`

### T046 Adaptive Difficulty Hook (Future Placeholder)
Short Title: Adaptive Hook
Description: Placeholder hook to adjust next session difficulty based on past performance.
Acceptance Criteria:
- Returns recommended difficulty enum
- Safe default (no adaptation) if insufficient history
Files/Components: `src/hooks/useAdaptiveDifficulty.ts`

### T047 Quiz Flow Integration Page
Short Title: Quiz Page
Description: Orchestrates setup → session → submission → results.
Acceptance Criteria:
- Navigates sequentially without full page reloads
- Handles errors (API failure) gracefully
Files/Components: `app/quiz/page.tsx`

### T048 Results Page Integration
Short Title: Results Page
Description: Retrieves and displays final results + leaderboard snippet.
Acceptance Criteria:
- Redirects to quiz if results not ready
- Performance: loads <1s after submission
Files/Components: `app/score/page.tsx`

---
## Phase 5: Admin Dashboard (US3)

### T049 Admin Login Page
Short Title: Admin Login
Description: Form to authenticate with email/password using JWT.
Acceptance Criteria:
- Incorrect credentials show error
- Successful login sets HTTP-only cookie
Files/Components: `app/admin-login/page.tsx`

### T050 Admin Auth Middleware
Short Title: Auth Middleware
Description: Server-side JWT verification for admin routes.
Acceptance Criteria:
- Blocks unauthenticated requests (401)
- Parses user id + role into request context
Files/Components: `src/lib/middleware/auth.ts`

### T051 Admin Questions Table
Short Title: Question Table
Description: Paginated table with filtering and quality indicators.
Acceptance Criteria:
- Column sorting (difficulty, quality)
- Filter chips (validated/unvalidated)
Files/Components: `src/components/AdminQuestionTable.tsx`

### T052 Question Detail Modal
Short Title: Detail Modal
Description: Shows full text, answer, explanation, metadata, embedding ID.
Acceptance Criteria:
- Accessible (focus trap)
- Close restores scroll position
Files/Components: `src/components/QuestionDetailModal.tsx`

### T053 Bulk Validate Action
Short Title: Bulk Validate
Description: Select multiple questions → mark validated.
Acceptance Criteria:
- Optimistic UI update
- Backend confirmation; rollback on error
Files/Components: `app/api/admin/questions/bulk-validate/route.ts`

### T054 Bulk Delete Action
Short Title: Bulk Delete
Description: Select and delete multiple questions (cascade embeddings).
Acceptance Criteria:
- Confirmation dialog required
- Embeddings removed from Qdrant
Files/Components: `app/api/admin/questions/bulk-delete/route.ts`

### T055 AI Logs Viewer
Short Title: Logs Viewer
Description: Paginated AI request log table with provider/status filters.
Acceptance Criteria:
- Latency displayed (ms)
- Failure rows highlighted
Files/Components: `src/components/AILogsViewer.tsx`, `app/api/admin/logs/route.ts`

### T056 Usage Dashboard
Short Title: Usage Dashboard
Description: Charts for avg quality score, provider distribution, error rate.
Acceptance Criteria:
- Aggregated queries performant (<500ms)
- Visual components accessible
Files/Components: `src/components/UsageDashboard.tsx`, `app/api/admin/dashboard/route.ts`

---
## Phase 6: Cross-Cutting (Security & Observability)

### T057 Structured Logging Middleware
Short Title: Logger Middleware
Description: Implement request logging (method, path, duration, status, userId) using Winston.
Acceptance Criteria:
- Logged JSON lines
- Error stack traces included at level=error only
Files/Components: `src/lib/middleware/logger.ts`

### T058 Error Handling Middleware
Short Title: Error Handler
Description: Centralized try/catch wrapper for API route handlers.
Acceptance Criteria:
- Returns `{ success:false, error:"message" }`
- Differentiates 4xx vs 5xx
Files/Components: `src/lib/middleware/error-handler.ts`

### T059 Rate Limiter Middleware
Short Title: Rate Limiter
Description: Apply per-IP limits for `/api/ai/*` and `/api/quiz/*` routes.
Acceptance Criteria:
- Exceeding limit returns 429 JSON
- Resets counts at interval
Files/Components: `src/lib/middleware/rate-limiter.ts`

### T060 Metrics Endpoint
Short Title: Metrics Route
Description: Expose Prometheus-format metrics at `/api/metrics`.
Acceptance Criteria:
- Includes request counts + latency histograms
- Scrape returns 200
Files/Components: `app/api/metrics/route.ts`, `src/lib/middleware/metrics.ts`

### T061 Security Headers & CORS
Short Title: Security Config
Description: Add headers (CSP, X-Content-Type-Options) and CORS whitelist.
Acceptance Criteria:
- Verified via browser dev tools
- Rejects disallowed origins
Files/Components: `src/lib/middleware/security.ts`, `src/lib/middleware/cors.ts`

### T062 Env Validation
Short Title: Env Validator
Description: Zod schema validating required env vars at startup.
Acceptance Criteria:
- Missing vars cause process exit with clear message
Files/Components: `src/lib/validators/env.ts`

---
## Phase 7: Testing & QA

### T063 Jest/Vitest Configuration
Short Title: Test Config
Description: Configure Jest or Vitest (choose one) for TS project + coverage reporting.
Acceptance Criteria:
- `npm test` runs and reports coverage
- TS paths resolve
Files/Components: `jest.config.js` or `vitest.config.ts`

### T064 Playwright Setup
Short Title: Playwright Init
Description: Configure Playwright for E2E quiz and admin flows.
Acceptance Criteria:
- `npx playwright test` executes sample test
- HTML report generated
Files/Components: `playwright.config.ts`, `tests/e2e/*`

### T065 Unit Tests: AI Provider Layer
Short Title: AI Unit Tests
Description: Tests for provider factory, fallback, retry, rate limiting.
Acceptance Criteria:
- Simulated Ollama failure triggers fallback
- Rate limit test passes
Files/Components: `tests/unit/ai/providers.test.ts`, `tests/unit/ai/retry.test.ts`

### T066 Unit Tests: Utilities
Short Title: Utility Tests
Description: Difficulty scorer, MITRE mapper, duplicate detector.
Acceptance Criteria:
- Edge cases validated
- All pass with coverage >80%
Files/Components: `tests/unit/utils/*`

### T067 Integration Tests: Question Pipeline
Short Title: Pipeline Tests
Description: End-to-end: generate → validate → store → retrieve.
Acceptance Criteria:
- All entities persisted correctly
- Duplicate rejection scenario tested
Files/Components: `tests/integration/api/questions.test.ts`

### T068 Integration Tests: Quiz Flow
Short Title: Quiz Integration
Description: Full session lifecycle: create, fetch, submit, results.
Acceptance Criteria:
- Results match expected scoring
- Invalid session ID returns 404
Files/Components: `tests/integration/api/quiz.test.ts`

### T069 E2E Test: User Quiz Journey
Short Title: E2E Quiz
Description: Browser-level test generating quiz and completing it.
Acceptance Criteria:
- Navigates through all UI states
- Final score displayed
Files/Components: `tests/e2e/quiz-flow.spec.ts`

### T070 E2E Test: Admin Management
Short Title: E2E Admin
Description: Login, view questions, validate, view logs.
Acceptance Criteria:
- Validates question successfully
- Logs page shows entries
Files/Components: `tests/e2e/admin-flow.spec.ts`

### T071 Load Test Script (k6)
Short Title: Load Test
Description: Simulate 100 concurrent quiz sessions.
Acceptance Criteria:
- p95 latency <500ms
- Error rate <5%
Files/Components: `tests/load/quiz-load.js`

### T072 Security Tests
Short Title: Security Tests
Description: Attempt SQL injection, XSS, CSRF, auth bypass.
Acceptance Criteria:
- All attempts blocked
- Logs contain security events
Files/Components: `tests/security/owasp.test.ts`

---
## Phase 8: Documentation Polish

### T073 API Documentation Generation
Short Title: API Docs
Description: Generate OpenAPI spec from Zod schemas + annotate endpoints.
Acceptance Criteria:
- `openapi.yaml` includes all CRUD + AI routes
- Renderable in Swagger UI locally
Files/Components: `openapi.yaml`, `docs/API.md`

### T074 Architecture Diagram
Short Title: Architecture Docs
Description: Mermaid diagrams for system + data flow.
Acceptance Criteria:
- Diagram matches implemented structure
- Included in `ARCHITECTURE.md`
Files/Components: `docs/ARCHITECTURE.md`

### T075 Logging & Metrics Docs
Short Title: Ops Docs
Description: Document log schema, metrics keys, alert thresholds.
Acceptance Criteria:
- `LOGGING.md` + `METRICS.md` created
- Referenced by runbooks
Files/Components: `docs/LOGGING.md`, `docs/METRICS.md`

### T076 Deployment Runbook
Short Title: Runbook
Description: Step-by-step deploy, rollback, backup/restore instructions.
Acceptance Criteria:
- Tested manually on staging
- Includes troubleshooting section
Files/Components: `docs/RUNBOOKS.md`

---
## Parallel & Dependency Notes
- All [P] tasks can be assigned concurrently.
- Complete Phase 0 tasks before AI layer (Phase 1).
- Question pipeline tasks (T017–T029) depend on provider layer completion.
- Quiz engine tasks depend on question CRUD (T029) and schemas (T017, T030).
- Admin dashboard tasks depend on CRUD + validation + logging repos.
- Testing tasks (T063+) begin once corresponding functional areas stubbed (can start early with mocks).

---
## Acceptance Gate Summary
- Foundation Gate: T001–T008, T005 migration success
- AI Layer Gate: T009–T016 all pass + fallback works
- Question Pipeline Gate: T017–T029 generation → validation → storage verified
- Quiz MVP Gate: T030–T039 full user flow validated
- Admin Gate: T049–T056 operational with auth
- Security Gate: T057–T062 enforced policies & headers
- Test Coverage Gate: T063–T072 meet coverage & performance targets
- Documentation Gate: T073–T076 published & accurate

---
## Quality Metrics Tracking (per task category)
- Code Coverage Targets: Utilities ≥80%, Services ≥80%, Routes ≥70%
- Latency Targets: Generation <3s/question (Ollama), API p95 <500ms
- Reliability: Fallback success rate 100% simulated

---
## Open Questions (Flag for Clarification)
- Adaptive difficulty algorithm specifics (placeholder T046) – requires user performance rubric.
- Embedding vector size final confirmation (currently 768) – adjust if model differs.
- Rate limiter global vs per-route granularity – verify product expectation.

---
## NEXT ACTION
Start with Phase 0 (T001–T008). Ensure migrations (T005) and health endpoints (T008) green before beginning AI provider tasks.
