# CyberQuiz - Deployment Guide

## Overview

CyberQuiz is a fully containerized, self-hosted cybersecurity quiz application built with Next.js 16, PostgreSQL, Ollama AI, and Qdrant vector search.

## Architecture

- **Frontend**: Next.js 16 with App Router
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL 15 (containerized)
- **AI/Generation**: Ollama LLM (local)
- **Vector Search**: Qdrant
- **Authentication**: JWT-based with bcrypt
- **Container Orchestration**: Docker Compose

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- bun or npm

## Quick Start

### 1. Environment Setup

Copy the example configuration and configure for your environment:

```bash
cp .env.example .env
```

Edit `.env` and set your values. All credentials and configuration come from this file:
- Database connection details
- Admin user credentials
- JWT secret
- AI provider settings
- Service URLs

See `.env.example` for all available options and defaults.

### 2. Start Services

For development:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

For production:

```bash
docker-compose up -d --build
```

This will start all services with settings from your `.env` file:
- PostgreSQL database
- Ollama AI provider
- Qdrant vector search
- PgAdmin web interface (if enabled)

### 3. Initialize Database

Run migrations and seed sample data:

```bash
npx prisma migrate deploy
npm run db:seed
```

### 4. Start Application

For development (with hot reload):

```bash
npm run dev
```

For production:

```bash
npm run start
```

The app will be available at the URL configured in `.env` (typically `http://localhost:3000` or `http://localhost:3333`)

## Configuration

All application settings are managed through the `.env` file. Key variables:

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@localhost:5432/cyberquiz` |
| `ADMIN_EMAIL` | Admin login email | Check your `.env` file |
| `ADMIN_PASSWORD` | Admin login password | Check your `.env` file |
| `JWT_SECRET` | Token signing key | Generate with `openssl rand -base64 32` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `OLLAMA_BASE_URL` | Ollama AI provider | `http://ollama:11434` (Docker) or `http://localhost:11434` (host) |
| `QDRANT_URL` | Vector database | `http://qdrant:6333` (Docker) or `http://localhost:6333` (host) |

Refer to `.env.example` for complete list of options and defaults.

## API Endpoints

All API endpoints are available at `/api/*`:

- `POST /api/auth/login` - Admin authentication
- `GET /api/questions` - Fetch quiz questions
- `GET /api/scores` - Leaderboard data
- `POST /api/chat` - AI explanations
- `POST /api/questions/generate` - Generate new questions (admin)

## Database

PostgreSQL is used for persistent data storage. The database is automatically initialized when containers start.

**Connection Details**: Check `DATABASE_URL` in your `.env` file

Tables:
- `question` - Quiz questions with metadata
- `score` - Quiz completion records
- `adminUser` - Admin user accounts with bcrypt-hashed passwords
- `quizSession` - User quiz sessions

## Access Points

**Check your `.env` file for actual credentials and URLs**, as they vary by deployment:

- **Quiz Application**: Configured via `NEXT_PUBLIC_API_URL` in `.env`
- **Admin Panel**: Located at `/admin-login` using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`
- **Database UI (PgAdmin)**: Configured in `.env` if enabled
- **API**: All endpoints require `JWT_SECRET` from `.env` for token signing

## Troubleshooting

### Service Won't Start

Check logs:
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs postgres
docker-compose logs ollama
```

### Database Connection Failed

Verify `DATABASE_URL` in `.env`:
```bash
cat .env | grep DATABASE_URL
```

Then test PostgreSQL:
```bash
docker-compose ps | grep postgres
```

### Ollama Not Ready

First-time model download takes 5-10 minutes:
```bash
docker-compose logs -f ollama
```

### Port Already in Use

Update port mappings in `docker-compose.yml` or `docker-compose.dev.yml`, or stop conflicting services

## Security Checklist

For production deployments:

- [ ] Review and customize all `.env` values
- [ ] Use strong admin password (20+ characters, mixed case, numbers, symbols)
- [ ] Generate random JWT secret: `openssl rand -base64 32`
- [ ] Use strong database password
- [ ] Enable HTTPS via reverse proxy (nginx, Caddy, etc.)
- [ ] Restrict admin panel access by IP/firewall
- [ ] Enable database backups to external storage
- [ ] Monitor application logs regularly
- [ ] Keep Docker images updated: `docker-compose pull && docker-compose up -d`
- [ ] Never commit `.env` to version control

## License

See LICENSE file for details.
