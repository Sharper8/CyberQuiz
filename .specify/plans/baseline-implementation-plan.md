# Implementation Plan: CyberQuiz - Adaptive Cybersecurity Quiz Generator

**Branch**: `baseline-ai-quiz-generator` | **Date**: 2025-11-21 | **Spec**: [baseline-cyberquiz-specification.md](../specs/baseline-cyberquiz-specification.md)

**Input**: Feature specification for automated cybersecurity quiz generation with AI, metadata enrichment, and dynamic quiz sessions.

---

## Summary

Build a containerized web application that generates cybersecurity quiz questions using local AI (Ollama) with external provider fallback (OpenAI), enriches them with metadata (difficulty scoring, MITRE ATT&CK mapping), stores them in PostgreSQL + Qdrant vector database, and provides an interactive quiz interface with adaptive difficulty and admin quality control dashboard.

**Technical Approach**: Next.js 15 App Router with server-side AI integration, provider-agnostic abstraction layer, Prisma ORM for PostgreSQL, Qdrant SDK for vector operations, containerized microservices architecture with Docker Compose.

---

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js 18+  
**Framework**: Next.js 15 (App Router), React 18+  
**Primary Dependencies**: 
- Prisma ORM (PostgreSQL client)
- @qdrant/js-client-rest (vector database)
- Zod (schema validation)
- shadcn/ui + Radix UI (component library)
- TailwindCSS 3.x (styling)
- bcryptjs, jsonwebtoken (authentication)
- AI SDKs: Ollama REST API, OpenAI SDK

**Storage**: 
- PostgreSQL 15 (relational: users, questions, sessions, scores, metadata, logs)
- Qdrant (vector: question embeddings for semantic search)

**Testing**: 
- Jest (unit tests)
- React Testing Library (component tests)
- Playwright (E2E tests)
- Supertest (API integration tests)

**Target Platform**: 
- Development: Docker Compose (local)
- Production: Docker containers on Linux server (on-premise deployment)

**Project Type**: Web application (Next.js full-stack)

**Performance Goals**: 
- API response: p95 <500ms, p99 <1000ms
- Question generation: <3s per question (Ollama), <5s (OpenAI)
- Vector search: <300ms for top-10 with 10k+ embeddings
- Concurrent users: 100 without degradation
- Quiz completion flow: <2 minutes (topic selection → results)

**Constraints**: 
- Zero external AI calls when `ALLOW_EXTERNAL_AI=false`
- All AI logic server-side only (no browser API calls)
- Container startup: <30s all services
- Test coverage: >80% business logic, >60% overall
- Type safety: zero `any` types in production code
- Privacy-first: on-prem AI default, external opt-in

**Scale/Scope**: 
- Initial deployment: 50-200 concurrent users
- Question library: 1,000-10,000 questions
- Vector embeddings: 10,000+ with <300ms search
- Admin users: 1-5 administrators
- Quiz sessions: unlimited (auto-cleanup after 7 days)

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Alignment with Core Principles

| Principle | Status | Implementation |
|-----------|--------|----------------|
| **Reliability & Determinism** | ✅ Pass | Seedable RNG for question selection; cached AI responses versioned; difficulty rubric documented |
| **Security & Privacy-First** | ✅ Pass | Ollama primary provider; external AI environment-gated; no client-side AI calls; Zod validation all inputs |
| **Modularity & Clean Architecture** | ✅ Pass | Clear layer separation: UI → API Routes → Services → Data Access; provider-agnostic AI abstraction |
| **Extensibility** | ✅ Pass | AI provider interface for easy additions; category/difficulty enums; plugin architecture for generators |
| **Maintainability** | ✅ Pass | TypeScript strict mode; Zod schemas shared client/server; JSDoc for public APIs; structured folder hierarchy |

### ✅ Technical Stack Compliance

| Requirement | Status | Notes |
|-------------|--------|-------|
| Next.js 15 App Router | ✅ Pass | Using App Router, not Pages Router |
| TypeScript 5.x strict | ✅ Pass | tsconfig.json with strict: true |
| PostgreSQL + Qdrant | ✅ Pass | Both containerized via Docker Compose |
| Ollama (primary AI) | ✅ Pass | Local REST API, containerized |
| OpenAI/Anthropic (fallback) | ✅ Pass | Environment-gated with explicit notification |
| shadcn/ui + Tailwind | ✅ Pass | Component library + styling system |
| Zod validation | ✅ Pass | All API inputs/outputs validated |
| Docker Compose | ✅ Pass | All services containerized |

### ✅ Quality Gates

| Gate | Status | Implementation |
|------|--------|----------------|
| API-first modularity | ✅ Pass | All features exposed via typed API routes |
| Strong typing | ✅ Pass | Zod schemas, TypeScript strict mode, shared types |
| Observability | ✅ Pass | Structured logging, AI request metrics, health checks |
| Edge safety | ✅ Pass | No browser AI calls, server-side only |
| Privacy controls | ✅ Pass | On-prem default, external opt-in, no PII logging |
| Testability | ✅ Pass | Unit, API, integration, E2E test suites planned |
| Documentation | ✅ Pass | OpenAPI auto-gen, architecture diagrams, ADRs |

### ⚠️ Complexity Justifications

