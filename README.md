## CyberQuiz

On-premise, containerized quiz app built with Next.js 16 and PostgreSQL. All Supabase dependencies have been completely removed.

### Tech Stack
- Next.js 16 (App Router)
- PostgreSQL 15 (Docker)
- Tailwind CSS + shadcn/ui
- JWT-based auth (bcrypt/jsonwebtoken)

---

## Quick Start

Prerequisites: Node.js 18+, npm, Docker

```bash
# 1) Clone
git clone <REPO_URL>
cd Cyber_Quizz

# 2) Environment setup
cp .env.local.example .env.local

# 3) Start database (first time initializes schema + admin user)
docker-compose up -d postgres

# 4) Install dependencies
npm install

# 5) Run dev server
npm run dev
```

**Access:**
- App: http://localhost:3000
- Admin: http://localhost:3000/admin-login (admin@cyberquiz.local / admin123)
- PgAdmin: http://localhost:5050 (admin@admin.com / admin)

---

## Project Structure

```
Cyber_Quizz/
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
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utilities (db, API client, utils)
├── database/            # PostgreSQL schema + seeds
├── public/              # Static assets
├── docker-compose.yml   # Container orchestration
├── Dockerfile           # Next.js production image
├── DEPLOYMENT.md        # Full deployment guide
└── package.json         # Dependencies + scripts
```

**Config files in root** (required by tooling):
- `next.config.mjs` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS
- `postcss.config.js` - PostCSS (for Tailwind)
- `tsconfig.json` - TypeScript
- `eslint.config.js` - ESLint
- `components.json` - shadcn/ui

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
docker-compose up -d postgres          # Start database
docker-compose down -v                 # Stop + remove volumes
docker logs cyberquiz-postgres         # View logs
```

---

## Production Deployment

```bash
docker-compose up -d --build
```

Update `.env.local` for production:
```env
DB_HOST=postgres
DB_PORT=5432
DB_NAME=cyberquiz
DB_USER=cyberquiz
DB_PASSWORD=<strong-password>
JWT_SECRET=<generate-random-secret>
NODE_ENV=production
```

Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

See `DEPLOYMENT.md` for complete production setup.

---

## Security

- **Change default credentials** in production
- **Use strong JWT secret** (minimum 32 characters)
- **Enable HTTPS** in production
- **Restrict database access** with firewall rules
- **Regular backups** of PostgreSQL volumes

---

## License

MIT - See LICENSE file

---

## 📂 Project Organization

Wondering about the config files in root? See [`docs/CONFIG_FILES_EXPLAINED.md`](docs/CONFIG_FILES_EXPLAINED.md)

Want to restructure into a monorepo? See [`docs/REORGANIZATION_OPTIONS.md`](docs/REORGANIZATION_OPTIONS.md)

