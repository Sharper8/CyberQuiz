/**
 * Application Startup Initialization
 * Runs all necessary setup tasks before the app starts
 */

import { config } from 'dotenv';
import { ensureAdminUser } from './ensure-admin.js';
import { checkAndWarmCache } from '../src/lib/services/question-cache-warmer.js';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Ensure required environment variables are set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://cyberquiz:changeme@localhost:5432/cyberquiz';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'my-super-secret-jwt-key-2024-with-more-entropy-for-security';
}
if (!process.env.ADMIN_EMAIL) {
  process.env.ADMIN_EMAIL = 'admin@cyberquiz.fr';
}
if (!process.env.ADMIN_PASSWORD) {
  process.env.ADMIN_PASSWORD = 'change-this-secure-password';
}

export async function initializeApp(): Promise<void> {
  console.log('🚀 [AppInit] Starting application initialization...\n');

  try {
    // Step 1: Ensure admin user exists
    console.log('👤 [AppInit] Step 1/2: Ensuring admin user...');
    await ensureAdminUser();
    console.log('');

    // Step 2: Warm question cache (non-blocking)
    console.log('🔥 [AppInit] Step 2/2: Warming question cache...');
    checkAndWarmCache(); // Don't await - runs in background
    console.log('✓ Cache warming started in background\n');

    console.log('✅ [AppInit] Application initialization complete!\n');
  } catch (error) {
    console.error('❌ [AppInit] Initialization failed:', error);
    console.error('⚠️  App will continue, but some features may not work correctly\n');
  }
}

// Run if called directly (ESM style)
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeApp()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal initialization error:', error);
      process.exit(1);
    });
}