| Item | Justification | Simpler Alternative Rejected |
|------|---------------|------------------------------|
| Dual databases (PostgreSQL + Qdrant) | PostgreSQL for relational integrity; Qdrant for semantic search via embeddings | Single PostgreSQL with pgvector extension rejected due to inferior vector search performance and lack of specialized indexing (HNSW) |
| Provider abstraction layer | Enables runtime AI provider switching, testing with mocks, and zero vendor lock-in | Direct OpenAI SDK calls rejected due to inability to switch to on-prem Ollama and violation of privacy-first principle |
| Secondary validation AI call | Prevents hallucinated/incorrect questions from reaching users, ensures quality | Manual admin review only rejected due to unsustainable volume and delayed feedback loop |

---

## Project Structure

### Documentation (this feature)

```text
.specify/
├── memory/
│   └── constitution.md                    # Project constitution (created)
├── specs/
│   └── baseline-cyberquiz-specification.md  # Full feature spec (created)
├── plans/
│   └── baseline-implementation-plan.md     # This file
└── tasks/
    └── baseline-implementation-tasks.md    # Detailed task breakdown (Phase 2 output)
```

### Source Code (repository root)

```text
Cyber_Quizz/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Home page (topic selection)
│   ├── providers.tsx                 # React context providers
│   ├── quiz/
│   │   └── page.tsx                  # Quiz session interface
│   ├── score/
│   │   └── page.tsx                  # Results screen
│   ├── admin/
│   │   └── page.tsx                  # Admin dashboard
│   ├── admin-login/
│   │   └── page.tsx                  # Admin authentication
│   └── api/                          # API Routes
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   └── me/route.ts
│       ├── questions/
│       │   ├── route.ts              # List/create questions
│       │   └── [id]/route.ts         # Get/update/delete question
│       ├── quiz/
│       │   ├── sessions/route.ts     # Create quiz session
│       │   └── sessions/[id]/
│       │       ├── route.ts          # Get session
│       │       ├── submit/route.ts   # Submit answers
│       │       └── results/route.ts  # Get results
│       ├── scores/
│       │   └── route.ts              # Leaderboard
│       ├── ai/
│       │   ├── generate/route.ts     # Generate questions
│       │   ├── validate/route.ts     # Validate question
│       │   └── embed/route.ts        # Generate embedding
│       └── admin/
│           ├── questions/route.ts
│           ├── logs/route.ts
│           └── dashboard/route.ts
│
├── src/
│   ├── components/                   # React components
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── QuizSetup.tsx
│   │   ├── QuestionCard.tsx
│   │   ├── ResultsSummary.tsx
│   │   ├── Leaderboard.tsx
│   │   ├── AdminQuestionTable.tsx
│   │   └── AILogsViewer.tsx
│   ├── lib/
│   │   ├── ai/                       # AI provider layer
│   │   │   ├── providers/
│   │   │   │   ├── base.ts           # AIProvider interface
│   │   │   │   ├── ollama.ts         # Ollama implementation
│   │   │   │   ├── openai.ts         # OpenAI implementation
│   │   │   │   └── mock.ts           # Mock for testing
│   │   │   ├── prompts/
│   │   │   │   ├── generation.ts     # Question generation prompts
│   │   │   │   └── validation.ts     # Validation prompts
│   │   │   ├── rate-limiter.ts       # Rate limiting logic
│   │   │   ├── retry.ts              # Retry with backoff
│   │   │   └── factory.ts            # Provider factory
│   │   ├── db/
│   │   │   ├── client.ts             # Prisma client singleton
│   │   │   ├── repositories/         # Data access layer
│   │   │   │   ├── questions.ts
│   │   │   │   ├── sessions.ts
│   │   │   │   ├── scores.ts
│   │   │   │   └── logs.ts
│   │   │   └── vector/
│   │   │       └── qdrant.ts         # Qdrant client
│   │   ├── services/                 # Business logic
│   │   │   ├── question-generator.ts
│   │   │   ├── question-validator.ts
│   │   │   ├── quiz-engine.ts
│   │   │   ├── scoring.ts
│   │   │   └── metadata-extractor.ts
│   │   ├── validators/               # Zod schemas
│   │   │   ├── question.ts
│   │   │   ├── quiz.ts
│   │   │   └── admin.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts               # JWT verification
│   │   │   ├── error-handler.ts
│   │   │   └── logger.ts             # Structured logging
│   │   ├── utils/
│   │   │   ├── difficulty-scorer.ts  # Difficulty calculation
│   │   │   ├── duplicate-detector.ts # Embedding similarity
│   │   │   └── mitre-mapper.ts       # MITRE ATT&CK tagging
│   │   └── constants.ts              # Enums, config
│   ├── types/
│   │   ├── question.ts               # Question entities
│   │   ├── quiz.ts                   # Quiz session types
│   │   ├── ai.ts                     # AI provider types
│   │   └── api.ts                    # API request/response types
│   └── hooks/
│       ├── useQuiz.ts
│       ├── useAdmin.ts
│       └── useLeaderboard.ts
│
├── prisma/
│   ├── schema.prisma                 # Database schema
│   └── migrations/                   # Migration history
│
├── database/
│   └── init.sql                      # PostgreSQL initialization
│
├── tests/
│   ├── unit/
│   │   ├── ai/
│   │   │   ├── providers.test.ts
│   │   │   └── retry.test.ts
│   │   ├── services/
│   │   │   ├── question-generator.test.ts
│   │   │   └── quiz-engine.test.ts
│   │   └── utils/
│   │       └── difficulty-scorer.test.ts
│   ├── integration/
│   │   ├── api/
│   │   │   ├── questions.test.ts
│   │   │   ├── quiz.test.ts
│   │   │   └── scores.test.ts
│   │   └── ai/
│   │       └── provider-fallback.test.ts
│   └── e2e/
│       ├── quiz-flow.spec.ts
│       ├── admin-flow.spec.ts
│       └── leaderboard.spec.ts
│
├── docker/
│   ├── Dockerfile                    # Next.js production image
│   ├── Dockerfile.dev                # Development image
│   └── ollama/
│       └── Modelfile                 # Ollama model config
│
├── docs/
│   ├── DEPLOYMENT.md                 # Deployment guide
│   ├── API.md                        # API documentation
│   ├── ARCHITECTURE.md               # Architecture diagrams
│   └── ADRs/                         # Architecture Decision Records
│       ├── 001-ai-provider-abstraction.md
│       ├── 002-dual-database-strategy.md
│       └── 003-validation-pipeline.md
│
├── docker-compose.yml                # Local development orchestration
├── docker-compose.prod.yml           # Production orchestration
├── .env.local.example                # Environment template
├── next.config.mjs                   # Next.js config
├── tsconfig.json                     # TypeScript config
├── tailwind.config.ts                # Tailwind config
├── components.json                   # shadcn/ui config
├── jest.config.js                    # Jest config
├── playwright.config.ts              # Playwright config
└── package.json                      # Dependencies
```

