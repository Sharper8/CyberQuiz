/**
 * Buffer Maintenance Service - Industrial Grade
 * 
 * Maintains a continuous buffer of ready-to-review questions.
 * Automatically refills when questions are validated/rejected.
 * Never blocks the UI - all generation is asynchronous.
 */

import { prisma } from '../db/prisma';
import { selectGenerationSlot, getGenerationSpaceConfig, linkQuestionToSlot } from './generation-space';
import { getAIProvider } from '../ai/provider-factory';
import { buildGenerationPrompt } from '../ai/prompts/generation';
import { upsertEmbedding, searchSimilar } from '../db/qdrant';
import { generateQuestionHash } from '../utils/question-hash';
import { logger } from '../logging/logger';

interface BufferStatus {
  currentSize: number;
  targetSize: number;
  isGenerating: boolean;
  autoRefillEnabled: boolean;
  queuedJobs: number;
  missing: number;
  lastGeneration: {
    lastStartedAt?: string;
    lastFinishedAt?: string;
    lastError?: string;
    inFlight: boolean;
  };
}

// In-memory state for background generation
let isCurrentlyGenerating = false;
const generationQueue: Array<() => Promise<void>> = [];
const lastGenerationStatus: BufferStatus['lastGeneration'] = {
  inFlight: false,
};

const SEMANTIC_DUPLICATE_THRESHOLD = 0.90; // Higher than display threshold
const MAX_GENERATION_RETRIES = 3;
const RECENT_QUESTIONS_WINDOW_HOURS = 48; // Check against questions from last 48h

/**
 * Get current buffer status
 */
export async function getBufferStatus(): Promise<BufferStatus> {
  const settings = await getOrCreateSettings();
  const currentSize = await prisma.question.count({
    where: { status: 'to_review' },
  });
  const missing = Math.max(0, settings.bufferSize - currentSize);

  return {
    currentSize,
    targetSize: settings.bufferSize,
    isGenerating: isCurrentlyGenerating,
    autoRefillEnabled: settings.autoRefillEnabled,
    queuedJobs: generationQueue.length,
    missing,
    lastGeneration: { ...lastGenerationStatus },
  };
}

/**
 * Main entry point: Ensure buffer is at target size
 * Called by admin UI when questions are validated/rejected
 */
export async function ensureBufferFilled(): Promise<void> {
  const settings = await getOrCreateSettings();
  
  if (!settings.autoRefillEnabled) {
    logger.info('[Buffer] Auto-refill disabled, skipping');
    return;
  }

  const status = await getBufferStatus();
  const questionsNeeded = status.targetSize - status.currentSize;

  if (questionsNeeded <= 0) {
    logger.info('[Buffer] Buffer is full', { currentSize: status.currentSize, targetSize: status.targetSize });
    return;
  }

  logger.info('[Buffer] Refilling buffer', { questionsNeeded, currentSize: status.currentSize });

  // Queue generation jobs (non-blocking)
  for (let i = 0; i < questionsNeeded; i++) {
    queueGeneration();
  }

  // Start processing queue if not already running
  processQueue();
}

/**
 * Generate a single question (non-blocking)
 */
function queueGeneration(): void {
  generationQueue.push(async () => {
    try {
      await generateSingleQuestionWithRetry();
    } catch (error: any) {
      logger.error('[Buffer] Failed to generate question', { error: error.message });
      lastGenerationStatus.lastError = error?.message || 'Unknown error';
      throw error;
    }
  });
}

/**
 * Process the generation queue asynchronously
 */
async function processQueue(): Promise<void> {
  if (isCurrentlyGenerating || generationQueue.length === 0) {
    return;
  }

  isCurrentlyGenerating = true;
  lastGenerationStatus.inFlight = true;

  while (generationQueue.length > 0) {
    const job = generationQueue.shift();
    if (job) {
      lastGenerationStatus.lastStartedAt = new Date().toISOString();
      try {
        await job();
        lastGenerationStatus.lastFinishedAt = new Date().toISOString();
        lastGenerationStatus.lastError = undefined;
      } catch (error: any) {
        lastGenerationStatus.lastError = error?.message || 'Unknown error';
      }
    }
  }

  isCurrentlyGenerating = false;
  lastGenerationStatus.inFlight = false;
}

/**
 * Generate a single question with retry logic and duplicate detection
 */
