# Feature Specification: CyberQuiz - Adaptive Cybersecurity Quiz Generator (Baseline)

**Feature Branch**: `baseline-ai-quiz-generator`  
**Created**: 2025-11-21  
**Status**: Draft  
**Input**: Automated generation of cybersecurity-related multiple-choice questions using local AI model, with metadata enrichment, storage, and dynamic quiz sessions.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Basic Quiz Generation and Taking (Priority: P1)

**As a** cybersecurity student/professional  
**I want to** quickly generate and take a quiz on a specific cybersecurity topic  
**So that I can** test my knowledge and identify learning gaps

**Why this priority**: This is the core value proposition - without question generation and quiz-taking, the application has no purpose. This represents the minimum viable product (MVP).

**Independent Test**: Can be fully tested by selecting a topic (e.g., "Network Security"), generating 5 questions, answering them, and receiving a score with explanations. Delivers immediate educational value.

**Acceptance Scenarios**:

1. **Given** I am on the home page, **When** I select "Network Security" topic and click "Start Quiz", **Then** the system generates 5 questions within 30 seconds using the local AI model
2. **Given** I have a generated quiz, **When** I answer all questions and submit, **Then** I receive my score (e.g., "4/5 - 80%") with correct/incorrect indicators
3. **Given** I have completed a quiz, **When** I view the results, **Then** each question shows the correct answer and a brief explanation
4. **Given** the local AI (Ollama) is unavailable, **When** I request a quiz, **Then** the system falls back to the external provider (OpenAI) and notifies me of the fallback
5. **Given** I complete a quiz, **When** I submit my score with a username, **Then** my score appears on the leaderboard

---

### User Story 2 - Advanced Quiz Customization (Priority: P2)

**As a** user preparing for a specific certification (e.g., CISSP, CEH)  
**I want to** customize quiz parameters (difficulty, question type, number of questions)  
**So that I can** practice targeted scenarios aligned with my learning goals

**Why this priority**: Provides differentiation and personalization beyond basic quizzes. Increases user engagement and retention but not essential for MVP.

**Independent Test**: Can be tested by selecting "Advanced Mode", choosing difficulty "Hard", question type "Scenario-based", 10 questions, topic "Red Team Operations", and successfully completing a customized quiz.

**Acceptance Scenarios**:

1. **Given** I am on the quiz setup page, **When** I select difficulty "Hard", **Then** generated questions require deeper technical knowledge and multi-step reasoning
2. **Given** I select question type "Scenario-based", **When** the quiz is generated, **Then** questions present realistic cybersecurity incident scenarios with contextual details
3. **Given** I select "MITRE ATT&CK" as a filter, **When** I generate a quiz, **Then** questions are tagged with relevant MITRE techniques (e.g., T1059 - Command and Scripting Interpreter)
4. **Given** I set question count to 20, **When** I start the quiz, **Then** the system generates exactly 20 unique questions without duplicates
5. **Given** I select "Red Team vs Blue Team" mode, **When** I take the quiz, **Then** questions alternate between offensive and defensive perspectives

---

### User Story 3 - Admin Question Management and Quality Control (Priority: P2)

**As an** administrator  
**I want to** review AI-generated questions, their metadata, and quality scores  
**So that I can** ensure accuracy, remove hallucinations, and maintain question library quality

**Why this priority**: Critical for long-term quality and trust, but not required for initial user testing. Can be added after validating core generation pipeline.

**Independent Test**: Can be tested by logging into admin panel, viewing all generated questions with metadata (difficulty score, MITRE tags, AI provider), filtering by quality score <0.7, and deleting low-quality questions.

**Acceptance Scenarios**:

1. **Given** I am logged into the admin panel, **When** I navigate to "Questions", **Then** I see a paginated table of all generated questions with columns: ID, question text preview, difficulty, quality score, AI provider, created date
2. **Given** I view a question detail, **When** I click "View Metadata", **Then** I see: full question text, correct answer, explanation, difficulty score (0-1), quality score (0-1), MITRE techniques, tags, embedding ID, AI provider used, generation timestamp
3. **Given** I identify a low-quality question, **When** I click "Delete" and confirm, **Then** the question is removed from the database and vector store
4. **Given** I want to validate questions, **When** I click "Mark as Validated", **Then** the question's `is_validated` flag updates to true and it becomes eligible for production quizzes
5. **Given** I want to audit AI usage, **When** I view the "AI Logs" dashboard, **Then** I see: total API calls, provider distribution (Ollama vs OpenAI), average latency, token usage, error rate

