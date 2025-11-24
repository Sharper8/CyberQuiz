# CyberQuiz - On-Premise Deployment Guide

## Overview

This is a fully containerized, on-premise quiz application built with Next.js 15 and PostgreSQL. All Supabase dependencies have been removed in favor of a self-hosted solution.

## Architecture

- **Frontend**: Next.js 15 with App Router
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL 15 (containerized)
- **Authentication**: Custom JWT-based auth with bcrypt password hashing
- **Container Orchestration**: Docker Compose

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- bun or npm

## Quick Start

### 1. Environment Setup

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Update `.env.local` with your configuration (the defaults work for local development).

### 2. Start the Database

Start PostgreSQL container:

```bash
docker-compose up -d postgres
```

This will:
- Create a PostgreSQL 15 container
- Initialize the database with the schema from `database/init.sql`
- Create sample quiz questions
- Set up the admin user (email: `admin@cyberquiz.local`, password: `admin123`)

### 3. Install Dependencies

```bash
bun install
# or
npm install
```

### 4. Run the Development Server

```bash
bun run dev
# or
npm run dev
```

The app will be available at http://localhost:3000

### 5. (Optional) Access PgAdmin

PgAdmin is available at http://localhost:5050

- Email: `admin@admin.com`
- Password: `admin`

To connect to the database:
- Host: `postgres` (when using Docker network) or `localhost` (from host)
- Port: `5432`
- Database: `cyberquiz`
- Username: `cyberquiz`
- Password: `changeme`

## Production Deployment

### 1. Build the Next.js Container

```bash
docker-compose up -d
```

This will build and start all services:
- Next.js app (port 3000)
- PostgreSQL (port 5432)
- PgAdmin (port 5050)

### 2. Update Environment Variables

For production, update `.env.local`:

```env
DB_HOST=postgres  # Use container name when running in Docker
DB_PORT=5432
DB_NAME=cyberquiz
DB_USER=cyberquiz
DB_PASSWORD=<strong-password>
JWT_SECRET=<generate-random-secret>
NODE_ENV=production
```

### 3. Generate Secure JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Questions
- `GET /api/questions` - List all questions (optional `?validated=true` filter)
- `POST /api/questions` - Create new question (admin only)
- `DELETE /api/questions/[id]` - Delete question (admin only)
- `PATCH /api/questions/[id]` - Update question validation (admin only)

### Scores
- `GET /api/scores` - Get leaderboard (optional `?limit=10`)
- `POST /api/scores` - Save quiz score

### Chat
- `POST /api/chat` - AI chat explanation (mock implementation)

## Database Schema

### Tables

#### `questions`
- `id` (SERIAL PRIMARY KEY)
- `question_text` (TEXT)
- `correct_answer` (BOOLEAN)
- `difficulty` (TEXT)
- `category` (TEXT)
- `is_validated` (BOOLEAN)
- `created_at` (TIMESTAMP)

#### `scores`
- `id` (SERIAL PRIMARY KEY)
- `player_name` (TEXT)
- `score` (INTEGER)
- `total_questions` (INTEGER)
- `time_taken` (INTEGER)
- `created_at` (TIMESTAMP)

#### `user_roles`
- `id` (SERIAL PRIMARY KEY)
- `email` (TEXT UNIQUE)
- `password_hash` (TEXT)
- `role` (TEXT)
- `created_at` (TIMESTAMP)

## Admin Access

Default admin credentials (change in production):
- Email: `admin@cyberquiz.local`
- Password: `admin123`

Access the admin panel at: http://localhost:3000/admin-login

## Removed Dependencies

The following Supabase dependencies have been completely removed:

- `@supabase/supabase-js`
- All Supabase client code
- Supabase environment variables
- Cloud-hosted authentication
- Cloud-hosted database

## New Dependencies

- `pg` - PostgreSQL client
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token generation
- `cookie` - Cookie parsing

## Development Notes

### File Structure

- `app/` - Next.js App Router pages and API routes
- `src/components/` - React components
- `src/lib/` - Utilities (database, API client)
- `src/hooks/` - Custom React hooks
- `database/` - SQL initialization scripts
- `docker-compose.yml` - Container orchestration

### Excluded Files

Old Vite-based files have been moved to `src/vite-pages/` and excluded from TypeScript compilation.

## Troubleshooting

### Database Connection Issues

Check if PostgreSQL is running:
```bash
docker ps | grep postgres
```

View PostgreSQL logs:
```bash
docker logs cyberquiz-postgres
```

### Port Conflicts

If port 3000, 5432, or 5050 is already in use, update the ports in `docker-compose.yml`.

### Build Errors

Clean install dependencies:
```bash
rm -rf node_modules bun.lockb
bun install
```

## Security Considerations

1. **Change default credentials** in production
2. **Use strong JWT secret** (minimum 32 characters)
3. **Use HTTPS** in production
4. **Restrict database access** with firewall rules
5. **Regular backups** of PostgreSQL data
6. **Update dependencies** regularly

## License

See LICENSE file for details.
