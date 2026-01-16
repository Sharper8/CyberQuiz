import { prisma } from '@/lib/db/prisma';
import { getAIProvider } from '@/lib/ai/provider-factory';
import { generateQuestionsWithProgress, generateQuestionForPool } from '@/lib/services/question-generator';

let isGenerating = false;
let isPaused = false;
let currentGeneration: {
  batchSize: number;
  progress: number;
  status: string;
} | null = null;

/**
 * Background service that maintains the question pool at target size
 * Runs independently of frontend requests
 */
export async function maintainQuestionPool(): Promise<{
  poolSizeBefore: number;
  poolSizeAfter: number;
  generated: number;
  skipped: boolean;
}> {
  // Skip if paused or already generating
  if (isPaused || isGenerating) {
    return {
      poolSizeBefore: 0,
      poolSizeAfter: 0,
      generated: 0,
      skipped: true,
    };
  }

  isGenerating = true;
  try {
    // Get settings
    const settings = await prisma.generationSettings.findFirst();
    if (!settings || !settings.autoGenerateEnabled) {
      return {
        poolSizeBefore: 0,
        poolSizeAfter: 0,
        generated: 0,
        skipped: true,
      };
    }

    // Check current pool size
    const poolSizeBefore = await prisma.question.count({
      where: { status: 'to_review' },
    });

    const needed = settings.targetPoolSize - poolSizeBefore;
    
    if (needed <= 0) {
      // Pool is full, no generation needed
      return {
        poolSizeBefore,
        poolSizeAfter: poolSizeBefore,
        generated: 0,
        skipped: false,
      };
    }

    // Generate needed questions one by one
    const qsToGenerate = needed;
    
    console.log(`[PoolMaintenance] Pool at ${poolSizeBefore}/${settings.targetPoolSize}, need to generate ${qsToGenerate}...`);

    // Create generation log entry
    const logEntry = await prisma.generationLog.create({
      data: {
        settingsId: settings.id,
        topic: settings.generationTopic,
        difficulty: settings.generationDifficulty,
        batchSize: qsToGenerate,
        generatedCount: 0,
        savedCount: 0,
        failedCount: 0,
        poolSizeBeforeGen: poolSizeBefore,
        poolSizeAfterGen: poolSizeBefore,
        durationMs: 0,
      },
    });

    const startTime = Date.now();
    let generatedCount = 0;

    try {
      // Get AI provider
      const provider = await getAIProvider('ollama');
      
      if (!(await provider.isAvailable())) {
        throw new Error('AI provider not available');
      }

      // Generate questions one by one
      currentGeneration = {
        batchSize: qsToGenerate,
        progress: 0,
        status: 'generating',
      };

      // Generate one question at a time, bypassing the cache limit
      for (let i = 0; i < qsToGenerate; i++) {
        // Check if paused during generation
        if (isPaused) {
          console.log('[PoolMaintenance] Generation paused, stopping current batch');
          break;
        }

        try {
          currentGeneration.progress = ((i + 1) / qsToGenerate) * 100;
          console.log(`[PoolMaintenance] Generating question ${i + 1}/${qsToGenerate}...`);

          await generateQuestionForPool(
            settings.generationTopic,
            provider,
            settings.generationDifficulty as 'easy' | 'medium' | 'hard'
          );

          generatedCount++;
        } catch (err) {
          console.error(`[PoolMaintenance] Failed to generate question ${i + 1}:`, err);
          // Continue with next question even if one fails
        }
      }

      // Check pool size after generation
      const poolSizeAfter = await prisma.question.count({
        where: { status: 'to_review' },
      });

      // Update log
      await prisma.generationLog.update({
        where: { id: logEntry.id },
        data: {
          generatedCount,
          savedCount: generatedCount,
          failedCount: 0,
          poolSizeAfterGen: poolSizeAfter,
          durationMs: Date.now() - startTime,
          completedAt: new Date(),
        },
      });

      console.log(`[PoolMaintenance] ✅ Generated ${generatedCount} questions. Pool: ${poolSizeBefore} → ${poolSizeAfter}`);

      return {
        poolSizeBefore,
        poolSizeAfter,
        generated: generatedCount,
        skipped: false,
      };

    } catch (error) {
      // Update log with error
      await prisma.generationLog.update({
        where: { id: logEntry.id },
        data: {
          error: error instanceof Error ? error.message : 'Unknown error',
          durationMs: Date.now() - startTime,
          completedAt: new Date(),
        },
      });

      console.error('[PoolMaintenance] Error:', error);
      throw error;
    }

  } finally {
    isGenerating = false;
    currentGeneration = null;
  }
}

/**
 * Get current generation status
 */
export function getGenerationStatus() {
  return {
    isGenerating,
    isPaused,
    currentGeneration,
  };
}

/**
 * Pause generation (admin control)
 */
export function pauseGeneration() {
  isPaused = true;
  console.log('[PoolMaintenance] Generation paused by admin');
  return { isGenerating, isPaused };
}

/**
 * Resume generation (admin control)
 */
export function resumeGeneration() {
  isPaused = false;
  console.log('[PoolMaintenance] Generation resumed by admin');
  return { isGenerating, isPaused };
}

/**
 * Start interval-based pool maintenance (call this on server startup)
 */
let maintenanceInterval: NodeJS.Timeout | null = null;

export function startPoolMaintenance(intervalMs: number = 60000) {
  if (maintenanceInterval) {
    return; // Already running
  }

  console.log('[PoolMaintenance] Starting background maintenance...');
  
  // Run immediately
  maintainQuestionPool().catch(console.error);
  
  // Then run on interval
  maintenanceInterval = setInterval(() => {
    maintainQuestionPool().catch(console.error);
  }, intervalMs);
}

export function stopPoolMaintenance() {
  if (maintenanceInterval) {
    clearInterval(maintenanceInterval);
    maintenanceInterval = null;
    console.log('[PoolMaintenance] Stopped background maintenance');
  }
}