---

### User Story 4 - Adaptive Difficulty and Learning Paths (Priority: P3)

**As a** learner using the platform over multiple sessions  
**I want the** system to adapt question difficulty based on my performance  
**So that I can** experience optimal challenge and accelerated learning

**Why this priority**: Advanced feature that significantly enhances learning outcomes but requires performance tracking infrastructure and adaptive algorithms.

**Independent Test**: Can be tested by creating a user account, taking 3 quizzes on the same topic, deliberately scoring low on first two (e.g., 2/10), and verifying that the third quiz contains easier questions with lower difficulty scores.

**Acceptance Scenarios**:

1. **Given** I have taken 2 quizzes on "Web Application Security" with scores below 50%, **When** I start a new quiz on the same topic, **Then** the system generates questions with difficulty scores 0.3-0.5 (easier range)
2. **Given** I have consistently scored above 90% on "Cryptography" quizzes, **When** I request a new quiz, **Then** the system generates questions with difficulty 0.8-1.0 (advanced range)
3. **Given** I complete a quiz session, **When** I view my performance dashboard, **Then** I see a difficulty progression graph showing how question difficulty has adapted over time
4. **Given** I am on a learning path, **When** I complete a quiz, **Then** the system recommends the next topic based on my weakest areas (identified by question tags)

---

### User Story 5 - Question Library Search and Semantic Retrieval (Priority: P3)

**As a** user or admin  
**I want to** search for questions using natural language or semantic similarity  
**So that I can** find relevant questions without exact keyword matching

**Why this priority**: Leverages vector database investment but not essential for core quiz functionality. Enhances discoverability and content reuse.

**Independent Test**: Can be tested by searching for "privilege escalation attacks" and receiving questions about sudo vulnerabilities, UAC bypass, and kernel exploits, even if those exact terms aren't in the question text.

**Acceptance Scenarios**:

1. **Given** I am on the question search page, **When** I enter "how to prevent SQL injection", **Then** the system returns questions semantically related to SQL injection prevention techniques using vector similarity
2. **Given** I search for a MITRE technique ID "T1055", **When** results are displayed, **Then** all questions tagged with that technique appear, sorted by relevance
3. **Given** I want to create a custom quiz, **When** I select questions from search results, **Then** I can add them to a custom quiz session

---

### Edge Cases

- **What happens when** the local Ollama server is down and the fallback provider API key is invalid?  
  → System displays user-friendly error: "Quiz generation temporarily unavailable. Please try again later." and logs the error for admin review.

- **What happens when** AI generates a question with an incorrect or ambiguous answer?  
  → The validation pipeline (secondary AI call) assigns a low quality score (<0.5), and the question is flagged for admin review. Not shown to end users unless admin explicitly validates it.

- **What happens when** a user requests 100 questions simultaneously?  
  → System applies rate limiting (max 20 questions per request), queues generation requests, and shows progress indicator. Admin can configure limits.

- **What happens when** the same question is generated multiple times?  
  → System uses embedding similarity check (cosine similarity >0.95) to detect duplicates and rejects them during insertion, triggering regeneration.

- **What happens when** database or vector DB connection is lost mid-quiz?  
  → Quiz session state is cached client-side; on reconnection, system attempts to restore session. If unrecoverable, user can restart with option to skip to their last position.

- **What happens when** a user selects a topic with insufficient questions in the database?  
  → System transparently generates new questions to meet the requested count, with loading indicator showing "Generating X more questions..."

- **What happens when** AI returns malformed JSON or invalid response format?  
  → System catches parsing errors, logs detailed error context, and retries up to 3 times with exponential backoff. If all retries fail, falls back to alternative provider or returns cached questions.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Question Generation