async function generateSingleQuestionWithRetry(): Promise<void> {
  const settings = await getOrCreateSettings();
  const config = await getGenerationSpaceConfig();

  for (let attempt = 0; attempt < MAX_GENERATION_RETRIES; attempt++) {
    try {
      // Select generation slot
      const slot = await selectGenerationSlot();
      
      logger.info('[Buffer] Generating question', { slot, attempt: attempt + 1 });

      // Get AI provider
      const provider = await getAIProvider(settings.defaultModel || 'ollama');

      // Build prompt with slot constraints
      const prompt = buildGenerationPrompt({
        questionType: 'true-false',
        slot: config.enabled ? slot : undefined,
      });

      // Generate question
      const response = await provider.generateQuestion({
        topic: config.enabled ? slot.domain : 'Cybersecurity',
        difficulty: config.enabled ? mapDifficultyToLegacy(slot.difficulty) : 'medium',
        questionType: 'true-false',
        count: 1,
      });

      if (!response) {
        throw new Error('Empty response from AI provider');
      }

      // Response can be either a single question or an array
      const generated = Array.isArray(response) ? response[0] : response;
      if (!generated) {
        throw new Error('No question generated');
      }

      // Generate embedding for duplicate detection
      const embedding = await provider.generateEmbedding(generated.questionText);

      // Check for duplicates
      const isDuplicate = await checkForDuplicates(generated.questionText, embedding);
      
      if (isDuplicate) {
        logger.warn('[Buffer] Duplicate detected, retrying', { attempt: attempt + 1 });
        continue; // Retry with different slot
      }

      // Save question to database
      const question = await prisma.question.create({
        data: {
          questionText: generated.questionText,
          questionHash: generateQuestionHash(generated.questionText),
          options: JSON.stringify(generated.options || ['Vrai', 'Faux']),
          correctAnswer: generated.correctAnswer || 'Vrai',
          explanation: generated.explanation || '',
          difficulty: generated.estimatedDifficulty || 0.5,
          category: config.enabled ? slot.domain : 'Cybersecurity',
          questionType: 'true-false',
          status: 'to_review',
          aiProvider: settings.defaultModel || 'ollama',
          mitreTechniques: JSON.stringify(generated.mitreTechniques || []),
          tags: JSON.stringify(generated.tags || []),
        },
      });

      // Store embedding in Qdrant
      await upsertEmbedding(question.id, embedding, {
        question_id: question.id,
        question_text: question.questionText,
        category: question.category,
        difficulty: Number(question.difficulty),
        tags: Array.isArray(question.tags) ? question.tags : JSON.parse(question.tags as string || '[]'),
        created_at: question.createdAt.toISOString(),
      });

      // Link to generation slot if using structured space
      if (config.enabled) {
        await linkQuestionToSlot(question.id, slot);
      }

      logger.info('[Buffer] Question generated successfully', { questionId: question.id, slot });
      return; // Success - exit retry loop

    } catch (error: any) {
      logger.error('[Buffer] Generation attempt failed', { attempt: attempt + 1, error: error.message });
      
      if (attempt === MAX_GENERATION_RETRIES - 1) {
        throw error; // Final attempt failed
      }
    }
  }
}

/**
 * Check if a question is a duplicate using semantic similarity
 */
async function checkForDuplicates(questionText: string, embedding: number[]): Promise<boolean> {
  // Check hash-based duplicates
  const hash = generateQuestionHash(questionText);
  const existingByHash = await prisma.question.findFirst({
    where: { questionHash: hash },
  });

  if (existingByHash) {
    logger.warn('[Buffer] Exact duplicate found by hash');
    return true;
  }

  // Check semantic similarity against recent questions
  const similarQuestions = await searchSimilar(embedding, 5);
  
  for (const similar of similarQuestions) {
    if (similar.score > SEMANTIC_DUPLICATE_THRESHOLD) {
      logger.warn('[Buffer] Semantic duplicate found', { similarityScore: similar.score, questionId: similar.id });
      return true;
    }
  }

  return false;
}

/**
 * Generate question hash for exact duplicate detection
 */

/**
 * Map structured difficulty to legacy format
 */
function mapDifficultyToLegacy(difficulty: string): 'easy' | 'medium' | 'hard' {
  const mapping: Record<string, 'easy' | 'medium' | 'hard'> = {
    'Beginner': 'easy',
    'Intermediate': 'medium',
    'Advanced': 'hard',
    'Expert': 'hard',
  };
  return mapping[difficulty] || 'medium';
}

/**
 * Get or create default generation settings
 */
async function getOrCreateSettings() {
  let settings = await prisma.generationSettings.findFirst();
  
  if (!settings) {
    settings = await prisma.generationSettings.create({
      data: {
        bufferSize: 10,
        autoRefillEnabled: true,
        structuredSpaceEnabled: false,
      },
    });
  }

  return settings;
}

/**
 * Update buffer settings
 */
export async function updateBufferSettings(updates: {
  bufferSize?: number;
  autoRefillEnabled?: boolean;
}): Promise<void> {
  const settings = await getOrCreateSettings();
  
  await prisma.generationSettings.update({
    where: { id: settings.id },
    data: updates,
  });

  logger.info('[Buffer] Settings updated', updates);

  // If auto-refill was just enabled, check buffer
  if (updates.autoRefillEnabled) {
    await ensureBufferFilled();
  }
}

/**
 * Force immediate buffer fill (for admin manual trigger)
 */
export async function forceBufferFill(): Promise<void> {
  logger.info('[Buffer] Manual buffer fill triggered');
  await ensureBufferFilled();
}