**Structure Decision**: Web application structure chosen due to Next.js full-stack nature. Backend logic lives in API routes (`app/api/`) and services (`src/lib/services/`), frontend in pages (`app/`) and components (`src/components/`). All business logic abstracted into services layer for testability and reusability.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| **Dual databases** (PostgreSQL + Qdrant) | PostgreSQL handles relational integrity (foreign keys, transactions, complex queries); Qdrant provides specialized vector search with HNSW indexing for semantic similarity (10-100x faster than alternatives) | **pgvector extension** rejected: slower vector search, no native HNSW support, mixed concerns violate separation of concerns principle, difficult to scale independently |
| **Provider abstraction layer** (interface + multiple implementations) | Enables runtime provider switching (Ollama ↔ OpenAI), zero vendor lock-in, easy testing with mocks, compliance with privacy-first constitution | **Direct SDK integration** rejected: vendor lock-in to OpenAI, impossible to test without live API, violates on-prem AI requirement, no fallback mechanism |
| **Secondary validation AI call** (2-pass generation) | Quality control gate to prevent hallucinated/incorrect questions reaching users, reduces admin workload, builds trust in AI-generated content | **Manual admin review only** rejected: doesn't scale (100s of questions/day), delayed feedback loop, human error prone, blocks automated workflows |
| **Embedding generation for all questions** | Required for semantic search (P3 user story), duplicate detection (critical), future adaptive difficulty based on concept similarity | **Keyword-based search only** rejected: misses semantic matches ("SQL injection" vs "database attack"), cannot detect paraphrased duplicates, limits future features |
| **Separate metadata table** | Keeps questions table clean and fast, allows independent scaling of embeddings, supports flexible schema evolution for new metadata types | **Single denormalized table** rejected: bloats question queries, mixing hot (question text) and cold (embeddings) data harms cache efficiency, harder to extend |

---

## Implementation Phases

### Phase 0: Environment Setup & Infrastructure (Week 1)

**Goal**: Establish development environment with all required services running and connected.

**Milestones**:
1. ✅ M0.1: Docker Compose configuration with all services (Next.js, PostgreSQL, Qdrant, Ollama)
2. ✅ M0.2: Next.js 15 scaffolded with App Router, TypeScript strict mode, shadcn/ui
3. ✅ M0.3: Prisma schema defined and initial migration applied
4. ✅ M0.4: Qdrant collection created with embedding schema
5. ✅ M0.5: Ollama running with llama3.1:70b and nomic-embed-text models pulled
6. ✅ M0.6: Environment variables configured (.env.local template created)
7. ✅ M0.7: Health check endpoints for all services responding

**Deliverables**:
- `docker-compose.yml` with services: app, postgres, qdrant, ollama, pgadmin
- `prisma/schema.prisma` with all tables (questions, sessions, scores, users, metadata, logs)
- `database/init.sql` with PostgreSQL initialization
- Qdrant collection `cyberquiz_questions` created via init script
- `.env.local.example` with all required variables documented
- `app/api/health/route.ts` - health check for app
- `app/api/health/db/route.ts` - database connectivity check
- `app/api/health/ai/route.ts` - AI provider availability check
- `README.md` updated with setup instructions

**Responsibilities**:
- **DevOps/Infrastructure**: Docker Compose setup, container networking, volume mounts
- **Backend Dev**: Prisma schema, database initialization, health checks
- **AI/ML Engineer**: Ollama model selection, Qdrant schema design

**Acceptance Criteria**:
- [ ] `docker-compose up -d` starts all services without errors
- [ ] `npm run dev` starts Next.js on http://localhost:3000
- [ ] PostgreSQL accessible on localhost:5432 with schema applied
- [ ] Qdrant accessible on localhost:6333 with collection ready
- [ ] Ollama accessible on localhost:11434 with models loaded
- [ ] All health check endpoints return 200 OK
- [ ] Prisma Client can query database successfully

---

### Phase 1: AI Provider Layer (Week 2)

**Goal**: Implement provider-agnostic AI abstraction with Ollama and OpenAI providers, including rate limiting and retry logic.