- **FR-001**: System MUST generate cybersecurity quiz questions using local Ollama AI model as the primary provider
- **FR-002**: System MUST support fallback to external AI providers (OpenAI/Anthropic) when local model is unavailable, with explicit user notification
- **FR-003**: System MUST support question generation for configurable topics: Network Security, Web Application Security, Cryptography, Cloud Security, Red Team Operations, Blue Team Operations, Incident Response, MITRE ATT&CK
- **FR-004**: System MUST support multiple question types: Multiple Choice (single answer), True/False, Scenario-based, Red Team/Blue Team perspective
- **FR-005**: System MUST generate questions with three difficulty levels: Easy (0.0-0.4), Medium (0.4-0.7), Hard (0.7-1.0), based on a documented scoring rubric
- **FR-006**: System MUST limit question generation to 1-20 questions per quiz session
- **FR-007**: System MUST complete question generation within 60 seconds for 10 questions or display timeout error

#### Question Validation & Quality
- **FR-008**: System MUST perform secondary AI validation call to assess question quality and factual correctness
- **FR-009**: System MUST assign quality scores (0-1) based on: clarity, factual accuracy, answer correctness, explanation quality
- **FR-010**: System MUST flag questions with quality score <0.5 for mandatory admin review before user exposure
- **FR-011**: System MUST detect duplicate questions using embedding similarity (cosine similarity threshold >0.95)
- **FR-012**: System MUST extract and store metadata for each question: difficulty score, quality score, MITRE ATT&CK techniques, tags, category, question type

#### Question Storage & Retrieval
- **FR-013**: System MUST store questions in PostgreSQL with schema: id, question_text, options (JSON), correct_answer, explanation, difficulty, quality_score, category, question_type, is_validated, ai_provider, created_at, updated_at
- **FR-014**: System MUST generate and store text embeddings for each question in Qdrant vector database
- **FR-015**: System MUST support semantic search queries returning top-K similar questions (configurable K, default 10)
- **FR-016**: System MUST support filtering questions by: topic, difficulty, validation status, AI provider, date range, quality score threshold
- **FR-017**: System MUST maintain referential integrity between PostgreSQL questions and Qdrant embeddings (cascade deletes)

#### Quiz Sessions
- **FR-018**: System MUST create quiz sessions with: session_id, user_id (optional for anonymous), topic, difficulty, question_count, start_time
- **FR-019**: System MUST randomly select questions from database matching user-specified criteria OR generate new questions if insufficient in database
- **FR-020**: System MUST track user responses per session: session_id, question_id, user_answer, is_correct, time_taken
- **FR-021**: System MUST calculate and display quiz results: total score, percentage, correct/incorrect breakdown, time taken
- **FR-022**: System MUST provide explanations for each question after quiz submission (correct answer + detailed explanation)
- **FR-023**: System MUST support quiz session pause/resume within 24 hours (session timeout)

#### Scoring & Leaderboard
- **FR-024**: System MUST record quiz scores with: player_name (optional), score, total_questions, accuracy_percentage, time_taken, topic, difficulty, created_at
- **FR-025**: System MUST display global leaderboard with top 10 scores (configurable limit), sorted by accuracy then time
- **FR-026**: System MUST support leaderboard filtering by: topic, difficulty, time period (today, week, month, all-time)

#### Admin Console
- **FR-027**: System MUST provide admin authentication using email/password with JWT tokens
- **FR-028**: Admin panel MUST display all generated questions with: preview, metadata, validation status, quality score
- **FR-029**: Admin panel MUST allow question CRUD operations: view details, validate, edit, delete
- **FR-030**: Admin panel MUST display AI usage dashboard: total calls, provider breakdown, average latency, token usage, error rate, cost estimation
- **FR-031**: Admin panel MUST allow bulk operations: validate multiple questions, delete low-quality questions (quality <threshold)
- **FR-032**: Admin panel MUST provide logs viewer: AI generation logs, validation logs, error logs with filtering and search

