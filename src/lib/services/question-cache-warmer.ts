/**
 * Question Cache Warmer
 * Pre-generates questions on app startup to ensure instant responses
 */

import { prisma } from '../db/prisma';
import { getAIProvider } from '../ai/provider-factory';
import { generateQuestionsForCache } from './question-generator';

const DEFAULT_TOPICS = [
  'Cybersécurité',
  'Sécurité Réseau',
  'Sécurité Web',
  'Cryptographie',
];

let isWarming = false;
let lastWarmTime = 0;
const WARM_COOLDOWN = 5 * 60 * 1000; // 5 minutes

/**
 * Warm up the question cache by pre-generating questions
 * Called on app startup and can be triggered manually
 */
export async function warmQuestionCache(): Promise<void> {
  // Prevent concurrent warming
  if (isWarming) {
    console.log('[CacheWarmer] Already warming cache, skipping...');
    return;
  }

  // Cooldown to prevent too frequent warming
  const now = Date.now();
  if (now - lastWarmTime < WARM_COOLDOWN) {
    console.log('[CacheWarmer] Cooldown active, skipping...');
    return;
  }

  isWarming = true;
  lastWarmTime = now;

  try {
    console.log('[CacheWarmer] Starting cache warm-up...');

    // Check if AI provider is available
    const provider = await getAIProvider('ollama');
    if (!provider || !(await provider.isAvailable())) {
      console.warn('[CacheWarmer] AI provider not available, skipping warm-up');
      return;
    }

    // Pre-generate for default topics
    for (const topic of DEFAULT_TOPICS) {
      try {
        const cacheSize = await generateQuestionsForCache(topic, provider, 'medium');
        console.log(`[CacheWarmer] Cache for "${topic}": ${cacheSize} questions ready`);
      } catch (error) {
        console.error(`[CacheWarmer] Failed to warm cache for "${topic}":`, error);
        // Continue with other topics
      }
    }

    console.log('[CacheWarmer] Cache warm-up completed');
  } catch (error) {
    console.error('[CacheWarmer] Cache warm-up failed:', error);
  } finally {
    isWarming = false;
  }
}

/**
 * Check if cache needs warming and do it in the background
 */
export async function checkAndWarmCache(): Promise<void> {
  // Run in background, don't block
  warmQuestionCache().catch(err => {
    console.error('[CacheWarmer] Background warm failed:', err);
  });
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  total: number;
  byTopic: { topic: string; count: number }[];
}> {
  const stats = await prisma.question.groupBy({
    by: ['category'],
    where: {
      status: 'to_review',
      isRejected: false,
    },
    _count: true,
  });

  const total = stats.reduce((sum, s) => sum + s._count, 0);
  const byTopic = stats.map(s => ({
    topic: s.category,
    count: s._count,
  }));

  return { total, byTopic };
}