**Milestones**:
1. ✅ M1.1: `AIProvider` interface defined with TypeScript types
2. ✅ M1.2: Ollama provider implementation (generation, validation, embeddings)
3. ✅ M1.3: OpenAI provider implementation (generation, validation, embeddings)
4. ✅ M1.4: Mock provider for testing
5. ✅ M1.5: Rate limiter with configurable limits per provider
6. ✅ M1.6: Retry logic with exponential backoff
7. ✅ M1.7: AI provider factory with fallback mechanism
8. ✅ M1.8: Prompt templates for question generation and validation

**Deliverables**:
- `src/lib/ai/providers/base.ts` - AIProvider interface
- `src/lib/ai/providers/ollama.ts` - Ollama REST API client
- `src/lib/ai/providers/openai.ts` - OpenAI SDK wrapper
- `src/lib/ai/providers/mock.ts` - Mock provider for tests
- `src/lib/ai/rate-limiter.ts` - Token bucket rate limiter
- `src/lib/ai/retry.ts` - Exponential backoff retry wrapper
- `src/lib/ai/factory.ts` - Provider factory with fallback logic
- `src/lib/ai/prompts/generation.ts` - Question generation prompts
- `src/lib/ai/prompts/validation.ts` - Validation prompts
- `src/types/ai.ts` - AI provider types
- `tests/unit/ai/providers.test.ts` - Provider unit tests
- `tests/integration/ai/provider-fallback.test.ts` - Fallback integration test

**Responsibilities**:
- **AI/ML Engineer**: Prompt engineering, model selection, provider implementations
- **Backend Dev**: Interface design, rate limiting, retry logic, factory pattern
- **QA Engineer**: Test cases for provider switching, fallback scenarios, error handling

**Acceptance Criteria**:
- [ ] All providers implement `AIProvider` interface
- [ ] Ollama provider successfully generates questions via local REST API
- [ ] OpenAI provider generates questions via SDK (when enabled)
- [ ] Mock provider returns deterministic responses for testing
- [ ] Rate limiter prevents >60 requests/minute per provider (configurable)
- [ ] Retry logic attempts 3 retries with 1s, 2s, 4s delays
- [ ] Factory falls back from Ollama → OpenAI when Ollama unavailable
- [ ] Factory logs fallback events with provider names
- [ ] Prompts generate valid JSON responses parsed by Zod schemas
- [ ] Unit tests cover all provider methods with >80% coverage
- [ ] Integration test verifies fallback within 5 seconds

---

### Phase 2: Core Backend - Question Generation Pipeline (Week 3-4)

**Goal**: Build end-to-end question generation pipeline from user request to database storage with validation and metadata extraction.

**Milestones**:
1. ✅ M2.1: Question generation service with AI integration
2. ✅ M2.2: Question validation service (secondary AI call)
3. ✅ M2.3: Embedding generation service
4. ✅ M2.4: Metadata extraction (difficulty scoring, MITRE mapping)
5. ✅ M2.5: Duplicate detection via embedding similarity
6. ✅ M2.6: Database repositories (questions, metadata)
7. ✅ M2.7: Qdrant vector storage integration
8. ✅ M2.8: AI request logging
9. ✅ M2.9: Question generation API route (`POST /api/ai/generate`)
10. ✅ M2.10: Question validation API route (`POST /api/ai/validate`)
11. ✅ M2.11: Questions CRUD API routes

**Deliverables**:
- `src/lib/services/question-generator.ts` - Question generation orchestrator
- `src/lib/services/question-validator.ts` - Validation service
- `src/lib/services/metadata-extractor.ts` - Metadata extraction
- `src/lib/utils/difficulty-scorer.ts` - Difficulty scoring rubric
- `src/lib/utils/duplicate-detector.ts` - Embedding similarity check
- `src/lib/utils/mitre-mapper.ts` - MITRE ATT&CK technique mapping
- `src/lib/db/repositories/questions.ts` - Question data access
- `src/lib/db/repositories/logs.ts` - AI log data access
- `src/lib/db/vector/qdrant.ts` - Qdrant client wrapper
- `src/lib/validators/question.ts` - Zod schemas for questions
- `app/api/ai/generate/route.ts` - Question generation endpoint
- `app/api/ai/validate/route.ts` - Question validation endpoint
- `app/api/ai/embed/route.ts` - Embedding generation endpoint
- `app/api/questions/route.ts` - List/create questions
- `app/api/questions/[id]/route.ts` - Get/update/delete question
- `tests/unit/services/question-generator.test.ts`
- `tests/integration/api/questions.test.ts`

**Responsibilities**:
- **Backend Dev**: Service orchestration, API routes, database repositories
- **AI/ML Engineer**: Validation prompts, difficulty scoring algorithm, MITRE mapping logic
- **Data Engineer**: Qdrant integration, embedding storage, similarity search
- **QA Engineer**: API contract tests, integration tests, edge case scenarios

**Acceptance Criteria**:
- [ ] `POST /api/ai/generate` accepts topic, difficulty, count parameters
- [ ] Service generates N questions using AI provider within 3s/question
- [ ] Each question undergoes secondary validation AI call
- [ ] Quality scores <0.5 flag questions as `is_validated: false`
- [ ] Difficulty score calculated using documented rubric (complexity, verbosity, ambiguity)
- [ ] MITRE techniques extracted and stored as JSON array
- [ ] Embeddings generated and stored in Qdrant with question_id payload
- [ ] Duplicate detection rejects questions with cosine similarity >0.95
- [ ] Questions stored in PostgreSQL with all metadata
- [ ] AI request logs capture: provider, model, latency, tokens, status
- [ ] `GET /api/questions` supports filtering by category, difficulty, validated
- [ ] `DELETE /api/questions/:id` cascades to Qdrant (removes embedding)
- [ ] API validates all inputs with Zod, returns 400 for invalid requests
- [ ] Integration tests verify full pipeline: request → AI → validation → storage

