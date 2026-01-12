## CyberQuiz

On-premise, containerized quiz app built with Next.js 16, PostgreSQL, Qdrant and Ollama. Supabase has been fully removed.

### Tech Stack
- Next.js 16 (App Router)
- PostgreSQL 15 (Docker)
- Qdrant (embeddings)
- Ollama (local LLM)
- Tailwind CSS + shadcn/ui
- JWT-based auth (bcrypt/jsonwebtoken)

---

## Quick Start (Dev)

Prerequisites: Node.js 18+, npm, Docker

```bash
# 1) Clone
git clone <REPO_URL>
cd CyberQuiz

# 2) Environment setup
cp .env.dev.example .env.dev

# 3) Start all services
docker compose -f docker-compose.dev.yml up -d

# 4) Install deps and run dev server
npm install
npm run dev
```

**Access:**
- App: http://localhost:3333
- Admin: http://localhost:3333/admin-login (credentials from `.env.dev` → `ADMIN_EMAIL` / `ADMIN_PASSWORD`)
- PgAdmin: http://localhost:5050 (set in `.env.dev` → `PGADMIN_DEFAULT_EMAIL` / `PGADMIN_DEFAULT_PASSWORD`)

---

## Project Structure

```
CyberQuiz/
├── app/                    # Next.js App Router (pages + API routes)
│   ├── api/               # REST endpoints (auth, questions, scores, chat)
│   ├── admin/            # Admin panel page
│   ├── admin-login/      # Admin login page
│   ├── quiz/             # Quiz page
│   ├── score/            # Score/results page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── src/
│   ├── components/       # UI components
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Utilities (db, API client, utils)
├── prisma/               # Prisma schema + migrations + seed
├── public/               # Static assets
├── docker-compose.dev.yml# Dev containers (Next.js, Postgres, Qdrant, Ollama, PgAdmin)
├── Dockerfile            # Next.js production image
├── docs/                 # Additional documentation
├── scripts/              # Startup and helper scripts
└── package.json          # Dependencies + scripts
```

Config files in root (required by tooling):
- `next.config.mjs`  · `tailwind.config.ts` · `postcss.config.js` · `tsconfig.json`
- `eslint.config.js` · `components.json`

---

## Common Tasks

**Development:**
```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Lint code
```

**Database:**
```bash
docker compose -f docker-compose.dev.yml up -d postgres  # Start DB
docker compose -f docker-compose.dev.yml down -v         # Stop + remove volumes
docker logs cyberquiz-postgres                           # View logs
```

---

## Deployment

For production, use your CI to build the image with the provided [Dockerfile](Dockerfile) and run your compose. Update environment accordingly (prefer a `.env.prod`).

Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete setup.

---

## Security

- Change default credentials in production
- Use strong JWT secret (32+ chars)
- Enable HTTPS in production
- Restrict database access with firewall rules
- Regular backups of PostgreSQL volumes

---

## 📂 More Docs

- Config overview: [docs/CONFIG_FILES_EXPLAINED.md](docs/CONFIG_FILES_EXPLAINED.md)
- Quickstart (detailed): [QUICKSTART.md](QUICKSTART.md)