#### AI Adapter Layer
- **FR-033**: System MUST implement provider-agnostic AI interface with methods: `generateQuestion(prompt)`, `validateQuestion(question)`, `generateEmbedding(text)`
- **FR-034**: System MUST support Ollama provider with configurable models: llama3.1:70b (generation), nomic-embed-text (embeddings)
- **FR-035**: System MUST support OpenAI provider with models: gpt-4o (generation), text-embedding-3-large (embeddings)
- **FR-036**: System MUST implement rate limiting per provider: configurable requests/minute, daily quotas
- **FR-037**: System MUST implement retry logic with exponential backoff (3 retries, base delay 1s, max delay 10s)
- **FR-038**: System MUST log all AI requests with: timestamp, provider, model, prompt_hash, latency, token_count, status (success/failure), error_message
- **FR-039**: System MUST sanitize and store AI prompts in structured format (no injection attacks)

#### Data Privacy & Security
- **FR-040**: System MUST NOT send user data or quiz content to external AI providers unless explicitly enabled via environment variable `ALLOW_EXTERNAL_AI=true`
- **FR-041**: System MUST store AI prompts and responses in sanitized format (remove PII, no raw user input)
- **FR-042**: System MUST validate all user inputs using Zod schemas before processing
- **FR-043**: System MUST implement CORS restrictions allowing only configured origins
- **FR-044**: System MUST use HTTP-only secure cookies for admin session management
- **FR-045**: System MUST hash admin passwords using bcrypt with minimum 10 salt rounds

### Key Entities

- **User**: Represents quiz takers (optional for anonymous sessions)  
  *Attributes*: id, username (optional), email (optional), created_at, last_quiz_date  
  *Relationships*: Has many QuizSessions, has many ResponseHistory entries

- **Question**: Represents a single quiz question with metadata  
  *Attributes*: id, question_text, options (JSON array), correct_answer, explanation, difficulty (float 0-1), quality_score (float 0-1), category (enum), question_type (enum), is_validated (boolean), ai_provider (enum), mitre_techniques (JSON array), tags (JSON array), created_at, updated_at  
  *Relationships*: Has one QuestionMetadata, has many ResponseHistory entries

- **QuestionMetadata**: Extended metadata for questions  
  *Attributes*: question_id (FK), embedding_id (Qdrant ID), difficulty_components (JSON: complexity, verbosity, ambiguity), validation_score (float), validator_model (string), mitre_mappings (JSON), concept_tags (JSON array), generated_prompt_hash (string)  
  *Relationships*: Belongs to Question

- **QuizSession**: Represents a single quiz attempt  
  *Attributes*: id, user_id (FK, nullable), topic (enum), difficulty_level (enum), question_count (int), start_time (timestamp), end_time (timestamp, nullable), status (enum: in_progress, completed, abandoned)  
  *Relationships*: Belongs to User (optional), has many ResponseHistory entries, has many Questions (through quiz_session_questions join table)

- **ResponseHistory**: Tracks user answers within quiz sessions  
  *Attributes*: id, session_id (FK), question_id (FK), user_answer (string), is_correct (boolean), time_taken (int, seconds), answered_at (timestamp)  
  *Relationships*: Belongs to QuizSession, belongs to Question

- **Score**: Leaderboard entry for completed quizzes  
  *Attributes*: id, session_id (FK), player_name (string, nullable), score (int), total_questions (int), accuracy_percentage (float), time_taken (int), topic (enum), difficulty (enum), created_at (timestamp)  
  *Relationships*: Belongs to QuizSession

- **AIRequestLog**: Audit log for all AI provider calls  
  *Attributes*: id, provider (enum: ollama, openai, anthropic), model (string), operation (enum: generate, validate, embed), prompt_hash (string), latency_ms (int), token_count (int, nullable), status (enum: success, failure), error_message (text, nullable), created_at (timestamp)  
  *Relationships*: Standalone entity for monitoring

- **AdminUser**: Authenticated admin for console access  
  *Attributes*: id, email (unique), password_hash, role (enum: admin, super_admin), created_at, last_login_at  
  *Relationships*: Standalone entity

---