---

### Phase 3: Quiz Engine & Session Management (Week 5)

**Goal**: Implement quiz session creation, question selection, answer submission, and scoring logic.

**Milestones**:
1. ✅ M3.1: Quiz session service (create, retrieve, update)
2. ✅ M3.2: Question selection logic (random + filtered)
3. ✅ M3.3: Answer submission and validation
4. ✅ M3.4: Scoring calculation and result generation
5. ✅ M3.5: Session timeout and cleanup
6. ✅ M3.6: Quiz session API routes
7. ✅ M3.7: Score submission and leaderboard

**Deliverables**:
- `src/lib/services/quiz-engine.ts` - Quiz session orchestrator
- `src/lib/services/scoring.ts` - Score calculation logic
- `src/lib/db/repositories/sessions.ts` - Session data access
- `src/lib/db/repositories/scores.ts` - Score data access
- `src/lib/validators/quiz.ts` - Zod schemas for quiz sessions
- `app/api/quiz/sessions/route.ts` - Create quiz session
- `app/api/quiz/sessions/[id]/route.ts` - Get session
- `app/api/quiz/sessions/[id]/submit/route.ts` - Submit answers
- `app/api/quiz/sessions/[id]/results/route.ts` - Get results
- `app/api/scores/route.ts` - Leaderboard + submit score
- `tests/unit/services/quiz-engine.test.ts`
- `tests/integration/api/quiz.test.ts`

**Responsibilities**:
- **Backend Dev**: Quiz engine, session management, API routes
- **Data Engineer**: Efficient question selection queries, session cleanup jobs
- **QA Engineer**: Quiz flow tests, edge cases (incomplete sessions, timeouts)

**Acceptance Criteria**:
- [ ] `POST /api/quiz/sessions` creates session with selected questions (from DB or generate new)
- [ ] Session stores: topic, difficulty, question IDs, start time, status
- [ ] `GET /api/quiz/sessions/:id` returns session with questions (without correct answers)
- [ ] `POST /api/quiz/sessions/:id/submit` validates answers, stores responses
- [ ] Scoring calculates: total score, accuracy %, time taken, per-question correctness
- [ ] `GET /api/quiz/sessions/:id/results` returns detailed results with explanations
- [ ] Sessions timeout after 24 hours, status updates to "abandoned"
- [ ] `GET /api/scores` returns leaderboard sorted by accuracy, then time
- [ ] Leaderboard supports filtering: topic, difficulty, time period (today, week, all)
- [ ] Anonymous users can submit scores without authentication
- [ ] Session cleanup job (cron) removes abandoned sessions >7 days old

---

### Phase 4: Frontend UI (Week 6-7)

**Goal**: Build responsive user interface for quiz setup, question display, results, and leaderboard.

**Milestones**:
1. ✅ M4.1: Home page with topic selection
2. ✅ M4.2: Quiz setup form (difficulty, question count, type)
3. ✅ M4.3: Quiz session interface with question cards
4. ✅ M4.4: Timer and progress indicator
5. ✅ M4.5: Results screen with breakdown and explanations
6. ✅ M4.6: Leaderboard component
7. ✅ M4.7: Loading states and error handling
8. ✅ M4.8: Responsive design (mobile + desktop)

**Deliverables**:
- `app/page.tsx` - Home page with topic selection
- `app/quiz/page.tsx` - Quiz session page
- `app/score/page.tsx` - Results page
- `src/components/QuizSetup.tsx` - Setup form component
- `src/components/QuestionCard.tsx` - Question display component
- `src/components/ProgressIndicator.tsx` - Quiz progress
- `src/components/Timer.tsx` - Session timer
- `src/components/ResultsSummary.tsx` - Score summary
- `src/components/QuestionReview.tsx` - Answer explanations
- `src/components/Leaderboard.tsx` - Leaderboard table
- `src/hooks/useQuiz.ts` - Quiz session hook
- `src/hooks/useLeaderboard.ts` - Leaderboard hook
- Responsive styling with TailwindCSS

**Responsibilities**:
- **Frontend Dev**: React components, state management, UI/UX
- **UI/UX Designer**: Component design, user flows, accessibility
- **QA Engineer**: Component tests, E2E quiz flow tests

**Acceptance Criteria**:
- [ ] Home page displays topic cards with descriptions
- [ ] Quiz setup allows selection: topic, difficulty, question count (5-20)
- [ ] Quiz page displays one question at a time with 4 options
- [ ] Timer shows elapsed time, updates every second
- [ ] Progress bar shows X/N questions completed
- [ ] Submit button disabled until all questions answered
- [ ] Results page shows: score, accuracy %, time taken
- [ ] Each question review shows: user answer, correct answer, explanation
- [ ] Leaderboard updates in real-time after score submission
- [ ] Loading spinners shown during AI generation (<30s)
- [ ] Error messages displayed for failed API calls
- [ ] Responsive design works on mobile (375px) and desktop (1920px)
- [ ] Accessibility: keyboard navigation, ARIA labels, color contrast

---

### Phase 5: Admin Dashboard & Quality Control (Week 8)

**Goal**: Build admin interface for question management, validation, AI logs, and usage analytics.

