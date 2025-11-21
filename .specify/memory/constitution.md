# CyberQuiz Constitution
**Adaptive Cybersecurity Quiz Generator - Foundational Principles & Guardrails**

## Core Principles

### I. Reliability & Determinism
**Deterministic, reproducible behavior in quiz generation.**

- Quiz generation must produce consistent results given identical inputs and configuration
- All randomness must be seedable and reproducible for testing and debugging
- AI-generated questions must be cached and versioned to ensure consistency
- Question difficulty scoring must follow a documented, deterministic rubric
- State transitions (quiz sessions, user progress) must be predictable and auditable
- No silent failures: all errors must be logged and surfaced appropriately

### II. Security & Privacy-First
**Handle all user data with zero external leakage unless explicitly configured.**

- On-premise AI (Ollama) is the PRIMARY provider for all question generation
- External AI providers (OpenAI/Anthropic) only used when explicitly enabled via environment configuration
- No user data, questions, or quiz content sent to external services without explicit consent
- All AI provider calls logged with metadata (provider, latency, tokens) but NOT content by default
- JWT-based authentication with secure bcrypt password hashing
- Database credentials and secrets managed via environment variables only
- HTTPS required for production deployments
- Input sanitization and validation on all API endpoints using Zod schemas

### III. Modularity & Clean Architecture
**Clear separation between UI, API routes, vector database, AI provider layer, and question-generation logic.**

- **UI Layer**: React components in `src/components/`, Next.js pages in `app/`
- **API Layer**: Next.js API routes in `app/api/`, typed with Zod schemas
- **Business Logic**: Server actions and utilities in `src/lib/`
- **Data Layer**: Separate abstractions for PostgreSQL and Qdrant vector DB
- **AI Provider Layer**: Provider-agnostic abstraction in `src/lib/ai/` with pluggable backends
- **Database Models**: Typed entities and repositories, no direct SQL in business logic
- Each module must have a single, well-defined responsibility
- Dependencies flow inward: UI → API → Business Logic → Data/AI layers

### IV. Extensibility & Flexibility
**Easy to add new question categories, difficulty levels, or AI backends.**

- AI providers implement a common interface: `AIProvider` with methods for generation, validation, embeddings
- Question categories and difficulty levels defined as TypeScript enums, easily extensible
- Plugin architecture for question generators: each category/type can have custom generation logic
- Vector database abstraction allows switching from Qdrant to alternatives (Weaviate, Pinecone, etc.)
- Configuration-driven feature flags for enabling/disabling AI providers, categories, modes
- Middleware pattern for request/response transformations, allowing easy addition of logging, metrics, rate limiting

### V. Maintainability & Developer Experience
**Clean abstractions, typed contracts, predictable folder structure.**

- End-to-end TypeScript with strict mode enabled
- Zod schemas for all API inputs/outputs, shared between client and server
- Consistent naming conventions: PascalCase for components, camelCase for functions, SCREAMING_SNAKE_CASE for constants
- API routes follow RESTful conventions with standard HTTP methods
- Comprehensive JSDoc comments for all public APIs and complex logic
- Auto-generated API documentation from OpenAPI specs
- Structured folder hierarchy mirroring architectural layers
- Minimal use of `any` type; prefer `unknown` with type guards when necessary

## Technical Stack & Constraints

### Frontend Stack (NON-NEGOTIABLE)
- **Framework**: Next.js 15 with App Router (not Pages Router)
- **Language**: TypeScript 5.x with strict mode
- **UI Library**: shadcn/ui components + Radix UI primitives
- **Styling**: TailwindCSS with custom design tokens
- **State Management**: React hooks + Context API (no Redux/Zustand unless justified)
- **Forms**: React Hook Form + Zod validation

### Backend Stack (NON-NEGOTIABLE)
- **API Layer**: Next.js API routes + Server Actions for mutations
- **Validation**: Zod schemas for all inputs/outputs
- **Authentication**: Custom JWT with bcrypt password hashing
- **Session Management**: HTTP-only secure cookies