## System Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js App Router                       │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  User Pages   │  │  Admin Panel │  │  API Routes     │  │
│  │  /quiz        │  │  /admin      │  │  /api/questions │  │
│  │  /score       │  │  /admin-login│  │  /api/quiz      │  │
│  │  /            │  │              │  │  /api/scores    │  │
│  └───────┬───────┘  └──────┬───────┘  └────────┬────────┘  │
│          │                  │                    │           │
│          └──────────────────┴────────────────────┘           │
│                             │                                │
└─────────────────────────────┼────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌─────────────────┐   ┌──────────────────┐
│  AI Adapter   │    │  PostgreSQL DB  │   │  Qdrant Vector   │
│     Layer     │    │   (via Prisma)  │   │      DB          │
│               │    │                 │   │                  │
│ ┌───────────┐ │    │  • Questions    │   │  • Embeddings    │
│ │  Ollama   │ │    │  • Sessions     │   │  • Similarity    │
│ │ (Primary) │ │    │  • Scores       │   │    Search        │
│ └───────────┘ │    │  • Users        │   │                  │
│ ┌───────────┐ │    │  • Metadata     │   │                  │
│ │  OpenAI   │ │    │  • AI Logs      │   │                  │
│ │(Fallback) │ │    │                 │   │                  │
│ └───────────┘ │    └─────────────────┘   └──────────────────┘
│               │
│  Rate Limit   │
│  Retry Logic  │
│  Logging      │
└───────────────┘
```

### API Route Structure

```
/api
├── /questions
│   ├── GET     - List questions (filter: topic, difficulty, validated, limit, offset)
│   ├── POST    - Generate new question(s) [AI call]
│   └── /:id
│       ├── GET    - Get question details + metadata
│       ├── PATCH  - Update question (admin: validate, edit)
│       └── DELETE - Delete question (admin)
│
├── /quiz
│   ├── POST /sessions    - Create new quiz session
│   ├── GET  /sessions/:id - Get session details
│   ├── POST /sessions/:id/submit - Submit answers
│   └── GET  /sessions/:id/results - Get results + explanations
│
├── /scores
│   ├── GET     - Get leaderboard (filter: topic, difficulty, period, limit)
│   └── POST    - Submit quiz score
│
├── /ai
│   ├── POST /generate     - Generate question(s) via AI
│   ├── POST /validate     - Validate question quality
│   └── POST /embed        - Generate embedding
│
├── /admin
│   ├── GET  /questions    - List all questions with metadata
│   ├── POST /questions/bulk-validate - Validate multiple questions
│   ├── DELETE /questions/bulk-delete - Delete multiple questions
│   ├── GET  /logs         - Get AI request logs (paginated)
│   └── GET  /dashboard    - Get usage statistics
│
└── /auth
    ├── POST /login  - Admin login
    ├── POST /logout - Admin logout
    └── GET  /me     - Get current admin user
```

### Question Generation Pipeline

```
User Request (Topic, Difficulty, Count)
         │
         ▼
┌─────────────────────────────┐
│  1. Validate Input (Zod)    │
│     - Topic exists          │
│     - Difficulty valid      │
│     - Count within limits   │
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│  2. Check Existing DB       │
│     - Query PostgreSQL      │
│     - Count available Qs    │
└─────────────┬───────────────┘
              ▼
       ┌──────┴──────┐
       │ Sufficient? │
       └──────┬──────┘
         No   │   Yes
     ┌────────┴────────┐
     ▼                 ▼
┌─────────────┐  ┌──────────────┐
│ 3. Generate │  │ 4. Retrieve  │
│    via AI   │  │   from DB    │
│             │  │              │
│ • Prompt    │  │ • SELECT     │
│ • Ollama/   │  │ • Random     │
│   OpenAI    │  │   Sampling   │
│ • Parse     │  └──────┬───────┘
│   Response  │         │
└──────┬──────┘         │
       │                │
       ▼                │
┌─────────────────┐     │
│ 5. Validate Q   │     │
│    (Secondary   │     │
│     AI Call)    │     │
│                 │     │
│ • Quality Score │     │
│ • Factuality    │     │
└──────┬──────────┘     │
       │                │
       ▼                │
