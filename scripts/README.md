# Scripts Directory

This directory contains operational scripts for CyberQuiz deployment, maintenance, and development.

## 🚀 Deployment Scripts

### `verify-deployment.sh` ⭐ NEW
**Use before every deployment**

Pre-deployment validation that checks:
- Environment configuration
- Database migrations present
- Docker setup correct
- (Optional) Test build

```bash
./scripts/verify-deployment.sh
```

Exit codes:
- `0` = Safe to deploy
- `1` = Fix errors first

### `docker-startup.sh` ⭐ ENHANCED
**Runs automatically in production container**

Startup sequence:
1. Wait for database
2. Generate Prisma Client
3. Run migrations
4. Verify schema
5. Create admin user
6. Initialize settings
7. Start Next.js server

Called by: Docker CMD in production container

### `docker-init.sh`
Legacy initialization script (deprecated - use docker-startup.sh)

### `init-ollama.sh`
Initializes Ollama AI models in Docker container:
- Starts Ollama service
- Pulls mistral:7b (question generation)
- Pulls nomic-embed-text:latest (embeddings)

Called by: Ollama container entrypoint

## 👥 Admin Management

### `create-admin.ts`
Creates an admin user account

```bash
npx ts-node scripts/create-admin.ts
```

Prompts for email and password interactively.

### `ensure-admin.ts`
Ensures admin user exists (creates if missing)

```bash
npx ts-node scripts/ensure-admin.ts
```

Used by docker-startup.sh for automated setup.

### `verify-admin.ts`
Verifies admin account exists and credentials work

```bash
npx ts-node scripts/verify-admin.ts
```

## ⚙️ Configuration Scripts

### `ensure-generation-settings.ts`
Ensures GenerationSettings table has default configuration

```bash
npx ts-node scripts/ensure-generation-settings.ts
```

Creates defaults:
- Buffer size: 50 questions
- Auto-refill: enabled
- Default model: mistral:7b
- Enabled domains, skills, difficulties, granularities

### `init-app.ts`
Complete app initialization (combines multiple init tasks)

```bash
npx ts-node scripts/init-app.ts
```

Runs:
1. Database migrations
2. Admin user creation
3. Generation settings setup

## 🗄️ Database Scripts

### `seed.ts`
Seeds database with sample data for development

```bash
npx prisma db seed
```

Creates:
- Sample questions (true/false format)
- Sample quiz sessions
- Sample scores and leaderboard entries
- Does NOT create admin user (use ensure-admin.ts)

## 🧪 Testing & Validation Scripts

### `test-login.cjs`
Tests admin login functionality

```bash
node scripts/test-login.cjs
```

Verifies:
- Login endpoint works
- Password validation
- JWT token generation

### `test-export-import.sh`
Tests question export/import functionality

```bash
./scripts/test-export-import.sh
```

Validates:
- Export API returns JSON
- Import API accepts questions
- Format compatibility

### `test-similarity.sh`
Tests semantic similarity detection

```bash
./scripts/test-similarity.sh
```

Checks:
- Qdrant connection
- Embedding generation
- Duplicate detection

### `verify-quality-metrics.sh`
Verifies quality scoring system

```bash
./scripts/verify-quality-metrics.sh
```

Tests:
- Quality score calculation
- Metadata extraction
- Question validation

### `pre-push-validation.sh`
Git pre-push hook validation

```bash
./scripts/pre-push-validation.sh
```

Runs:
- TypeScript compilation check
- Prisma schema validation
- Basic linting

## 🔧 Build Scripts

### `build-wrapper.sh`
Wrapper for Next.js build with environment setup

```bash
./scripts/build-wrapper.sh
```

Ensures proper environment during build.

## 🏃 Development Scripts

### `setup-dev.sh`
Sets up local development environment

```bash
./scripts/setup-dev.sh
```

Performs:
1. Install dependencies
2. Setup database
3. Run migrations
4. Seed data
5. Create admin user

---

## 📋 Common Workflows

### First-Time Setup
```bash
# 1. Setup development environment
./scripts/setup-dev.sh

# 2. Verify admin account
npx ts-node scripts/verify-admin.ts

# 3. Start development server
npm run dev
```

### Pre-Deployment
```bash
# 1. Run verification
./scripts/verify-deployment.sh

# 2. If passing, deploy
docker compose up -d --build

# 3. Monitor startup
docker compose logs -f nextjs-app
```

### Production Troubleshooting
```bash
# Check if admin exists
npx ts-node scripts/verify-admin.ts

# Recreate admin if needed
npx ts-node scripts/create-admin.ts

# Check generation settings
npx ts-node scripts/ensure-generation-settings.ts

# Test core functionality
node scripts/test-login.cjs
./scripts/test-similarity.sh
```

---

## ⚠️ Important Notes

### Script Execution Context

**In Development** (local):
- Run with `npx ts-node` for TypeScript scripts
- Run with `./scripts/` for bash scripts
- Requires `.env` file with local database URLs

**In Production** (Docker):
- Scripts run automatically via docker-startup.sh
- Use `docker exec` to run scripts manually:
  ```bash
  docker exec cyberquiz-nextjs-prod npx ts-node scripts/verify-admin.ts
  ```

### Environment Variables

Scripts read from:
- `.env` (production/docker)
- `.env.dev` (development)

Ensure proper DATABASE_URL for context:
- Local: `localhost:5432`
- Docker: `postgres:5432`

### Permissions

Bash scripts should be executable:
```bash
chmod +x scripts/*.sh
```

This is done automatically during Docker build.

---

**For detailed deployment instructions**, see:
- [PRODUCTION_DEPLOYMENT.md](../docs/PRODUCTION_DEPLOYMENT.md)
- [DEPLOY_QUICKSTART.md](../docs/DEPLOY_QUICKSTART.md)
- [DEPLOYMENT_AUTOMATION_SUMMARY.md](../docs/DEPLOYMENT_AUTOMATION_SUMMARY.md)
