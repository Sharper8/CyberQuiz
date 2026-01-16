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
          targetPoolSize: 50,
          autoGenerateEnabled: true,
          generationTopic: 'Cybersecurity',
          generationDifficulty: 'medium',
          maxConcurrentGeneration: 10,
        },
      });

      console.log('  ✓ Created default generation settings');
      console.log('    - Target pool size: 50');
      console.log('    - Auto-generate: enabled');
      console.log('    - Topic: Cybersecurity');
      console.log('    - Difficulty: medium');
    } else {
      console.log('  ✓ Generation settings already configured');
      console.log(`    - Target pool size: ${settings.targetPoolSize}`);
      console.log(`    - Auto-generate: ${settings.autoGenerateEnabled ? 'enabled' : 'disabled'}`);
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