**Milestones**:
1. ✅ M5.1: Admin authentication (login/logout)
2. ✅ M5.2: Question management table with filters
3. ✅ M5.3: Question detail modal with metadata
4. ✅ M5.4: Bulk validation and deletion
5. ✅ M5.5: AI logs viewer with search and filters
6. ✅ M5.6: Usage dashboard with metrics
7. ✅ M5.7: Admin API routes

**Deliverables**:
- `app/admin-login/page.tsx` - Admin login page
- `app/admin/page.tsx` - Admin dashboard
- `src/components/AdminQuestionTable.tsx` - Question management table
- `src/components/QuestionDetailModal.tsx` - Question detail view
- `src/components/AILogsViewer.tsx` - AI request logs
- `src/components/UsageDashboard.tsx` - Metrics dashboard
- `src/hooks/useAdmin.ts` - Admin authentication hook
- `src/lib/middleware/auth.ts` - JWT verification middleware
- `app/api/auth/login/route.ts` - Admin login
- `app/api/auth/logout/route.ts` - Admin logout
- `app/api/auth/me/route.ts` - Current admin user
- `app/api/admin/questions/route.ts` - Admin question list
- `app/api/admin/questions/bulk-validate/route.ts` - Bulk validate
- `app/api/admin/questions/bulk-delete/route.ts` - Bulk delete
- `app/api/admin/logs/route.ts` - AI logs
- `app/api/admin/dashboard/route.ts` - Usage stats

**Responsibilities**:
- **Backend Dev**: Admin API routes, authentication middleware, analytics queries
- **Frontend Dev**: Admin UI components, data tables, charts
- **Security Engineer**: JWT implementation, session management, RBAC
- **QA Engineer**: Admin flow tests, permission tests, security tests

**Acceptance Criteria**:
- [ ] Admin login requires email + password (bcrypt verification)
- [ ] JWT token issued on login, stored in HTTP-only cookie
- [ ] Admin routes protected by auth middleware (401 if unauthenticated)
- [ ] Question table shows: ID, preview, difficulty, quality, provider, date
- [ ] Filters: category, difficulty range, validated status, quality threshold
- [ ] Pagination: 20 questions per page
- [ ] Question detail modal shows all metadata and raw AI response
- [ ] "Validate" button updates `is_validated: true`, shows success toast
- [ ] Bulk validate: select multiple questions, validate all at once
- [ ] Bulk delete: confirm dialog, cascade to Qdrant and response history
- [ ] AI logs table shows: timestamp, provider, model, operation, latency, status
- [ ] Log search by: date range, provider, status (success/failure)
- [ ] Dashboard displays: total questions, avg quality, provider distribution pie chart, latency graph, error rate
- [ ] All admin actions logged (audit trail)

---

### Phase 6: Security, Observability & Quality (Week 9)

**Goal**: Implement security hardening, structured logging, metrics collection, and comprehensive error handling.

**Milestones**:
1. ✅ M6.1: Rate limiting on public API routes
2. ✅ M6.2: Input sanitization and Zod validation everywhere
3. ✅ M6.3: Structured logging with Winston
4. ✅ M6.4: Error handling middleware
5. ✅ M6.5: Metrics collection (Prometheus format)
6. ✅ M6.6: CORS configuration
7. ✅ M6.7: Security headers (helmet.js)
8. ✅ M6.8: Environment variable validation

**Deliverables**:
- `src/lib/middleware/rate-limiter.ts` - API rate limiting
- `src/lib/middleware/logger.ts` - Winston structured logging
- `src/lib/middleware/error-handler.ts` - Global error handler
- `src/lib/middleware/metrics.ts` - Prometheus metrics collector
- `src/lib/middleware/cors.ts` - CORS configuration
- `src/lib/middleware/security.ts` - Security headers
- `src/lib/validators/env.ts` - Environment variable schema
- Updated API routes with middleware
- `app/api/metrics/route.ts` - Prometheus metrics endpoint
- `docs/LOGGING.md` - Logging standards documentation
- `docs/SECURITY.md` - Security practices

**Responsibilities**:
- **Security Engineer**: Rate limiting, CORS, security headers, input validation
- **Backend Dev**: Logging middleware, error handling, metrics
- **DevOps**: Prometheus integration, log aggregation setup
- **QA Engineer**: Security tests, rate limit tests, error scenario tests

**Acceptance Criteria**:
- [ ] Rate limiting: 100 req/min per IP on `/api/quiz`, 20 req/min on `/api/ai`
- [ ] All API inputs validated with Zod before processing
- [ ] Structured logs include: timestamp, level, message, context (user_id, session_id), metadata
- [ ] Errors logged with stack traces, never expose to client
- [ ] Global error handler returns consistent format: `{ success: false, error: "message" }`
- [ ] Metrics tracked: request count, latency (p50, p95, p99), error rate, AI provider usage
- [ ] `/api/metrics` endpoint returns Prometheus format
- [ ] CORS allows only configured origins (whitelist)
- [ ] Security headers: X-Frame-Options, X-Content-Type-Options, CSP
- [ ] Environment variables validated on startup (fail fast if missing)
- [ ] No secrets logged or exposed in error messages
- [ ] Audit logs capture all admin actions with timestamp, user, action, resource

---

### Phase 7: Testing & Quality Assurance (Week 10-11)

**Goal**: Achieve comprehensive test coverage with unit, integration, and E2E tests.

