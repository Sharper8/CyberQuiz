# 🚀 CyberQuiz - Quick Start Guide

## One-Command Setup

For development (no GPU required):

```bash
# 1. Start all services (Next.js, PostgreSQL, Qdrant, Ollama, PgAdmin)
# Use either the modern Docker CLI or the older docker-compose binary:
# Preferred (Docker CLI):
docker compose -f docker-compose.dev.yml up -d
# or (if you have the docker-compose binary):
docker-compose -f docker-compose.dev.yml up -d

# 2. Wait for Ollama to download models (this takes 5-10 minutes first time)
docker-compose -f docker-compose.dev.yml logs -f ollama

# 3. Install deps and start Next.js dev server
npm install
npm run dev
```

**That's it!** Open http://localhost:3333

---

## What Gets Set Up

### 🗄️ **PostgreSQL Database** (Port 5432)
- Pre-seeded with **20+ cybersecurity questions** across 9 categories:
  - Sécurité Réseau
  - Sécurité Web  
  - Cryptographie
  - Red Team / Blue Team
  - Réponse à Incident
  - Sécurité Cloud
  - MITRE ATT&CK
  - Mots de passe

### 🔮 **Qdrant Vector Database** (Port 6333)
- Configured for semantic search with 768-dimension embeddings
- Collection `cyberquiz_questions` auto-created

### 🤖 **Ollama AI** (Port 11434)
- **Models downloaded automatically**:
  - `llama3.1:8b` - Question generation
  - `nomic-embed-text` - Text embeddings
- CPU-only mode (GPU optional but faster)

### 🛠️ **PgAdmin** (Port 5050)
- Database management UI
- Login: set in `.env.dev` (`PGADMIN_DEFAULT_EMAIL` / `PGADMIN_DEFAULT_PASSWORD`)

---

## Access the Application

| Service | URL | Credentials |
|---------|-----|-------------|
| **Main App** | http://localhost:3333 | - |
| **Admin Panel** | http://localhost:3333/admin-login | from `.env.dev` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) |
| **PgAdmin** | http://localhost:5050 | admin@cyberquiz.fr / admin |
| **Qdrant Dashboard** | http://localhost:6333/dashboard | - |

---

## Using the Application

### 1. **Take a Quiz** (User Flow)
1. Go to http://localhost:3000
2. Click "Start Quiz" or select a category
3. Answer 10 True/False questions
4. Submit and view your score + explanations
5. See your ranking on the leaderboard

### 2. **Admin Panel** (Question Management)
1. Login at http://localhost:3000/admin-login
2. View all questions (pre-seeded + AI-generated)
3. Click **"Générer avec IA"** to generate 5 new questions
4. Validate/reject questions
5. Delete low-quality questions

### 3. **AI Question Generation**
Click the "Générer avec IA" button in admin panel:
- Generates 5 questions about "Cybersécurité"
- Uses Ollama (llama3.1:8b) locally
- Checks for duplicates using vector similarity
- Questions require admin validation before appearing in quizzes

---

## Troubleshooting

### "Ollama not running" error
```bash
# Check if Ollama container is running
docker compose -f docker-compose.dev.yml ps ollama

# View Ollama logs
docker compose -f docker-compose.dev.yml logs ollama

# Restart Ollama
docker compose -f docker-compose.dev.yml restart ollama
```

### "No questions available"
```bash
# Re-run seed script
npm run db:seed
```

### Reset everything
```bash
# Stop and remove all data
docker-compose -f docker-compose.dev.yml down -v

# Start fresh
docker-compose -f docker-compose.dev.yml up -d
npx prisma migrate deploy
npm run db:seed
```

### Check service health
```bash
# PostgreSQL
docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U cyberquiz

# Qdrant
curl http://localhost:6333/readyz

# Ollama
curl http://localhost:11434/api/tags
```

---

## Development Workflow

### Database Changes
```bash
# Create migration after schema change
npx prisma migrate dev --name your_migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (DEV ONLY)
npx prisma migrate reset
```

### Viewing Data
```bash
# Prisma Studio (visual DB browser)
npx prisma studio

# Or use PgAdmin at http://localhost:5050
```

### Logs
```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f ollama
```

---

## Environment Variables

Environment files

Create `.env.dev` for local development and `.env.prod` for production overrides.

`docker-compose.dev.yml` reads `.env.dev` (via `env_file`) and passes those values into containers. Keep all runtime configuration in `.env.dev` for development.

If you prefer to supply a different env file at runtime, use the `--env-file` flag shown below.

Create `.env.dev` for local overrides (example):

```env
DB_HOST=postgres
DB_PORT=5432
DB_NAME=cyberquiz
DB_USER=cyberquiz
DB_PASSWORD=changeme

# Ollama (auto-configured by docker-compose)
OLLAMA_BASE_URL="http://ollama:11434"
OLLAMA_GENERATION_MODEL="llama3.1:8b"
OLLAMA_EMBED_MODEL="nomic-embed-text"

# Qdrant (auto-configured by docker-compose)
QDRANT_URL="http://qdrant:6333"

# Optional: OpenAI Fallback
ALLOW_EXTERNAL_AI=false
OPENAI_API_KEY=your-key-here

# Admin
ADMIN_EMAIL=admin@cyberquiz.fr
ADMIN_PASSWORD=change-this-secure-password

# PgAdmin
PGADMIN_DEFAULT_EMAIL=admin@cyberquiz.fr
PGADMIN_DEFAULT_PASSWORD=change-this-secure-password

# Auth
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

Usage notes
- **Development (recommended):** put all dev values in `.env.dev` and run:

```bash
docker compose -f docker-compose.dev.yml up -d
```

- **Run with a specific env file (alternate):**

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d
```

- **Production:** create/populate `.env.prod` with production values and run your production compose (or pass `--env-file .env.prod`).


---

## Pre-Seeded Data Summary

✅ **1 Admin User**
- Email: admin@cyberquiz.fr
- Password: password123
- Full access to admin panel

✅ **20 Validated Questions**
- Difficulty range: 0.2 (easy) to 0.8 (hard)
- All categories represented
- High-quality curated content
- Ready for quizzes immediately

✅ **5 Sample Leaderboard Scores**
- Realistic usernames and scores
- Different topics represented
- For UI/UX testing

✅ **1 Sample Quiz Session**
- 10 questions
- Medium difficulty
- For testing quiz flow

---

## Architecture

```
┌─────────────────┐
│   Next.js App   │ ← You interact here
│   (Port 3000)   │
└────────┬────────┘
         │
         ├─────────────┬──────────────┬─────────────┐
         │             │              │             │
    ┌────▼─────┐  ┌───▼────┐    ┌───▼────┐   ┌───▼────┐
    │PostgreSQL│  │ Qdrant │    │ Ollama │   │PgAdmin │
    │ Port 5432│  │  6333  │    │ 11434  │   │  5050  │
    └──────────┘  └────────┘    └────────┘   └────────┘
    Questions     Embeddings    AI Models    DB Mgmt
```

---

## Production Deployment

For production with GPU acceleration:

```bash
docker-compose up -d
```

The main `docker-compose.yml` includes GPU support for Ollama.

---

## Support

For issues, check:
1. Docker containers are running: `docker-compose -f docker-compose.dev.yml ps`
2. Logs for errors: `docker-compose -f docker-compose.dev.yml logs`
3. Environment variables are set correctly
4. Port conflicts (3000, 5432, 6333, 11434, 5050)

**Common fixes**: Restart containers, re-run migrations, check Ollama model download progress.
