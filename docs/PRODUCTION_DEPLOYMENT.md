# Production Deployment Guide

## 🚀 Pre-Deployment Checklist

### 1. Database Migrations ✅
**Status**: All migrations are compatible with production deployment

Current migrations in `prisma/migrations/`:
- `20260122204000_add_generation_difficulty` - Adds generation difficulty tracking
- `20260122212641_add_ai_model_field` - Adds AI model tracking (aiModel field)
- `20260122_update_generation_settings` - Updates generation settings schema

**Migration Strategy**: 
- Migrations will run automatically on container startup via `docker-startup.sh`
- No manual intervention required
- **Zero-downtime capable**: All migrations add new fields (no breaking changes)

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

### Step 1: Pre-Deployment Verification

```bash
# On your local machine, test the production build:
docker compose down
docker compose build nextjs-app
```

**Expected outcome**: Build completes successfully with no TypeScript errors.

### Step 2: Prepare Production Environment

```bash
# 1. Update .env with secure values
nano .env  # or your preferred editor

# 2. Verify environment configuration
grep -E "JWT_SECRET|DB_PASSWORD|ADMIN_PASSWORD" .env
# Ensure all values are changed from placeholders

# 3. Verify Docker service names are correct
grep -E "DATABASE_URL|OLLAMA_BASE_URL|QDRANT_URL" .env
# Should use: postgres:5432, ollama:11434, qdrant:6333
```

### Step 3: Deploy to Production Server

```bash
# On production server:

# 1. Pull latest code
git pull origin main

# 2. Stop existing services (if any)
docker compose down

# 3. Build fresh images
docker compose build

# 4. Start services
docker compose up -d

# 5. Monitor startup (wait ~30 seconds)
docker compose logs -f nextjs-app

# 6. Verify all services are healthy
docker compose ps
```

### Step 4: Post-Deployment Verification

```bash
# 1. Check health endpoint
curl http://localhost:3100/api/health | jq '.'

# Expected response:
# {
#   "status": "ok",
#   "services": {
#     "database": { "status": "ok" },
#     "aiProviders": { "status": "ok", "ollama": "available" }
#   }
# }

# 2. Verify migrations ran successfully
docker compose logs nextjs-app | grep -i migration

# 3. Check Ollama models are loaded
docker exec cyberquiz-ollama-prod ollama list
# Should show: mistral:7b and nomic-embed-text:latest

# 4. Test admin login
curl -X POST http://localhost:3100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cyberquiz.fr","password":"YOUR_ADMIN_PASSWORD"}'

# 5. Access web interface
# Open browser: http://YOUR_SERVER_IP:3100
```

## 🔍 Migration Safety Analysis

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

## 🚨 Potential Issues & Solutions

### Issue 1: Build fails with "Invalid environment configuration"
**Cause**: Missing or invalid environment variables during Docker build
**Solution**: Ensured build ARGs are passed in docker-compose.yml ✅

### Issue 2: App can't connect to database/Ollama in production
**Cause**: Using localhost URLs instead of Docker service names
**Solution**: Updated `.env` to use `postgres:5432` and `ollama:11434` ✅

### Issue 3: JWT_SECRET validation error
**Cause**: JWT_SECRET less than 32 characters
**Solution**: Generated proper 32+ char secret in `.env` ✅

### Issue 4: Migrations don't run on startup
**Cause**: Missing migration files in Docker image
**Solution**: Dockerfile copies prisma/ directory to runtime image ✅

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

- ✅ All 5 Docker containers are running (`docker compose ps`)
- ✅ Health endpoint returns `"status": "ok"`
- ✅ Database migrations completed without errors
- ✅ Ollama shows both models loaded (mistral:7b, nomic-embed-text)
- ✅ Admin login works with new credentials
- ✅ Web interface loads at port 3100
- ✅ Question generation functionality works

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
