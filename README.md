# 🚀 CyberQuiz - AI-Powered Cybersecurity Training

On-premise, containerized quiz application built with Next.js 16, PostgreSQL, Ollama AI, and Qdrant vector search. Fully self-hosted with no external dependencies.

## Quick Start (5 minutes)

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)

### One-Command Setup

```bash
# Development Environment
docker-compose -f docker-compose.dev.yml up -d

# Wait for Ollama models to download (5-10 min first time)
docker-compose -f docker-compose.dev.yml logs -f ollama

# Once Ollama is ready, setup database and start app
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

### Access Points
All URLs and credentials are configured in `.env.dev`:

| Service | Configured via | Notes |
|---------|----------------|-------|
| **Quiz App** | `NEXT_PUBLIC_API_URL` | Default: http://localhost:3333 |
| **Admin Panel** | `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Login at: `${NEXT_PUBLIC_API_URL}/admin-login` |
| **PgAdmin** | `PGADMIN_DEFAULT_EMAIL` / `PGADMIN_DEFAULT_PASSWORD` | Default: http://localhost:5050 |
| **API** | `JWT_SECRET` | Token signing key |

---

## Configuration Management

### ⚠️ Important: Environment Variables

**All application settings come from `.env` files:**
- `.env.dev` - Development environment (Docker Compose)  
- `.env.local` - Production environment
- `.env.local.example` - Template for production

**Never hardcode values** - they're always injected from `.env`.

---

## What Gets Set Up

### 🐘 PostgreSQL (Port 5432)
- **Connection**: `${DATABASE_URL}` from `.env.dev`
- **Host**: `${DB_HOST}` (default: `postgres`)
- **Database**: `${DB_NAME}` (default: `cyberquiz`)
- **User**: `${DB_USER}` (default: `cyberquiz`)
- Relational database with pre-seeded questions
- 20+ cybersecurity questions across 9 categories

### 🤖 Ollama AI (Port 11434)
- **API URL**: `${OLLAMA_API_URL}` from `.env.dev` (default: `http://ollama:11434`)
- **Generation Model**: `${GENERATION_MODEL}` (default: `llama3.1:8b`)
- **Embedding Model**: `${EMBEDDING_MODEL}` (default: `nomic-embed-text`)
- Models auto-downloaded on startup
- CPU-only (GPU optional for faster inference)

### 🔮 Qdrant Vector DB (Port 6333)
- **API URL**: `${QDRANT_URL}` from `.env.dev` (default: `http://qdrant:6333`)
- **API Key**: `${QDRANT_API_KEY}` from `.env.dev`
- Semantic search for duplicate detection
- 768-dimension embeddings

### 🛠️ PgAdmin Web UI (Port 5050)
- **Email**: `${PGADMIN_DEFAULT_EMAIL}` from `.env.dev`
- **Password**: `${PGADMIN_DEFAULT_PASSWORD}` from `.env.dev`
- PostgreSQL database administration interface

---

## Development vs Production

### Development Mode
```bash
docker-compose -f docker-compose.dev.yml up -d
npm run dev  # Next.js on port 3333
```

### Production Mode
```bash
docker-compose up -d --build
# App runs on port 3100 inside container (expose via reverse proxy)
```

---

## Common Commands

### Docker Management
```bash
# Start services
docker-compose -f docker-compose.dev.yml up -d

# Build/rebuild containers
docker-compose -f docker-compose.dev.yml build            # Build images
docker-compose -f docker-compose.dev.yml build --no-cache # Rebuild from scratch

# View logs
docker-compose logs -f ollama          # Watch Ollama model downloads
docker-compose logs -f app             # Watch app startup

# Stop services
docker-compose down                    # Stop containers (keeps volumes)
docker-compose down -v                 # Stop + DELETE VOLUMES (⚠️ removes all data!)

# Rebuild containers
docker-compose -f docker-compose.dev.yml up -d --build
```

**Note on `down -v`:** Using `-v` deletes all volumes including:
- PostgreSQL database and all questions
- Ollama models cache (will need to re-download)
- Qdrant vector store
- Use this only when you want a complete reset!

### Database
```bash
npx prisma migrate deploy              # Run migrations
npm run db:seed                        # Seed initial questions
npx prisma studio                      # Open database browser

# Access via PgAdmin
# http://localhost:5050 (admin@admin.com / admin)
```