┌─────────────────┐     │
│ 6. Generate     │     │
│    Embedding    │     │
│                 │     │
│ • AI Embed API  │     │
│ • Store Qdrant  │     │
└──────┬──────────┘     │
       │                │
       ▼                │
┌─────────────────┐     │
│ 7. Extract      │     │
│    Metadata     │     │
│                 │     │
│ • Difficulty    │     │
│ • MITRE map     │     │
│ • Concept tags  │     │
└──────┬──────────┘     │
       │                │
       ▼                │
┌─────────────────┐     │
│ 8. Duplicate    │     │
│    Check        │     │
│                 │     │
│ • Embedding     │     │
│   Similarity    │     │
│ • Cosine > 0.95 │     │
└──────┬──────────┘     │
   Not Dup│             │
       ▼  │             │
┌─────────────────┐     │
│ 9. Store in     │     │
│    PostgreSQL   │     │
│                 │     │
│ • Question row  │     │
│ • Metadata row  │     │
│ • AI log entry  │     │
└──────┬──────────┘     │
       │                │
       └────────┬───────┘
                ▼
       ┌────────────────┐
       │ 10. Return to  │
       │     Client     │
       │                │
       │ • Question IDs │
       │ • Session ID   │
       └────────────────┘
```

### AI Adapter Interface

```typescript
interface AIProvider {
  name: string;
  
  generateQuestion(params: QuestionGenerationParams): Promise<GeneratedQuestion>;
  
  validateQuestion(question: Question): Promise<ValidationResult>;
  
  generateEmbedding(text: string): Promise<number[]>;
  
  isAvailable(): Promise<boolean>;
}

interface QuestionGenerationParams {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: 'multiple-choice' | 'true-false' | 'scenario';
  count: number;
  additionalContext?: string;
}

interface GeneratedQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  estimatedDifficulty: number;
  mitreMapping?: string[];
  tags: string[];
}

