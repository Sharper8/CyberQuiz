/**
 * Ensure Admin User Script
 * Automatically creates the default admin user if it doesn't exist
 * Called on app startup
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function ensureAdminUser(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cyberquiz.fr';
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme';

  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log(`[EnsureAdmin] Admin user already exists: ${adminEmail}`);
      return;
    }

    // Create new admin user
    console.log(`[EnsureAdmin] Creating admin user: ${adminEmail}`);
    
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    await prisma.adminUser.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'admin',
      },
    });

    console.log(`[EnsureAdmin] ✅ Admin user created successfully: ${adminEmail}`);
  } catch (error) {
    console.error('[EnsureAdmin] ❌ Failed to ensure admin user:', error);
    // Don't throw - let the app continue even if admin creation fails
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly (ESM style)
if (import.meta.url === `file://${process.argv[1]}`) {
  ensureAdminUser()
    .then(() => {
      console.log('[EnsureAdmin] Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[EnsureAdmin] Fatal error:', error);
      process.exit(1);
    });
}
