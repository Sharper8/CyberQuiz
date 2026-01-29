# Production Deployment Guide

## 🚀 Automated Deployment System

**NEW**: CyberQuiz now includes automated deployment verification and startup!

### What's Automated ✅

1. **Database Migrations** - Run automatically on container startup
2. **Schema Verification** - Critical tables checked before app starts
3. **Admin User Creation** - Automatic admin account setup
4. **Generation Settings** - Default configuration created
5. **Health Checks** - Container won't accept traffic until ready
6. **Pre-deployment Validation** - Script catches issues before deploy

### Quick Start (TL;DR)

```bash
# 1. Run verification
./scripts/verify-deployment.sh

# 2. Deploy
docker compose down
docker compose up -d --build

# 3. Verify
docker compose ps
curl http://localhost:3100/api/health | jq '.'
```

---

## 🚀 Pre-Deployment Checklist

### 1. Database Migrations ✅
**Status**: FULLY AUTOMATED - No manual intervention required

**How it works**:
1. Container starts → `docker-startup.sh` executes
2. Waits for PostgreSQL to be ready (with retries)
3. Generates Prisma Client with runtime environment
4. Runs `prisma migrate deploy` (applies all pending migrations)
5. Verifies critical tables exist (AdminUser, GenerationSettings, Question, etc.)
6. Creates admin user if missing
7. Creates default generation settings if missing
8. Only then starts Next.js server

**Migration logs**: Check with `docker compose logs nextjs-app | grep Migration`

**Safety**: 
- ✅ All migrations are idempotent (safe to run multiple times)
- ✅ All migrations are additive (no data loss risk)
- ✅ Failed migrations prevent app startup (fail-fast)
- ✅ Graceful handling of optional tables (e.g., GenerationSlotHistory)

### 2. Environment Variables 🔐

**CRITICAL: Update `.env` before deploying!**

```bash
# Generate secure credentials:
openssl rand -base64 32  # For DB_PASSWORD
openssl rand -base64 48  # For JWT_SECRET (minimum 32 chars)
openssl rand -base64 32  # For ADMIN_PASSWORD
```

**Required changes in `.env`:**
```env
# Change these BEFORE production deployment:
DB_PASSWORD=YOUR_SECURE_DB_PASSWORD_HERE
JWT_SECRET=YOUR_SECURE_JWT_SECRET_MIN_48_CHARS_HERE
ADMIN_PASSWORD=YOUR_SECURE_ADMIN_PASSWORD_HERE
```

**Current `.env` settings** (verified for Docker):
- ✅ DATABASE_URL uses `postgres:5432` (Docker service name)
- ✅ OLLAMA_BASE_URL uses `http://ollama:11434` (Docker service name)
- ✅ QDRANT_URL uses `http://qdrant:6333` (Docker service name)
- ⚠️  JWT_SECRET is 32+ chars (meets minimum requirement)
- ⚠️  Passwords need to be changed from placeholders

### 3. Docker Configuration ✅

**Build & Runtime Configuration**:
- ✅ Dockerfile accepts build ARGs for Next.js static generation
- ✅ docker-compose.yml passes required environment variables during build
- ✅ Runtime environment overrides ensure Docker service name resolution
- ✅ All services use health checks for proper startup orchestration

**Production Stack** (docker-compose.yml):
- Next.js App (port 3100)
- PostgreSQL 15 (port 5432)
- Ollama AI (port 11434)
- Qdrant Vector DB (port 6333)
- PgAdmin (port 5050)

## 📋 Deployment Steps

### Step 0: Pre-Deployment Verification (RECOMMENDED)

```bash
# Run the automated verification script
./scripts/verify-deployment.sh

# This checks:
# - ✓ .env file exists and is configured
# - ✓ JWT_SECRET is secure (32+ chars)
# - ✓ Database URLs use Docker service names
# - ✓ All migrations are present
# - ✓ Docker files are properly configured
# - ✓ Startup script includes migration commands
# - ✓ (Optional) Test Docker build
```

**If verification passes**, proceed to deployment.  
**If errors found**, fix them first - the script will tell you exactly what's wrong.

### Step 1: Prepare Production Environment