interface ValidationResult {
  qualityScore: number; // 0-1
  factualAccuracy: number; // 0-1
  clarityScore: number; // 0-1
  issues: string[];
  recommendation: 'approve' | 'review' | 'reject';
}
```

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can generate and complete a 10-question quiz within 2 minutes (from topic selection to viewing results)
- **SC-002**: System generates questions using local Ollama provider with 95%+ uptime during business hours
- **SC-003**: Question quality scores average >0.7 (70%) across all generated questions
- **SC-004**: Duplicate detection prevents >99% of semantically identical questions (cosine similarity >0.95)
- **SC-005**: Admin can review and validate 50 questions in under 5 minutes using bulk operations
- **SC-006**: AI provider fallback occurs automatically within 5 seconds of primary provider failure
- **SC-007**: System handles 100 concurrent quiz sessions without performance degradation (response time <500ms)
- **SC-008**: Leaderboard updates within 1 second of quiz submission
- **SC-009**: Vector search returns semantically relevant questions with >80% user-perceived relevance
- **SC-010**: Zero external AI calls occur when `ALLOW_EXTERNAL_AI=false` (verified via logs)
- **SC-011**: Admin dashboard loads AI usage statistics for 10,000+ requests in under 2 seconds
- **SC-012**: Question generation failure rate <5% under normal operation (excluding intentional invalid inputs)

### Technical Success Metrics

- **TSC-001**: API response times: p50 <200ms, p95 <500ms, p99 <1000ms for all endpoints
- **TSC-002**: Database query performance: <50ms for question retrieval, <100ms for complex joins
- **TSC-003**: Vector search latency: <300ms for top-10 similarity search with 10,000+ embeddings
- **TSC-004**: AI generation latency: <3s per question (Ollama), <5s per question (OpenAI fallback)
- **TSC-005**: Container startup time: <30s for all services (Next.js, PostgreSQL, Qdrant, Ollama)
- **TSC-006**: Zero SQL injection vulnerabilities (verified via automated security scanning)
- **TSC-007**: Zero prompt injection vulnerabilities in AI layer (verified via penetration testing)
- **TSC-008**: Test coverage: >80% for business logic, >60% overall
- **TSC-009**: Build time: <2 minutes for production Docker image
- **TSC-010**: Database migration execution: <10s for schema updates

---

## Technical Constraints

### Non-Negotiable Constraints

1. **No file uploads in V1**: All question generation via AI prompts only; no document parsing, no image upload
2. **Strict UI/AI separation**: No AI API calls from browser; all AI logic server-side only
3. **Privacy-first architecture**: Default to on-prem AI; external calls opt-in only via environment flag
4. **Containerized deployment**: All components (app, databases, AI) must run in Docker containers
5. **Type safety**: End-to-end TypeScript with strict mode; no `any` types in production code
6. **API-first**: All features accessible via documented REST API routes
7. **Schema validation**: All API inputs/outputs validated with Zod schemas
8. **Stateless API**: No server-side session storage; JWT tokens for auth only
9. **Idempotent operations**: All API mutations support safe retry without side effects
10. **Audit logging**: All AI requests, admin actions, and errors logged with structured format

### Technology Stack (Locked)

- **Frontend**: Next.js 15 App Router, React 18+, TypeScript 5.x
- **UI Library**: shadcn/ui, Radix UI, Tailwind CSS 3.x
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL 15+ (via Prisma ORM or Drizzle)
- **Vector DB**: Qdrant (containerized)
- **AI Primary**: Ollama (local REST API)
- **AI Fallback**: OpenAI GPT-4 or Anthropic Claude (configurable)
- **Auth**: Custom JWT with bcrypt password hashing
- **Validation**: Zod schemas
- **Testing**: Jest (unit), Playwright (E2E)
- **Containerization**: Docker, Docker Compose

---

## Out of Scope (V1)

The following features are explicitly **NOT** included in the baseline specification and may be considered for future versions:

- ❌ User account registration and profile management (anonymous quizzes only)
- ❌ Social features (sharing quizzes, collaborative learning)
- ❌ Advanced analytics and progress tracking over time
- ❌ Integration with Learning Management Systems (LMS)
- ❌ Mobile native applications (iOS/Android)
- ❌ Real-time multiplayer quiz competitions
- ❌ Question import from external sources (CSV, PDF, APIs)
- ❌ Custom domain MITRE ATT&CK technique training
- ❌ Automated question difficulty calibration based on user performance data
- ❌ Multi-language support (English only in V1)
- ❌ Accessibility compliance (WCAG 2.1 AA) - basic accessibility only
- ❌ Custom AI model fine-tuning
- ❌ Question versioning and change history
- ❌ Advanced admin roles and permissions (single admin role only)
- ❌ Webhooks or event-driven integrations
- ❌ Data export/import capabilities

---

## Appendix: Data Models

### PostgreSQL Schema

```sql
-- Users (optional for anonymous quizzes)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_quiz_date TIMESTAMP
);

