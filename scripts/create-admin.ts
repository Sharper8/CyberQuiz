import { prisma } from '../src/lib/db/prisma';
import bcrypt from 'bcryptjs';

/**
 * Script: create-admin.ts
 * Purpose: Creates or updates the root administrator account.
 * Usage: npx tsx scripts/create-admin.ts
 */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@cyberquiz.fr';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';
const BCRYPT_ROUNDS = 10;

if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  console.warn('⚠️  WARNING: ADMIN_EMAIL and ADMIN_PASSWORD should be set in environment variables');
}

async function main() {
  console.log(`[admin] Starting root admin provisioning for ${ADMIN_EMAIL}`);

  // Hash password
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

  // Upsert admin user
  const admin = await prisma.adminUser.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      passwordHash,
      lastLoginAt: null,
    },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      role: 'admin',
    },
  });

  // Upsert does create or update; createdAt always present. Simplicity in message.
  console.log('✅ Root admin provisioned (created or updated):');
  console.log(`   id: ${admin.id}`);
  console.log(`   email: ${admin.email}`);
  console.log('   password: (hashed and stored securely)');
  console.log('   role:', admin.role);

  console.log('\nYou can now authenticate using these credentials.');
  console.log('NOTE: For production, rotate this password immediately and store it in a secret manager.');
}

main()
  .catch((err) => {
    console.error('❌ Failed to create root admin:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