```bash
# 1. Update .env with secure values
nano .env  # or your preferred editor

# 2. Verify critical values are changed
grep -E "JWT_SECRET|DB_PASSWORD|ADMIN_PASSWORD" .env
# All should be changed from placeholders

# 3. Verify Docker service names (NOT localhost!)
grep -E "DATABASE_URL|OLLAMA_BASE_URL|QDRANT_URL" .env
# Should use: postgres:5432, ollama:11434, qdrant:6333
```

### Step 2: Deploy to Production Server

```bash
# On production server:

# 1. Pull latest code
git pull origin main

# 2. Stop existing services
docker compose down

# 3. Build and start with health checks
docker compose up -d --build

# 4. Monitor startup (containers will show 'starting' until healthy)
docker compose logs -f nextjs-app

# Watch for these startup messages:
# ✓ [Startup] Database connection established
# ✓ [Startup] Prisma Client generated successfully  
# ✓ [Startup] Migrations completed successfully
# ✓ [Startup] Database schema verified
# ✓ [Startup] Admin user created/verified
# ✓ [Startup] Generation settings configured
# ✓ [Startup] Starting Next.js server...

# 5. Wait for healthy status (30-60 seconds)
watch -n 2 'docker compose ps'

# All services should show (healthy) status
```

**Container won't accept traffic until**:
- PostgreSQL is healthy
- Migrations completed
- Schema verified
- Health endpoint returns 200 OK

This prevents broken deployments!

### Step 3: Post-Deployment Verification

```bash
# 1. Check all containers are healthy
docker compose ps

# Expected output:
# NAME                    STATUS
# cyberquiz-nextjs-prod   Up (healthy)
# cyberquiz-postgres-prod Up (healthy)
# cyberquiz-ollama-prod   Up (healthy)
# cyberquiz-qdrant-prod   Up
# cyberquiz-pgadmin-prod  Up

# 2. Verify health endpoint
curl http://localhost:3100/api/health | jq '.'

# Expected response:
# {
#   "status": "ok",
#   "services": {
#     "database": { "status": "ok" },
#     "aiProviders": { "status": "ok", "ollama": "available" }
#   }
# }

# 3. Check migrations were applied
docker compose logs nextjs-app | grep -i "migration"

# Should show:
# [Startup] Running database migrations...
# [Startup] ✓ Migrations completed successfully

# 4. Verify critical tables exist
docker compose logs nextjs-app | grep -i "table"

# Should show:
# [Startup]   ✓ Table AdminUser exists
# [Startup]   ✓ Table GenerationSettings exists
# [Startup]   ✓ Table Question exists
# ...

# 5. Check Ollama models are loaded
docker exec cyberquiz-ollama-prod ollama list

# Should show: mistral:7b and nomic-embed-text:latest

# 6. Test admin login
curl -X POST http://localhost:3100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cyberquiz.fr","password":"YOUR_ADMIN_PASSWORD"}'

# Should return JWT token

# 7. Access web interface
# Open browser: http://YOUR_SERVER_IP:3100
# Should load homepage with leaderboard
```

## 🔍 Migration Safety Analysis

### How Automated Migrations Work

**Startup Sequence** ([scripts/docker-startup.sh](../scripts/docker-startup.sh)):

1. **Database Connection Wait** (with retries)
   - Attempts PostgreSQL connection up to 30 times
   - 2-second delay between attempts
   - Fails fast if database unreachable

2. **Prisma Client Generation**
   - Regenerates client with runtime DATABASE_URL
   - Ensures compatibility with production environment

3. **Migration Deployment**
   - Runs `prisma migrate deploy`
   - Applies all pending migrations in order
   - Idempotent - safe to run multiple times
   - Exits with error if migration fails (prevents broken app)

4. **Schema Verification**
   - Checks existence of critical tables:
     - AdminUser
     - GenerationSettings
     - Question
     - QuizSession
     - Score
   - Exits if any critical table missing

5. **Data Initialization**
   - Creates admin user (if missing)
   - Creates default generation settings (if missing)

6. **Server Start**
   - Only starts if all above steps succeed
   - Health check endpoint monitors readiness

