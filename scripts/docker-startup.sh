#!/bin/sh
# Startup script for production
# Ensures admin user exists before starting the app

echo "🚀 [Startup] Initializing CyberQuiz..."

# Run database migrations (use local binary to avoid npx permissions issue)
echo "📦 [Startup] Running database migrations..."
# Set a writable npm cache to avoid EACCES (defensive)
export NPM_CONFIG_CACHE=/tmp/.npm
mkdir -p "$NPM_CONFIG_CACHE"

# Try multiple Prisma CLI locations
if command -v prisma >/dev/null 2>&1; then
  echo "✓ [Startup] Using global Prisma CLI"
  prisma migrate deploy || echo "⚠️ [Startup] Migrations failed (continuing anyway)"
elif [ -x ./node_modules/.bin/prisma ]; then
  echo "✓ [Startup] Using local Prisma CLI"
  ./node_modules/.bin/prisma migrate deploy || echo "⚠️ [Startup] Migrations failed (continuing anyway)"
else
  echo "❌ [Startup] Prisma CLI not found - migrations skipped!"
  echo "   Database tables may not exist. Install Prisma CLI or run migrations manually."
fi

# Ensure admin user exists
echo "👤 [Startup] Ensuring admin user..."
# Load .env into environment for this shell (so Node inherits it)
if [ -f "./.env" ]; then
  set -a
  . ./.env
  set +a
fi
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function ensureAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cyberquiz.fr';
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme';

  try {
    const existing = await prisma.adminUser.findUnique({
      where: { email: adminEmail }
    });

    if (existing) {
      const matches = await bcrypt.compare(adminPassword, existing.passwordHash);
      if (!matches) {
        const newHash = await bcrypt.hash(adminPassword, 10);
        await prisma.adminUser.update({
          where: { id: existing.id },
          data: { passwordHash: newHash },
        });
        console.log('[Admin] 🔄 Updated admin password for:', adminEmail);
      } else {
        console.log('[Admin] User already exists:', adminEmail);
      }
      return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    await prisma.adminUser.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'admin'
      }
    });

    console.log('[Admin] ✅ Created admin user:', adminEmail);
  } catch (error) {
    console.error('[Admin] ❌ Failed:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
}

ensureAdmin().catch(err => console.error('[Admin] ❌ Unexpected:', err));
"

echo "✅ [Startup] Initialization complete!"
echo "🚀 [Startup] Starting Next.js server..."

# Start the Next.js server
exec node server.js