**Milestones**:
1. ✅ M7.1: Unit tests for all services and utilities
2. ✅ M7.2: API integration tests with Supertest
3. ✅ M7.3: AI provider integration tests with mocks
4. ✅ M7.4: E2E tests for quiz flow with Playwright
5. ✅ M7.5: Admin flow E2E tests
6. ✅ M7.6: Load testing with k6
7. ✅ M7.7: Security testing (OWASP Top 10)
8. ✅ M7.8: Test coverage reporting

**Deliverables**:
- `tests/unit/services/*.test.ts` - Service unit tests
- `tests/unit/utils/*.test.ts` - Utility unit tests
- `tests/unit/ai/*.test.ts` - AI provider unit tests
- `tests/integration/api/*.test.ts` - API integration tests
- `tests/integration/ai/provider-fallback.test.ts` - Fallback test
- `tests/e2e/quiz-flow.spec.ts` - Complete quiz E2E test
- `tests/e2e/admin-flow.spec.ts` - Admin workflow E2E test
- `tests/e2e/leaderboard.spec.ts` - Leaderboard E2E test
- `tests/load/quiz-load.js` - k6 load test script
- `tests/security/owasp.test.ts` - Security tests
- `jest.config.js` - Jest configuration
- `playwright.config.ts` - Playwright configuration
- `coverage/` - Test coverage reports
- CI/CD pipeline configuration

**Responsibilities**:
- **QA Engineer**: E2E test scenarios, load test scripts, security tests
- **Backend Dev**: Unit tests, integration tests, mocks
- **Frontend Dev**: Component tests, UI integration tests
- **DevOps**: CI/CD pipeline, test automation

**Acceptance Criteria**:
- [ ] Unit test coverage: >80% for services, >70% for utilities
- [ ] API integration tests cover all endpoints with success + error cases
- [ ] AI provider fallback test verifies Ollama → OpenAI transition <5s
- [ ] E2E quiz flow: select topic → generate questions → answer → view results → see leaderboard
- [ ] E2E admin flow: login → view questions → validate → view logs → logout
- [ ] Load test: 100 concurrent users completing quizzes, <500ms p95 latency
- [ ] Security tests: SQL injection, XSS, CSRF, authentication bypass attempts (all fail)
- [ ] All tests run in CI/CD on every commit
- [ ] Coverage reports generated and published
- [ ] Zero critical or high vulnerabilities in dependency scan
- [ ] Performance benchmarks documented (baseline for regression testing)

---

### Phase 8: Deployment & Documentation (Week 12)

**Goal**: Production-ready deployment configuration, comprehensive documentation, and operational runbooks.

**Milestones**:
1. ✅ M8.1: Production Docker Compose configuration
2. ✅ M8.2: Environment variable management
3. ✅ M8.3: Database backup and restore scripts
4. ✅ M8.4: Deployment documentation
5. ✅ M8.5: API documentation (OpenAPI/Swagger)
6. ✅ M8.6: Architecture documentation with diagrams
7. ✅ M8.7: Operational runbooks
8. ✅ M8.8: User guide

**Deliverables**:
- `docker-compose.prod.yml` - Production orchestration
- `scripts/backup-db.sh` - PostgreSQL backup script
- `scripts/restore-db.sh` - Database restore script
- `scripts/deploy.sh` - Deployment automation
- `docs/DEPLOYMENT.md` - Complete deployment guide
- `docs/API.md` - API reference (auto-generated from OpenAPI)
- `docs/ARCHITECTURE.md` - Architecture diagrams (Mermaid)
- `docs/RUNBOOKS.md` - Operational procedures
- `docs/USER_GUIDE.md` - End-user documentation
- `docs/ADRs/` - Architecture Decision Records
- `.env.production.example` - Production environment template
- `openapi.yaml` - OpenAPI specification

**Responsibilities**:
- **DevOps**: Production Docker config, deployment scripts, backup/restore
- **Backend Dev**: OpenAPI spec generation, API documentation
- **Technical Writer**: User guide, runbooks, architecture diagrams
- **Project Manager**: Release checklist, deployment coordination

**Acceptance Criteria**:
- [ ] `docker-compose.prod.yml` uses production-optimized settings
- [ ] All secrets managed via environment variables (no hardcoded values)
- [ ] Backup script runs nightly, stores to persistent volume
- [ ] Restore script tested and verified
- [ ] Deployment guide includes: prerequisites, step-by-step instructions, troubleshooting
- [ ] API documentation auto-generated from Zod schemas → OpenAPI
- [ ] Architecture diagrams show: system overview, data flow, deployment topology
- [ ] Runbooks cover: deployment, rollback, scaling, disaster recovery, common issues
- [ ] User guide includes: getting started, quiz workflows, FAQ
- [ ] ADRs document all major technical decisions
- [ ] Production deployment tested in staging environment
- [ ] Rollback procedure documented and tested
- [ ] Monitoring and alerting configured (basic health checks)

---

## Risk Management

### Critical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Ollama model performance insufficient** | High - Core functionality depends on local AI | Medium | Benchmark early (Phase 1), have OpenAI fallback ready, consider lighter models (llama3.1:8b) for validation |
| **Vector search performance degrades at scale** | Medium - Affects P3 features | Low | Load test Qdrant early (Phase 7), monitor query times, implement pagination/caching |
| **AI hallucinations in questions** | High - Damages user trust | High | Mandatory validation pipeline (Phase 2), admin review gate for quality <0.7, continuous monitoring |
| **Docker Compose complexity** | Medium - Deployment friction | Medium | Comprehensive docs (Phase 8), automated health checks, simplified dev vs prod configs |
| **Rate limiting too restrictive** | Low - UX degradation | Medium | Make limits configurable, monitor usage patterns, implement graceful degradation |
| **Test coverage not met** | Medium - Quality issues | Medium | Enforce coverage gates in CI/CD, prioritize business logic tests, use mocks effectively |