**Why This Prevents Issues**:
- ✅ **No race conditions**: Database must be ready before migrations
- ✅ **No partial migrations**: Failed migration stops container
- ✅ **No missing tables**: Schema verification catches migration issues
- ✅ **No broken deployments**: Health checks prevent traffic to broken containers
- ✅ **Graceful degradation**: Optional tables (GenerationSlotHistory) don't break app

### Database Schema Changes

All new migrations are **ADDITIVE ONLY** - zero risk of data loss:

1. **add_generation_difficulty**
   - Adds `generationDifficulty` field (nullable)
   - Safe: Existing questions remain unchanged

2. **add_ai_model_field**  
   - Adds `aiModel` field (nullable)
   - Safe: Existing questions remain unchanged

3. **update_generation_settings**
   - Adds new fields to GenerationSettings table
   - Safe: No existing data affected

**Migration Execution**:
- Runs automatically via Prisma in `docker-startup.sh`
- Idempotent: Safe to run multiple times
- Logged to console for verification

## 🚨 Troubleshooting Common Issues

### Issue 1: Container fails to start or stays in "starting" state

**Diagnosis**:
```bash
docker compose logs nextjs-app | tail -50
```

**Common causes and solutions**:

a) **Database connection failure**
```
[Startup] ✗ Failed to connect to database after 30 attempts
```
**Solution**: Check PostgreSQL is healthy
```bash
docker compose ps postgres
docker compose logs postgres
# Ensure DATABASE_URL uses 'postgres:5432' not 'localhost'
```

b) **Migration failure**
```
[Startup] ✗ Migration deployment failed
```
**Solution**: Check migration logs for specific error
```bash
docker compose logs nextjs-app | grep -A 10 "Migration"
# Often caused by concurrent migration attempts
# Restart the container: docker compose restart nextjs-app
```

c) **Schema verification failure**
```
[Startup] ✗ Table Question missing - schema verification failed
```
**Solution**: Migrations didn't run properly
```bash
# Force a clean migration
docker compose down
docker compose up -d postgres
# Wait for postgres to be healthy
docker compose up -d nextjs-app
```

### Issue 2: Health check keeps failing

**Diagnosis**:
```bash
curl -v http://localhost:3100/api/health
docker compose logs nextjs-app | grep -i error
```

**Solutions**:
- Check if server actually started: `docker compose logs nextjs-app | grep "Next.js"`
- Increase health check start_period: Edit [docker-compose.yml](docker-compose.yml) `start_period: 60s`
- Check if port 3000 is accessible inside container: `docker exec cyberquiz-nextjs-prod curl http://localhost:3000/api/health`

### Issue 3: Migrations run but table still missing

**This was the original issue!** Now fixed with try-catch wrappers.

**Diagnosis**:
```bash
# Check if table exists in database
docker exec cyberquiz-postgres-prod psql -U cyberquiz -d cyberquiz -c "\dt"
```

**If GenerationSlotHistory missing**:
- App will continue working (gracefully degraded)
- Logs will show: `[GenerationSpace] GenerationSlotHistory table not found, skipping...`
- Migration can be manually applied later without breaking the app

**Manual fix** (if needed):
```bash
docker exec cyberquiz-nextjs-prod npx prisma migrate deploy
```

### Issue 4: Admin user can't login

**Diagnosis**:
```bash
docker compose logs nextjs-app | grep -i admin
```

**Solutions**:
- Check admin was created: Look for `[Admin] Created admin user: admin@cyberquiz.fr`
- Reset admin password: 
  ```bash
  docker exec -it cyberquiz-nextjs-prod node -e "
  const { PrismaClient } = require('@prisma/client');
  const bcrypt = require('bcryptjs');
  const prisma = new PrismaClient();
  (async () => {
    const hash = await bcrypt.hash('YOUR_NEW_PASSWORD', 10);
    await prisma.adminUser.update({
      where: { email: 'admin@cyberquiz.fr' },
      data: { passwordHash: hash }
    });
    console.log('Password updated!');
    await prisma.\$disconnect();
  })();
  "
  ```

## 📊 Rollback Strategy

If deployment issues occur:

