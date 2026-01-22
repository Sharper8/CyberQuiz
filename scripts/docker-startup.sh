#!/bin/sh
# Startup script for production
# Ensures admin user exists before starting the app

echo "ðŸš€ [Startup] Initializing CyberQuiz..."

# Regenerate Prisma Client with runtime DATABASE_URL
echo "ðŸ”§ [Startup] Regenerating Prisma Client..."
npx prisma generate

# Run database migrations
echo "ðŸ“¦ [Startup] Running database migrations..."
npx prisma migrate deploy

# Ensure admin user exists
echo "ðŸ‘¤ [Startup] Ensuring admin user..."
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
      console.log('[Admin] User already exists:', adminEmail);
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

    console.log('[Admin] âœ… Created admin user:', adminEmail);
  } catch (error) {
    console.error('[Admin] âŒ Failed:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
}

ensureAdmin().catch(console.error);
"

echo "âœ… [Startup] Initialization complete!"
echo "ðŸš€ [Startup] Starting Next.js server..."

# Start the Next.js server
exec node server.js