-- Questions
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of answer options
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  difficulty DECIMAL(3,2) CHECK (difficulty >= 0 AND difficulty <= 1),
  quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 1),
  category VARCHAR(100) NOT NULL, -- e.g., 'network-security', 'web-app-security'
  question_type VARCHAR(50) NOT NULL, -- 'multiple-choice', 'true-false', 'scenario'
  is_validated BOOLEAN DEFAULT FALSE,
  ai_provider VARCHAR(50) NOT NULL, -- 'ollama', 'openai', 'anthropic'
  mitre_techniques JSONB, -- Array of MITRE ATT&CK technique IDs
  tags JSONB, -- Array of concept tags
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Question Metadata (extended data)
CREATE TABLE question_metadata (
  question_id INTEGER PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
  embedding_id VARCHAR(255) NOT NULL, -- Qdrant vector ID
  difficulty_components JSONB, -- { complexity: 0.8, verbosity: 0.6, ambiguity: 0.3 }
  validation_score DECIMAL(3,2),
  validator_model VARCHAR(100),
  generated_prompt_hash VARCHAR(64),
  concept_tags JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Quiz Sessions
CREATE TABLE quiz_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  topic VARCHAR(100) NOT NULL,
  difficulty_level VARCHAR(20) NOT NULL, -- 'easy', 'medium', 'hard'
  question_count INTEGER NOT NULL,
  start_time TIMESTAMP DEFAULT NOW(),
  end_time TIMESTAMP,
  status VARCHAR(20) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Quiz Session Questions (join table)
CREATE TABLE quiz_session_questions (
  session_id INTEGER REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  PRIMARY KEY (session_id, question_id)
);

-- Response History
CREATE TABLE response_history (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_taken INTEGER, -- seconds
  answered_at TIMESTAMP DEFAULT NOW()
);

-- Scores (leaderboard)
CREATE TABLE scores (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES quiz_sessions(id) ON DELETE SET NULL,
  player_name VARCHAR(255),
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  accuracy_percentage DECIMAL(5,2),
  time_taken INTEGER, -- seconds
  topic VARCHAR(100),
  difficulty VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Request Logs
CREATE TABLE ai_request_logs (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL, -- 'ollama', 'openai', 'anthropic'
  model VARCHAR(100) NOT NULL,
  operation VARCHAR(50) NOT NULL, -- 'generate', 'validate', 'embed'
  prompt_hash VARCHAR(64) NOT NULL,
  latency_ms INTEGER,
  token_count INTEGER,
  status VARCHAR(20) NOT NULL, -- 'success', 'failure'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Admin Users
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'admin', -- 'admin', 'super_admin'
  created_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_validated ON questions(is_validated);
CREATE INDEX idx_questions_created ON questions(created_at);
CREATE INDEX idx_quiz_sessions_topic ON quiz_sessions(topic);
CREATE INDEX idx_scores_created ON scores(created_at);
CREATE INDEX idx_ai_logs_provider ON ai_request_logs(provider);
CREATE INDEX idx_ai_logs_created ON ai_request_logs(created_at);
```

### Qdrant Vector Collection Schema

```json
{
  "name": "cyberquiz_questions",
  "vectors": {
    "size": 768,
    "distance": "Cosine"
  },
  "payload_schema": {
    "question_id": "integer",
    "question_text": "text",
    "category": "keyword",
    "difficulty": "float",
    "tags": "keyword[]",
    "created_at": "datetime"
  }
}
```

---

## Appendix: AI Prompt Templates

### Question Generation Prompt Template

```
You are an expert cybersecurity instructor creating quiz questions.

Generate a {question_type} question on the topic: {topic}

Requirements:
- Difficulty level: {difficulty} (0.0-1.0 scale)
- Question type: {question_type}
- Include 4 answer options (for multiple-choice)
- Provide detailed explanation for the correct answer
- Tag with relevant MITRE ATT&CK techniques if applicable
- Use clear, unambiguous language
- Ensure factual accuracy

Topic: {topic}
Difficulty: {difficulty}
Question Type: {question_type}

Return response in JSON format:
{
  "questionText": "...",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correctAnswer": "A",
  "explanation": "...",
  "mitreTechniques": ["T1059", "T1078"],
  "tags": ["privilege-escalation", "linux"],
  "estimatedDifficulty": 0.75
}
```

### Question Validation Prompt Template

```
You are a cybersecurity expert reviewing quiz questions for quality and accuracy.

Evaluate the following question:

Question: {question_text}
Options: {options}
Correct Answer: {correct_answer}
Explanation: {explanation}

Assess on these criteria (0.0-1.0 scale):
1. Factual Accuracy: Is the information technically correct?
2. Clarity: Is the question unambiguous and well-written?
3. Answer Correctness: Is the marked answer actually correct?
4. Explanation Quality: Does the explanation adequately justify the answer?

Return response in JSON format:
{
  "qualityScore": 0.85,
  "factualAccuracy": 0.9,
  "clarityScore": 0.8,
  "issues": ["Minor: Option C could be more specific"],
  "recommendation": "approve"
}
```

---

**End of Specification**

---

**Next Steps:**
1. Review and approve this specification
2. Create implementation plan with prioritized tasks
3. Set up development environment (Docker Compose, Ollama, Qdrant)
4. Initialize database schemas
5. Implement AI adapter layer and provider interfaces
6. Build question generation pipeline (P1 user story)
7. Develop quiz UI and scoring system
8. Create admin console for question management
9. Write comprehensive test suite
10. Deploy to staging environment for user testing