```bash
# 1. Stop new deployment
docker compose down

# 2. Restore previous image (if available)
docker pull cyberquiz-nextjs-app:previous
docker tag cyberquiz-nextjs-app:previous cyberquiz-nextjs-app:latest

# 3. Restart with old version
docker compose up -d

# 4. Database rollback (only if migrations caused issues)
# Prisma doesn't have auto-rollback, but migrations are additive
# so old code will still work with new schema
```

## 🎯 Success Criteria

Deployment is successful when:

- ✅ Verification script passes without errors (`./scripts/verify-deployment.sh`)
- ✅ All 5 Docker containers show (healthy) status (`docker compose ps`)
- ✅ Health endpoint returns `"status": "ok"` (`curl localhost:3100/api/health`)
- ✅ Migration logs show "✓ Migrations completed successfully"
- ✅ Schema verification logs show all critical tables exist
- ✅ Admin user logs show creation or "already exists"
- ✅ Ollama shows both models loaded (mistral:7b, nomic-embed-text)
- ✅ Admin login works with credentials
- ✅ Web interface loads at port 3100
- ✅ Question generation functionality works

**Automated checks** ensure all these conditions are met before the app serves traffic.

## 🛠️ New Tools & Features

### Pre-Deployment Verification Script

**Location**: `./scripts/verify-deployment.sh`

**What it checks**:
- Environment file exists and is properly configured
- JWT_SECRET is secure (32+ characters)
- Database URLs use Docker service names (not localhost)
- All migrations are present in prisma/migrations/
- Docker configuration files exist (Dockerfile, docker-compose.yml)
- Startup script contains migration commands
- (Optional) Test Docker build to catch build-time errors

**Usage**:
```bash
# Run before every deployment
./scripts/verify-deployment.sh

# With Docker build test
./scripts/verify-deployment.sh
# Answer 'y' when prompted
```

**Exit codes**:
- `0` = All checks passed or only warnings (safe to deploy)
- `1` = Errors found (fix before deploying)

### Enhanced Startup Script

**Location**: `./scripts/docker-startup.sh`

**New features**:
- Database connection retry logic (30 attempts)
- Migration deployment with error handling
- Critical table verification
- Admin user auto-creation
- Generation settings initialization
- Colored status output (✓/✗ indicators)
- Detailed logging for troubleshooting

### Health Checks

**Added to**:
- Production: [docker-compose.yml](../docker-compose.yml)
- Development: [docker-compose.dev.yml](../docker-compose.dev.yml)

**Configuration**:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s  # Allows time for migrations
```

**Benefits**:
- Container marked unhealthy if health check fails
- Orchestrators (Kubernetes, etc.) can auto-restart unhealthy containers
- Load balancers won't route traffic to unhealthy instances
- `docker compose ps` clearly shows health status

## 📝 Post-Deployment Tasks

1. **Monitor logs for first 24 hours**:
   ```bash
   docker compose logs -f --tail=100
   ```

2. **Verify buffer maintenance**:
   ```bash
   curl http://localhost:3100/api/admin/buffer/status
   ```

3. **Test question generation**:
   - Log in as admin
   - Navigate to Admin panel
   - Trigger question generation
   - Verify questions appear with aiModel field populated

4. **Backup database**:
   ```bash
   docker exec cyberquiz-postgres-prod pg_dump -U cyberquiz cyberquiz > backup.sql
   ```

## 🔐 Security Reminders

- [ ] Change all default passwords in `.env`
- [ ] Use secure JWT_SECRET (48+ characters recommended)
- [ ] Restrict database ports (only internal Docker network)
- [ ] Enable HTTPS/SSL in reverse proxy (nginx/traefik)
- [ ] Set up regular database backups
- [ ] Monitor logs for suspicious activity
- [ ] Keep Docker images updated

## 📞 Support

If issues arise during deployment:
1. Check logs: `docker compose logs -f`
2. Verify environment: `docker exec cyberquiz-nextjs-prod env | grep DATABASE_URL`
3. Test connectivity: `docker exec cyberquiz-nextjs-prod curl http://postgres:5432`
4. Review this guide's troubleshooting section

---

**Last Updated**: January 22, 2026
**Deployment Version**: v1.0 (with aiModel tracking & metadata system)