### Technical Debt Tracking

| Item | Phase Introduced | Planned Resolution |
|------|------------------|-------------------|
| Hardcoded AI prompts | Phase 1 | Phase 9 (future): Move to database with versioning |
| No adaptive difficulty algorithm | MVP | Phase 10 (future): Implement ML-based difficulty calibration |
| Single admin role | Phase 5 | Phase 11 (future): RBAC with granular permissions |
| No question versioning | Phase 2 | Phase 12 (future): Implement question change history |
| Manual MITRE mapping | Phase 2 | Phase 13 (future): AI-powered MITRE extraction with validation |

---

## Dependencies & Integrations

### External Services

| Service | Purpose | Fallback Strategy | SLA Requirement |
|---------|---------|-------------------|-----------------|
| **Ollama (local)** | Primary AI provider | OpenAI fallback | 95% uptime during business hours |
| **OpenAI API** | Fallback AI provider | Cached questions, degraded mode | N/A (best effort) |
| **PostgreSQL** | Primary database | None (single point of failure) | 99.9% uptime |
| **Qdrant** | Vector database | Degrade to keyword search if down | 99% uptime |

### Internal Dependencies

```
Frontend (React) → API Routes → Services → Data Access
                       ↓
                  AI Provider Layer → Ollama/OpenAI
                       ↓
                  PostgreSQL + Qdrant
```

**Critical Paths**:
1. Quiz Generation: User Request → API → AI Provider → Validation → Storage → Response
2. Quiz Taking: Session Create → Question Retrieve → Submit → Score → Leaderboard

---

## Success Metrics (Phase Completion)

### Phase 0 Success Criteria
- ✅ All services start without errors
- ✅ Health checks pass for all components
- ✅ Database migrations applied successfully
- ✅ Development environment replicable in <10 minutes

### Phase 1 Success Criteria
- ✅ All AI providers implement interface
- ✅ Fallback mechanism activates within 5s
- ✅ Prompts generate parseable JSON 100% of time
- ✅ Unit tests >80% coverage for AI layer

### Phase 2 Success Criteria
- ✅ Question generation API generates 10 questions in <30s
- ✅ Validation pipeline flags <0.5 quality scores
- ✅ Duplicate detection prevents >95% duplicates
- ✅ All questions stored with complete metadata

### Phase 3 Success Criteria
- ✅ Quiz sessions created with selected questions
- ✅ Scoring calculates accurately for all question types
- ✅ Leaderboard updates in real-time
- ✅ Sessions timeout and cleanup after 24h/7d

### Phase 4 Success Criteria
- ✅ Complete quiz flow functional end-to-end
- ✅ Responsive design works 375px - 1920px
- ✅ Loading states and error handling polished
- ✅ Accessibility: keyboard nav, ARIA labels

### Phase 5 Success Criteria
- ✅ Admin authentication secure (JWT, bcrypt)
- ✅ Question management operations functional
- ✅ Bulk operations process 50 questions in <5s
- ✅ AI logs queryable with filters

### Phase 6 Success Criteria
- ✅ Rate limiting prevents abuse
- ✅ All inputs validated with Zod
- ✅ Structured logging operational
- ✅ Security headers configured

### Phase 7 Success Criteria
- ✅ Test coverage >80% business logic, >60% overall
- ✅ Load test: 100 concurrent users, <500ms p95
- ✅ Security tests pass (no vulnerabilities)
- ✅ CI/CD pipeline operational

### Phase 8 Success Criteria
- ✅ Production deployment successful
- ✅ Documentation complete and accurate
- ✅ Backup/restore tested
- ✅ Runbooks cover operational scenarios

---

## Post-Launch Roadmap (Future Phases)

### Phase 9: User Accounts & Personalization (Month 4)
- User registration and authentication
- Progress tracking over time
- Personalized difficulty adaptation
- Learning path recommendations

### Phase 10: Advanced Features (Month 5-6)
- Custom quiz creation (manual question selection)
- Question import/export
- Multi-language support
- Advanced analytics dashboard

### Phase 11: Scalability & Performance (Month 7-8)
- Horizontal scaling (multiple app instances)
- Redis caching layer
- CDN integration
- Database read replicas

### Phase 12: Enterprise Features (Month 9-12)
- SSO integration (SAML, LDAP)
- Team/organization management
- Custom branding
- Audit logs and compliance reports

---

## Glossary

- **AI Provider**: Abstraction layer for AI services (Ollama, OpenAI, Anthropic)
- **Embedding**: Vector representation of text for semantic similarity
- **MITRE ATT&CK**: Framework for categorizing cybersecurity threats
- **Quality Score**: 0-1 metric assessing question accuracy and clarity
- **Difficulty Score**: 0-1 metric based on complexity, verbosity, ambiguity
- **Qdrant**: Vector database optimized for similarity search
- **Ollama**: Local AI model runtime for on-premise deployment
- **Zod**: TypeScript-first schema validation library

---

**Plan Version**: 1.0.0  
**Last Updated**: 2025-11-21  
**Next Review**: After Phase 2 completion  
**Status**: Ready for Implementation