### Development
```bash
npm install                            # Install dependencies
npm run dev                            # Start Next.js dev server (port 3333)
npm run build                          # Production build
npm run lint                           # Check code quality
```

### Admin Panel
```bash
# Login URL: http://localhost:3333/admin-login
# Configured in .env.dev:
# - Email: ADMIN_EMAIL
# - Password: ADMIN_PASSWORD
# Review questions, manage settings, monitor generation
```

---

## Project Structure

```
├── app/                          # Next.js App Router
│   ├── api/                     # REST API endpoints
│   ├── admin/                   # Admin dashboard
│   ├── quiz/                    # Quiz gameplay
│   └── score/                   # Results & leaderboard
├── src/
│   ├── components/              # React UI components
│   ├── lib/
│   │   ├── ai/                 # AI provider factory (Ollama, OpenAI)
│   │   ├── services/           # Business logic (generation, review, etc)
│   │   └── db/                 # Database utilities
│   └── hooks/                   # Custom React hooks
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Schema versions
├── database/
│   └── init.sql                 # Initial schema
├── scripts/
│   ├── init-ollama.sh          # Ollama setup script
│   └── docker-startup.sh        # Container entry point
├── docker-compose.yml           # Production services
├── docker-compose.dev.yml       # Development services
└── Dockerfile                   # Next.js container image
```

---

## Tech Stack

- **Frontend**: Next.js 16, React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Prisma ORM
- **Database**: PostgreSQL 15 (connection via `DATABASE_URL` from `.env.dev`)
- **Vector DB**: Qdrant (accessed via `QDRANT_URL` from `.env.dev`)
- **AI**: Ollama (accessed via `OLLAMA_API_URL` from `.env.dev`)
- **Auth**: JWT tokens (`JWT_SECRET` from `.env.dev`), bcrypt password hashing
- **Logging**: Winston structured logging

---

## Environment Configuration

### Development (.env.dev)
```env
# Database
DATABASE_URL=postgresql://cyberquiz:cyberquiz@postgres:5432/cyberquiz

# Ollama
OLLAMA_API_URL=http://ollama:11434
GENERATION_MODEL=llama3.1:8b
EMBEDDING_MODEL=nomic-embed-text

# Qdrant
QDRANT_URL=http://qdrant:6333
QDRANT_API_KEY=qdrant-api-key

# Admin
ADMIN_EMAIL=admin@cyberquiz.fr
ADMIN_PASSWORD=change-this-secure-password
JWT_SECRET=your-secret-key-here-min-32-chars

# App
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3333
```

### Production
1. Copy `.env.local.example` → `.env.local`
2. Update all secrets with secure values
3. Set `NODE_ENV=production`
4. Use strong database password
5. Generate random JWT secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Troubleshooting

### Models Not Downloading
```bash
# Check Ollama logs
docker-compose logs ollama

# Manually pull models if needed
docker exec cyberquiz-ollama ollama pull llama3.1:8b
docker exec cyberquiz-ollama ollama pull nomic-embed-text
```

### Database Connection Failed
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# View PostgreSQL logs
docker-compose logs postgres

# Ensure .env.local has correct DATABASE_URL
cat .env.local | grep DATABASE_URL
```

### "No AI Provider Available"
- Wait for Ollama models to finish downloading (check logs)
- Verify `OLLAMA_API_URL` in environment is correct
- Fall back to OpenAI if Ollama unavailable: set `OPENAI_API_KEY`

---

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Production setup with reverse proxy (nginx/Caddy)
- SSL/HTTPS configuration
- Backup and recovery procedures
- Scaling considerations

---

## Security

⚠️ **Production Checklist:**
- [ ] Change default admin password in `.env.local`
- [ ] Use strong JWT_SECRET (32+ characters, random)
- [ ] Use strong DATABASE_PASSWORD
- [ ] Enable HTTPS via reverse proxy
- [ ] Restrict API access with rate limiting
- [ ] Regular database backups to external storage
- [ ] Monitor logs for suspicious activity
- [ ] Keep Docker images updated

---

## License

MIT - See [LICENSE](LICENSE)

---

## Support & Documentation

- **API Documentation**: `/api/*` endpoints use OpenAPI/Swagger
- **Backend Details**: See [README_BACKEND.md](README_BACKEND.md)
- **Admin Features**: Check `docs/` directory
- **Deployment Guide**: See [DEPLOYMENT.md](DEPLOYMENT.md)
