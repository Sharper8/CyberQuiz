# 🚀 CyberQuiz Deployment Quick Reference

## Pre-Deployment (Every Time)

```bash
# 1. Run verification
./scripts/verify-deployment.sh

# 2. If errors, fix them
# If warnings, review but can proceed

# 3. Update .env if needed
nano .env
```

## Deploy to Production

```bash
# One command deployment
docker compose down && docker compose up -d --build

# Monitor startup
docker compose logs -f nextjs-app
```

## Verify Deployment

```bash
# Check container health
docker compose ps

# Test health endpoint  
curl http://localhost:3100/api/health | jq '.'

# Test admin login
curl -X POST http://localhost:3100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cyberquiz.fr","password":"YOUR_PASSWORD"}'
```

## Common Issues

| Issue | Quick Fix |
|-------|-----------|
| Container won't start | `docker compose logs nextjs-app \| tail -50` |
| Migration failed | `docker compose restart nextjs-app` |
| Health check failing | `docker exec cyberquiz-nextjs-prod curl http://localhost:3000/api/health` |
| Can't connect to DB | Check DATABASE_URL uses `postgres:5432` not `localhost` |
| Admin login fails | Check logs: `docker compose logs nextjs-app \| grep Admin` |

## What's Automated ✅

- ✅ Database connection wait
- ✅ Prisma client generation
- ✅ Migration deployment
- ✅ Schema verification
- ✅ Admin user creation
- ✅ Generation settings init
- ✅ Health monitoring

## Rollback

```bash
# Stop current deployment
docker compose down

# Restore previous version
git checkout previous-version
docker compose up -d --build
```

## Support

Full docs: [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)
