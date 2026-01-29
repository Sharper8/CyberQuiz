# 🚀 Production Deployment Quick Reference

## Pre-Deployment (5 minutes)

```bash
# 1. Verify you're on the right branch
git branch --show-current  # Should be 'prod'

# 2. Run verification script
./scripts/verify-deployment.sh

# 3. Review what's being deployed
git log -5 --oneline
git diff origin/prod
```

## Deploy to Production (Automated)

```bash
# Option 1: Automated deployment with all checks
./scripts/prod-deploy.sh

# Option 2: Manual deployment
docker compose -f docker-compose.yml down
docker compose -f docker-compose.yml up -d --build
```

## Post-Deployment Verification (2 minutes)

```bash
# Run health check script
./scripts/prod-health-check.sh

# Expected output: "All health checks passed! 🎉"
```

## If Something Goes Wrong

```bash
# Quick rollback to previous version
./scripts/prod-rollback.sh

# Or manual rollback
docker compose -f docker-compose.yml down
git checkout HEAD~1
docker compose -f docker-compose.yml up -d --build
```

## Manual Checks

```bash
# 1. Container status
docker compose -f docker-compose.yml ps

# 2. Health endpoint
curl http://localhost:3100/api/health | jq '.'

# 3. View logs
docker compose -f docker-compose.yml logs -f nextjs-app

# 4. Test in browser
open http://localhost:3100
```

## Common Issues & Fixes

### Issue: Health check fails

**Check:**
```bash
docker compose -f docker-compose.yml logs nextjs-app | tail -50
```

**Fix:**
```bash
# Restart containers
docker compose -f docker-compose.yml restart

# Or rebuild
docker compose -f docker-compose.yml up -d --build --force-recreate
```

### Issue: Database connection failed

**Check:**
```bash
docker compose -f docker-compose.yml ps postgres
docker compose -f docker-compose.yml logs postgres
```

**Fix:**
```bash
# Check .env has correct DATABASE_URL
grep DATABASE_URL .env

# Should be: postgresql://cyberquiz:PASSWORD@postgres:5432/cyberquiz
# NOT localhost!
```

### Issue: Migrations didn't run

**Check:**
```bash
docker compose -f docker-compose.yml logs nextjs-app | grep -i migration
```

**Fix:**
```bash
# Run migrations manually
docker exec cyberquiz-nextjs-prod npx prisma migrate deploy
```

### Issue: Ollama models not loaded

**Check:**
```bash
docker exec cyberquiz-ollama-prod ollama list
```

**Fix:**
```bash
# Pull models manually
docker exec cyberquiz-ollama-prod ollama pull mistral:7b
docker exec cyberquiz-ollama-prod ollama pull nomic-embed-text
```

## Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| Application | http://localhost:3100 | - |
| Admin Panel | http://localhost:3100/admin-login | Check .env |
| Health Check | http://localhost:3100/api/health | - |
| PgAdmin | http://localhost:5050 | Check .env |
| PostgreSQL | localhost:5432 | Check .env |

## Monitoring Commands

```bash
# Watch container status
watch -n 2 'docker compose -f docker-compose.yml ps'

# Follow all logs
docker compose -f docker-compose.yml logs -f

# Follow specific service
docker compose -f docker-compose.yml logs -f nextjs-app

# Check resource usage
docker stats

# Check disk space
df -h
docker system df
```

## Emergency Procedures

### Complete System Reset

```bash
# ⚠️ WARNING: This deletes ALL data! ⚠️

# 1. Stop everything
docker compose -f docker-compose.yml down -v

# 2. Clean Docker
docker system prune -af --volumes

# 3. Redeploy
docker compose -f docker-compose.yml up -d --build
```

### Database-Only Reset

```bash
# 1. Backup first!
docker exec cyberquiz-postgres-prod pg_dump -U cyberquiz cyberquiz > backup.sql

# 2. Stop app
docker compose -f docker-compose.yml stop nextjs-app

# 3. Reset database
docker exec cyberquiz-postgres-prod psql -U cyberquiz -c "DROP DATABASE cyberquiz;"
docker exec cyberquiz-postgres-prod psql -U cyberquiz -c "CREATE DATABASE cyberquiz;"

# 4. Restart app (migrations will run)
docker compose -f docker-compose.yml start nextjs-app
```

## Success Criteria

✅ Deployment is successful when:

- [ ] All containers show "healthy" or "running" status
- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] Homepage loads at http://localhost:3100
- [ ] Admin can login
- [ ] Quiz functionality works
- [ ] No errors in last 5 minutes of logs
- [ ] Database has validated questions
- [ ] Ollama models are loaded

## Support

If issues persist:

1. Check full deployment docs: `docs/PRODUCTION_DEPLOYMENT.md`
2. Review logs: `docker compose -f docker-compose.yml logs`
3. Run health check: `./scripts/prod-health-check.sh`
4. Consider rollback: `./scripts/prod-rollback.sh`

---

**Remember:** Always verify in a test environment first! 🧪