### Database Stack (CONTAINERIZED)
- **Relational DB**: PostgreSQL 15+ for structured data (users, quizzes, scores, question metadata)
- **Vector DB**: Qdrant (containerized) for embeddings and semantic search
- **Migrations**: SQL scripts in `database/migrations/` with version tracking
- **Connection Pooling**: pg-pool for PostgreSQL connections
- **Schema Validation**: Database schema must match TypeScript types (use code generation if feasible)

### AI & ML Stack
- **Primary Provider**: Ollama (local, on-premise) via REST API
- **Secondary Providers**: OpenAI GPT-4 / Anthropic Claude (via environment toggle)
- **Abstraction Layer**: `src/lib/ai/providers/` with unified interface
- **Models**: 
  - Question Generation: `llama3.1:70b` (Ollama) or `gpt-4o` (OpenAI)
  - Embeddings: `nomic-embed-text` (Ollama) or `text-embedding-3-large` (OpenAI)
  - Validation: `llama3.1:8b` (fast local validation) or `gpt-4o-mini`
- **Rate Limiting**: Configurable per-provider rate limits and retry logic
- **Fallback Strategy**: Graceful degradation if primary provider unavailable

### Infrastructure (CONTAINERIZED)
- **Container Runtime**: Docker + Docker Compose
- **Services**: Next.js app, PostgreSQL, Qdrant, Ollama (all containerized)
- **Networking**: Internal Docker network, external ports only for app and admin tools
- **Volumes**: Persistent volumes for PostgreSQL data, Qdrant storage, Ollama models
- **Environment Parity**: Dev and prod use same container configurations

## Architecture Principles

### API-First Modularity
- Every feature must be accessible via a typed API route or server action
- API contracts defined with Zod schemas, versioned, and documented
- No business logic in React components—delegate to server actions or API routes
- API responses follow standard format: `{ success: boolean, data?: T, error?: string }`

### Strong Typing & Validation
- All API inputs validated with Zod schemas before processing
- All database queries return typed results matching defined interfaces
- No implicit `any` types—use explicit types or `unknown` with type guards
- Shared types in `src/types/` for entities, DTOs, API contracts
- Generated types from database schema (consider Prisma or Drizzle for type safety)

### Observability & Monitoring
- Structured logging using a standard format: `{ timestamp, level, message, context, metadata }`
- All AI requests logged with: provider, model, latency, token count, error status
- API endpoints log: method, path, status, duration, user context
- Error tracking with stack traces and contextual data
- Metrics exposed for: request counts, latency percentiles, error rates, AI provider usage
- Health check endpoints for all services: `/api/health`, `/api/health/db`, `/api/health/ai`

### Edge Safety & Security
- No direct AI API calls from the browser—all AI logic in server-side code
- API routes protected with authentication middleware where required
- Rate limiting on public endpoints (quiz submissions, chat)
- Input sanitization to prevent injection attacks (SQL, NoSQL, prompt injection)
- CORS configured to allow only trusted origins in production
- Secrets never logged or exposed in error messages

### Privacy & Data Governance
- User quiz submissions stored with anonymized player names (no PII without consent)
- AI prompts and responses NOT logged by default (configurable for debugging)
- Vector embeddings stored without linking to identifiable users
- Admin panel accessible only to authenticated admin users
- Database backups encrypted and stored securely
- Data retention policies configurable (auto-delete old quiz sessions)

## Non-Goals

### Explicitly Out of Scope
- **No monolithic backend**: Next.js serves as the unified application; no separate Express/NestJS server
- **No direct database access from frontend**: All data fetched via API routes or server actions
- **No AI hallucinations for factual questions**: Verification layer required for cybersecurity content
- **No client-side secrets**: API keys, database credentials, JWT secrets never exposed to browser
- **No real-time collaboration**: Quiz sessions are single-player; leaderboard updated on submission
- **No mobile apps**: Focus on responsive web; native apps not in scope for v1.0

