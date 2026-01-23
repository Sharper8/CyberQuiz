#!/bin/bash
# Startup script for production
# Ensures migrations, admin user, and settings exist before starting the app

set -e  # Exit on any error

echo "[Startup] ========================================"
echo "[Startup] Initializing CyberQuiz Production..."
echo "[Startup] ========================================"

# Wait for database to be fully ready
echo "[Startup] Waiting for database connection..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
  if npx prisma db execute --stdin <<< "SELECT 1" &>/dev/null; then
    echo "[Startup] ✓ Database connection established"
    break
  fi
  attempt=$((attempt + 1))
  echo "[Startup]   Attempt $attempt/$max_attempts..."
  sleep 2
done

if [ $attempt -eq $max_attempts ]; then
  echo "[Startup] ✗ Failed to connect to database after $max_attempts attempts"
  exit 1
fi

# Regenerate Prisma Client with runtime DATABASE_URL
echo "[Startup] Regenerating Prisma Client..."
if npx prisma generate; then
  echo "[Startup] ✓ Prisma Client generated successfully"
else
  echo "[Startup] ✗ Failed to generate Prisma Client"
  exit 1
fi

# Run database migrations
echo "[Startup] Running database migrations..."
if npx prisma migrate deploy; then
  echo "[Startup] ✓ Migrations completed successfully"
else
  echo "[Startup] ✗ Migration deployment failed"
  exit 1
fi

# Verify critical tables exist
echo "[Startup] Verifying database schema..."
tables_to_check=("AdminUser" "GenerationSettings" "Question" "QuizSession" "Score")
for table in "${tables_to_check[@]}"; do
  if npx prisma db execute --stdin <<< "SELECT 1 FROM \"$table\" LIMIT 1" &>/dev/null; then
    echo "[Startup]   ✓ Table $table exists"
  else
    echo "[Startup]   ✗ Table $table missing - schema verification failed"
    exit 1
  fi
done
echo "[Startup] ✓ Database schema verified"

# Ensure admin user exists
echo "[Startup] Ensuring admin user..."
node << 'EOJS'
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

    console.log('[Admin] Created admin user:', adminEmail);
  } catch (error) {
    console.error('[Admin] Failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

ensureAdmin().catch(console.error);
EOJS

# Ensure generation settings exist
echo "[Startup] Ensuring generation settings..."
node << 'EOJS'
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function ensureSettings() {
  try {
    const settings = await prisma.generationSettings.findFirst();

    if (!settings) {
      console.log('  No generation settings found, creating defaults...');
      
      const domains = [
        'Network Security',
        'Application Security',
        'Cloud Security',
        'Identity & Access',
        'Threat Intelligence',
        'Incident Response',
        'Cryptography',
        'Compliance & Governance'
      ];

      const skillTypes = [
        'Detection',
        'Prevention',
        'Analysis',
        'Configuration',
        'Best Practices'
      ];

      const difficulties = [
        'Beginner',
        'Intermediate',
        'Advanced',
        'Expert'
      ];

      const granularities = [
        'Conceptual',
        'Procedural',
        'Technical',
        'Strategic'
      ];
      
      await prisma.generationSettings.create({
        data: {
          bufferSize: 50,
          autoRefillEnabled: true,
          structuredSpaceEnabled: false,
          enabledDomains: domains,
          enabledSkillTypes: skillTypes,
          enabledDifficulties: difficulties,
          enabledGranularities: granularities,
          defaultModel: 'ollama:mistral:7b',
          fallbackModel: 'ollama:mistral:7b',
          maxConcurrentGeneration: 10,
        },
      });

      console.log('  Created default generation settings');
    } else {
      console.log('  Generation settings already configured');
      console.log(`    - Buffer size: ${settings.bufferSize}`);
      console.log(`    - Auto-refill: ${settings.autoRefillEnabled ? 'enabled' : 'disabled'}`);
    }
  } catch (error) {
    console.error('  Failed to ensure generation settings:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

ensureSettings().catch(console.error);
EOJS

echo "[Startup] ========================================"
echo "[Startup] ✓ Initialization complete!"
echo "[Startup] ========================================"
echo "[Startup] Starting Next.js server..."
echo ""

# Start the Next.js server directly (no backgrounding)
# The /api/init endpoint will be called on first request
exec node server.js
