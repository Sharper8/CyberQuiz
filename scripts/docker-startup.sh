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

# Ensure generation settings exist
echo "⚙️  [Startup] Ensuring generation settings..."
node -e "
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function ensureSettings() {
  try {
    const settings = await prisma.generationSettings.findFirst();

    if (!settings) {
      console.log('  ℹ️  No generation settings found, creating defaults...');
      
      await prisma.generationSettings.create({
        data: {
          bufferSize: 50,
          autoRefillEnabled: true,
          structuredSpaceEnabled: false,
          enabledDomains: [
            'Network Security',
            'Application Security',
            'Cloud Security',
            'Identity & Access',
            'Threat Intelligence',
            'Incident Response',
            'Cryptography',
            'Compliance & Governance'
          ],
          enabledSkillTypes: [
            'Detection',
            'Prevention',
            'Analysis',
            'Configuration',
            'Best Practices'
          ],
          enabledDifficulties: [
            'Beginner',
            'Intermediate',
            'Advanced',
            'Expert'
          ],
          enabledGranularities: [
            'Conceptual',
            'Procedural',
            'Technical',
            'Strategic'
          ],
          defaultModel: 'ollama:mistral:7b',
          fallbackModel: 'ollama:mistral:7b',
          maxConcurrentGeneration: 10,
        },
      });

      console.log('  ✓ Created default generation settings');
    } else {
      console.log('  ✓ Generation settings already configured');
      console.log(`    - Buffer size: ${settings.bufferSize}`);
      console.log(`    - Auto-refill: ${settings.autoRefillEnabled ? 'enabled' : 'disabled'}`);
    }
  } catch (error) {
    console.error('  ❌ Failed to ensure generation settings:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
}

ensureSettings().catch(console.error);
"

echo "✅ [Startup] Initialization complete!"
echo "🚀 [Startup] Starting Next.js server..."

# Start the Next.js server in the background to allow initialization
node server.js &
SERVER_PID=$!

# Wait for server to be ready
echo "⏳ [Startup] Waiting for server to be ready..."
sleep 5

# Initialize background services via API
echo "🔄 [Startup] Starting background services..."
curl -X POST http://localhost:3000/api/init || echo "  ⚠️  Background service initialization failed (will retry on next request)"

# Bring server process to foreground
wait $SERVER_PID