## Quality Principles

### Testability (NON-NEGOTIABLE)
- **Unit Tests**: All question generators, validators, utility functions
- **API Tests**: All API routes with mocked database and AI providers
- **Integration Tests**: End-to-end flows (quiz generation → submission → scoring)
- **Contract Tests**: AI provider interface compliance for all implementations
- **Test Coverage**: Minimum 80% for business logic, 60% overall
- **Test Isolation**: No shared state between tests; use factories for test data
- **CI/CD**: Tests run on every commit; deployment blocked if tests fail

### Documentation-First
- **README**: Project overview, setup instructions, architecture diagram
- **API Documentation**: Auto-generated OpenAPI spec from Zod schemas
- **Architecture Diagrams**: Mermaid diagrams for system architecture, data flow, deployment
- **ADRs (Architecture Decision Records)**: Document all significant technical decisions
- **Inline Documentation**: JSDoc for all public functions, complex algorithms
- **Runbooks**: Deployment, rollback, disaster recovery, common troubleshooting

### Predictability & Consistency
- **Question Difficulty Scoring**: Based on documented rubric with weighted factors
  - Complexity: technical depth, prerequisite knowledge
  - Verbosity: question length, answer explanation length
  - Ambiguity: clarity of correct answer, presence of edge cases
- **Deterministic Scoring**: Same quiz content produces same difficulty scores
- **Consistent Error Handling**: Standard error shapes, HTTP status codes, user-friendly messages
- **Versioned AI Prompts**: Question generation prompts versioned and stored in `src/lib/ai/prompts/`

## Development Workflow

### Feature Development Process
1. **Specification**: Define feature requirements, API contracts, acceptance criteria
2. **Design**: Create architecture diagrams, sequence diagrams, data models
3. **Test Cases**: Write failing tests based on acceptance criteria
4. **Implementation**: Implement feature to pass tests
5. **Code Review**: Peer review for code quality, security, adherence to constitution
6. **Integration Testing**: Verify feature works with existing system
7. **Documentation**: Update API docs, README, architecture diagrams

### Code Review Requirements
- All code changes require at least one approval
- Reviewers must verify:
  - Adherence to constitution principles
  - Proper typing and validation
  - Test coverage meets thresholds
  - Security best practices followed
  - Documentation updated
- No direct commits to `main` branch; feature branches only

### Quality Gates (CI/CD)
- **Linting**: ESLint with TypeScript rules, no errors allowed
- **Type Checking**: `tsc --noEmit` must pass with zero errors
- **Unit Tests**: All tests pass, 80% coverage on business logic
- **API Tests**: All API endpoints tested, contracts validated
- **Build**: `next build` completes without errors
- **Security Scan**: Dependencies scanned for known vulnerabilities
- **Deployment**: Automated deployment to staging on merge to `main`

## Governance

### Constitution Authority
- This constitution supersedes all other development practices and guidelines
- All architectural decisions must align with core principles
- Deviations require documented justification and approval
- Constitution amendments require consensus and version increment

### Compliance Verification
- All pull requests must include checklist verifying compliance with constitution
- Code reviews explicitly verify adherence to principles and constraints
- Technical debt documented as ADRs with mitigation plans
- Complexity introduced must be justified against core principles (especially modularity and maintainability)

### Amendment Process
1. Propose amendment with rationale and impact analysis
2. Review by project maintainers and stakeholders
3. Update constitution with version increment
4. Document migration plan if breaking changes
5. Update all related documentation and tooling

### Living Document
- Constitution reviewed quarterly for relevance and effectiveness
- Feedback from development team incorporated
- Lessons learned from production incidents reflected in updates

**Version**: 1.0.0 | **Ratified**: 2025-11-21 | **Last Amended**: 2025-11-21
