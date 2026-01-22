/**
 * Ensure GenerationSettings table has default values
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function ensureGenerationSettings(): Promise<void> {
  try {
    // Check if settings exist
    const settings = await prisma.generationSettings.findFirst();

    if (!settings) {
      console.log('  ℹ️  No generation settings found, creating defaults...');
      
      await prisma.generationSettings.create({
        data: {
          bufferSize: 10,
          autoRefillEnabled: true,
          maxConcurrentGeneration: 10,
          structuredSpaceEnabled: false,
        },
      });

      console.log('  ✓ Created default generation settings');
      console.log('    - Buffer size: 10');
      console.log('    - Auto-refill: enabled');
      console.log('    - Difficulty: medium');
    } else {
      console.log('  ✓ Generation settings already configured');
      console.log(`    - Buffer size: ${settings.bufferSize}`);
      console.log(`    - Auto-refill: ${settings.autoRefillEnabled ? 'enabled' : 'disabled'}`);
    }
  } catch (error) {
    console.error('  ❌ Failed to ensure generation settings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly (ESM style)
if (import.meta.url === `file://${process.argv[1]}`) {
  ensureGenerationSettings()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
