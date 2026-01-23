import { prisma } from '../db/prisma';
import { qdrant, upsertEmbedding, searchSimilar } from '../db/qdrant';
import { AIProvider } from '../ai/providers/base';
import { GeneratedQuestionSchema } from '../validators/question';
import { buildGenerationPrompt } from '../ai/prompts/generation';
import { Decimal } from '@prisma/client/runtime/library';
import { generateQuestionHash } from '../utils/question-hash';

interface GenerationContext {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  attemptCount: number;
  provider: AIProvider;
}

const DUPLICATE_SIMILARITY_THRESHOLD = 0.95;
const SEMANTIC_SIMILARITY_THRESHOLD = 0.75; // Show admin similar questions
const MAX_GENERATION_RETRIES = 3;
const CACHE_TARGET = 5; // Keep 5 questions in to_review cache per category

/**
 * Log duplicate detection for analytics
 */
async function logDuplicate(
  questionHash: string,
  attemptedText: string,
  detectionMethod: 'hash' | 'embedding' | 'both',
  topic: string,
  originalQuestionId?: number,
  similarityScore?: number
): Promise<void> {
  try {
    await prisma.duplicateLog.create({
      data: {
        questionHash,
        originalQuestionId,
        attemptedText,
        detectionMethod,
        similarityScore: similarityScore ? new Decimal(similarityScore) : null,
        topic,
      },
    });
  } catch (error) {
    console.error('[DuplicateLog] Failed to log duplicate:', error);
    // Don't throw - logging failure shouldn't break generation
  }
}

/**
 * Find similar questions for admin review (semantic similarity)
 * Returns questions with similarity > threshold
 */
export async function findSimilarQuestions(embedding: number[]): Promise<Array<{id: number, similarity: number}>> {
  const results = await searchSimilar(embedding, 10);
  
  // Filter out exact duplicates (above 0.95) and only show semantic similarities (0.75-0.95)
  return results
    .filter(r => r.score > SEMANTIC_SIMILARITY_THRESHOLD && r.score <= DUPLICATE_SIMILARITY_THRESHOLD)
    .map(r => ({ id: r.id, similarity: Number(r.score.toFixed(2)) }));
}

/**
 * Generate a single question with duplicate detection and regeneration on duplicate
 * On duplicate, retry with increased temperature and more context
 */
async function generateSingleQuestion(context: GenerationContext): Promise<{ question: any; embedding: number[]; questionHash: string }> {
  const { topic, difficulty, attemptCount, provider } = context;

  // Build prompt with more context on retries
  let prompt = buildGenerationPrompt({
    topic,
    difficulty,
    questionType: 'true-false',
  });

  // Inject temperature adjustment hint on retries
  if (attemptCount > 0) {
    prompt += `\n\nAttempt ${attemptCount + 1}/${MAX_GENERATION_RETRIES}. Generate a DIFFERENT question than previous attempts. Be creative and vary the focus.`;
  }

  const generated = await provider.generateQuestion({
    topic,
    difficulty,
    questionType: 'true-false',
    count: 1,
    additionalContext: attemptCount > 0 ? `Variation ${attemptCount + 1}` : undefined,
  });

  // Extract first question if array
  const question = Array.isArray(generated) ? generated[0] : generated;

  // Generate hash for exact duplicate detection
  const questionHash = generateQuestionHash(question.questionText);

  // Check for exact hash match (fastest check)
  const existingByHash = await prisma.question.findFirst({
    where: { 
      questionHash,
      isRejected: false, // Don't count rejected questions
    },
    select: { id: true },
  });

  if (existingByHash) {
    // Log hash-based duplicate
    await logDuplicate(
      questionHash,
      question.questionText,
      'hash',
      topic,
      existingByHash.id
    );

    if (attemptCount < MAX_GENERATION_RETRIES) {
      console.info(
        `[QuestionGenerator] Exact duplicate detected via hash (ID: ${existingByHash.id}), retrying with more context (attempt ${attemptCount + 1})`
      );
      return generateSingleQuestion({
        ...context,
        attemptCount: attemptCount + 1,
      });
    } else {
      throw new Error(`Failed to generate unique question after ${MAX_GENERATION_RETRIES} attempts (exact hash duplicates detected)`);
    }
  }

  // Generate embedding
  const embedding = await provider.generateEmbedding(question.questionText);

  // Check for semantic duplicates (slower, more nuanced)
  const similar = await searchSimilar(embedding, 1);
  if (similar.length > 0 && similar[0].score > DUPLICATE_SIMILARITY_THRESHOLD) {
    // Log embedding-based duplicate
    await logDuplicate(
      questionHash,
      question.questionText,
      'embedding',
      topic,
      similar[0].id,
      similar[0].score
    );

    if (attemptCount < MAX_GENERATION_RETRIES) {
      console.info(
        `[QuestionGenerator] Semantic duplicate detected (similarity: ${similar[0].score}), retrying with more context (attempt ${attemptCount + 1})`
      );
      // Recursive retry with incremented attempt count
      return generateSingleQuestion({
        ...context,
        attemptCount: attemptCount + 1,
      });
    } else {
      throw new Error(`Failed to generate unique question after ${MAX_GENERATION_RETRIES} attempts (semantic duplicates detected)`);
    }
  }

  return { question, embedding, questionHash };
}

/**
 * Generate questions for a topic and cache them in "to_review" state
 * Continues until 5 questions are cached and ready for admin review
 */
export async function generateQuestionsForCache(
  topic: string,
  provider: AIProvider,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<number> {
  // Check current cache size for this topic
  const cacheCount = await prisma.question.count({
    where: {
      category: topic,
      status: 'to_review',
      isRejected: false,
    },
  });

  if (cacheCount >= CACHE_TARGET) {
    console.info(`[QuestionGenerator] Cache for "${topic}" already has ${cacheCount} questions`);
    return cacheCount;
  }

  const targetCount = CACHE_TARGET - cacheCount;
  const generated: any[] = [];

  for (let i = 0; i < targetCount; i++) {
    try {
      const { question, embedding } = await generateSingleQuestion({
        topic,
        difficulty,
        attemptCount: 0,
        provider,
      });

      // Validate question quality
      const validation = await provider.validateQuestion(question);

      // Ensure validation scores are numbers with safe defaults
      const qualityScore = typeof validation.qualityScore === 'number' ? validation.qualityScore : 0.7;
      const validationScore = typeof validation.qualityScore === 'number' ? validation.qualityScore : 0.7;

      // Find similar questions in the database (calculate similarity for ALL states)
      const potentialDuplicates = await findSimilarQuestions(embedding);
      // Normalize answer values: convert True/False to Vrai/Faux
      const normalizeAnswer = (value: string | boolean): string => {
        const str = String(value).trim();
        if (str.toLowerCase() === 'true') return 'Vrai';
        if (str.toLowerCase() === 'false') return 'Faux';
        return str;
      };

      const normalizeOptions = (options: any[]): string[] => {
        if (!Array.isArray(options)) return ['Vrai', 'Faux'];
        return options.map(opt => normalizeAnswer(opt)).slice(0, 2);
      };

      // Store in database with to_review status
      const normalizedOptions = normalizeOptions(question.options);
      const normalizedAnswer = normalizeAnswer(question.correctAnswer);

      const stored = await prisma.question.create({
        data: {
          questionText: question.questionText,
          options: normalizedOptions,
          correctAnswer: normalizedAnswer,
          explanation: question.explanation,
          difficulty: new Decimal(question.estimatedDifficulty || 0.5),
          qualityScore: new Decimal(qualityScore),
          category: topic,
          questionType: 'true-false',
          status: 'to_review',
          aiProvider: provider.name,
          aiModel: provider.model,
          mitreTechniques: question.mitreTechniques || [],
          tags: question.tags || [],
          potentialDuplicates: potentialDuplicates.length > 0 ? potentialDuplicates : null,
          metadata: {
            create: {
              embeddingId: `q_${Date.now()}_${i}`, // Placeholder; will be set by Qdrant
              validationScore: new Decimal(validationScore),
              validatorModel: provider.name,
            },
          },
        },
      });

      if (potentialDuplicates.length > 0) {
        console.info(`[QuestionGenerator] Found ${potentialDuplicates.length} similar questions for admin review`);
      }

      // Upsert embedding
      await upsertEmbedding(stored.id, embedding, {
        question_id: stored.id,
        question_text: question.questionText,
        category: topic,
        difficulty: question.estimatedDifficulty,
        tags: question.tags || [],
        created_at: new Date().toISOString(),
      });

      generated.push(stored.id);
      console.info(`[QuestionGenerator] Generated question ${i + 1}/${targetCount} for "${topic}"`);
    } catch (error) {
      console.error(`[QuestionGenerator] Failed to generate question ${i + 1}:`, error);
      // Continue with next question; some failures are acceptable
    }
  }

  console.info(`[QuestionGenerator] Generated ${generated.length} questions for "${topic}" cache`);
  return cacheCount + generated.length;

}

/**
 * Generate questions with real-time progress callbacks
 * Used for streaming progress updates to the UI
 */
export async function generateQuestionsWithProgress(
  topic: string,
  provider: AIProvider,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  onProgress?: (data: { step: string; message: string; current?: number; total?: number }) => void
): Promise<number> {
  // Check current cache size for this topic
  onProgress?.({ 
    step: 'cache_check', 
    message: `Vérification du cache pour "${topic}"...` 
  });

  const cacheCount = await prisma.question.count({
    where: {
      category: topic,
      status: 'to_review',
      isRejected: false,
    },
  });

  if (cacheCount >= CACHE_TARGET) {
    onProgress?.({ 
      step: 'cache_full', 
      message: `Cache déjà rempli (${cacheCount} questions)` 
    });
    return cacheCount;
  }

  const targetCount = CACHE_TARGET - cacheCount;
  onProgress?.({ 
    step: 'generation_start', 
    message: `Génération de ${targetCount} questions...`,
    current: 0,
    total: targetCount
  });

  const generated: any[] = [];

  for (let i = 0; i < targetCount; i++) {
    try {
      onProgress?.({ 
        step: 'generating', 
        message: `Génération de la question ${i + 1}/${targetCount}...`,
        current: i,
        total: targetCount
      });

      const { question, embedding, questionHash } = await generateSingleQuestion({
        topic,
        difficulty,
        attemptCount: 0,
        provider,
      });

      onProgress?.({ 
        step: 'validating', 
        message: `Validation de la qualité (${i + 1}/${targetCount})...`,
        current: i,
        total: targetCount
      });

      // Validate question quality
      const validation = await provider.validateQuestion(question);

      // Ensure validation scores are numbers with safe defaults
      const qualityScore = typeof validation.qualityScore === 'number' ? validation.qualityScore : 0.7;
      const validationScore = typeof validation.qualityScore === 'number' ? validation.qualityScore : 0.7;

      // Find similar questions in the database (calculate similarity for ALL states)
      const potentialDuplicates = await findSimilarQuestions(embedding);

      onProgress?.({ 
        step: 'storing', 
        message: `Enregistrement de la question ${i + 1}/${targetCount}...`,
        current: i,
        total: targetCount
      });

      // Normalize answer values: convert True/False to Vrai/Faux
      const normalizeAnswer = (value: string | boolean): string => {
        const str = String(value).trim();
        if (str.toLowerCase() === 'true') return 'Vrai';
        if (str.toLowerCase() === 'false') return 'Faux';
        return str;
      };

      const normalizeOptions = (options: any[]): string[] => {
        if (!Array.isArray(options)) return ['Vrai', 'Faux'];
        return options.map(opt => normalizeAnswer(opt)).slice(0, 2);
      };

      const normalizedOptions = normalizeOptions(question.options);
      const normalizedAnswer = normalizeAnswer(question.correctAnswer);

      // Store in database with to_review status
      const stored = await prisma.question.create({
        data: {
          questionText: question.questionText,
          questionHash, // Store hash for future duplicate detection
          options: normalizedOptions,
          correctAnswer: normalizedAnswer,
          explanation: question.explanation,
          difficulty: new Decimal(question.estimatedDifficulty),
          qualityScore: new Decimal(qualityScore),
          category: topic,
          questionType: 'true-false',
          status: 'to_review',
          aiProvider: provider.name,
          aiModel: provider.model,
          mitreTechniques: question.mitreTechniques || [],
          tags: question.tags || [],
          potentialDuplicates: potentialDuplicates.length > 0 ? potentialDuplicates : null,
          metadata: {
            create: {
              embeddingId: `q_${Date.now()}_${i}`,
              validationScore: new Decimal(validationScore),
              validatorModel: provider.name,
            },
          },
        },
      });

      if (potentialDuplicates.length > 0) {
        console.info(`[QuestionGenerator] Found ${potentialDuplicates.length} similar questions for admin review`);
      }

      // Upsert embedding
      await upsertEmbedding(stored.id, embedding, {
        question_id: stored.id,
        question_text: question.questionText,
        category: topic,
        difficulty: question.estimatedDifficulty,
        tags: question.tags || [],
        created_at: new Date().toISOString(),
      });

      generated.push(stored.id);
      
      onProgress?.({ 
        step: 'completed', 
        message: `Question ${i + 1}/${targetCount} générée avec succès`,
        current: i + 1,
        total: targetCount
      });
    } catch (error) {
      console.error(`[QuestionGenerator] Failed to generate question ${i + 1}:`, error);
      onProgress?.({ 
        step: 'error', 
        message: `Erreur lors de la génération ${i + 1}: ${error instanceof Error ? error.message : 'Unknown'}`,
        current: i,
        total: targetCount
      });
      // Continue with next question
    }
  }

  onProgress?.({ 
    step: 'done', 
    message: `✅ ${generated.length} questions générées et prêtes pour validation`,
    current: targetCount,
    total: targetCount
  });

  return cacheCount + generated.length;
}

/**
 * Generate questions to maintain target pool size based on settings
 * Logs generation activity to GenerationLog table
 */
export async function generateToMaintainPool(
  provider: AIProvider,
  topic?: string,
  difficulty?: 'easy' | 'medium' | 'hard'
): Promise<{ poolSize: number; generatedCount: number; failedCount: number; durationMs: number }> {
  const startTime = Date.now();

  try {
    // Get generation settings
    let settings = await prisma.generationSettings.findFirst();
    if (!settings) {
      settings = await prisma.generationSettings.create({
        data: {
          bufferSize: 50,
          autoRefillEnabled: true,
          maxConcurrentGeneration: 5,
        },
      });
    }

    if (!settings.autoRefillEnabled) {
      return { poolSize: 0, generatedCount: 0, failedCount: 0, durationMs: Date.now() - startTime };
    }

    const generationTopic = topic || 'Cybersecurity';
    const generationDifficulty = difficulty || 'medium';
    const targetSize = settings.bufferSize || 50;
    const maxBatchSize = settings.maxConcurrentGeneration;

    // Get current pool size
    const poolSize = await prisma.question.count({
      where: {
        category: generationTopic,
        status: 'to_review',
        isRejected: false,
      },
    });

    const poolSizeBeforeGen = poolSize;

    if (poolSize >= targetSize) {
      console.info(`[PoolMaintenance] Pool size (${poolSize}) already meets target (${targetSize})`);
      return { poolSize, generatedCount: 0, failedCount: 0, durationMs: Date.now() - startTime };
    }

    const neededCount = Math.min(targetSize - poolSize, maxBatchSize);
    console.info(`[PoolMaintenance] Generating ${neededCount} questions to reach target of ${targetSize}`);

    let generatedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < neededCount; i++) {
      try {
        const { question, embedding } = await generateSingleQuestion({
          topic: generationTopic,
          difficulty: generationDifficulty,
          attemptCount: 0,
          provider,
        });

        const validation = await provider.validateQuestion(question);
        const qualityScore = typeof validation.qualityScore === 'number' ? validation.qualityScore : 0.7;

        // Find similar questions
        const potentialDuplicates = await findSimilarQuestions(embedding);

        // Normalize answer values: convert True/False to Vrai/Faux
        const normalizeAnswer = (value: string | boolean): string => {
          const str = String(value).trim();
          if (str.toLowerCase() === 'true') return 'Vrai';
          if (str.toLowerCase() === 'false') return 'Faux';
          return str;
        };

        const normalizeOptions = (options: any[]): string[] => {
          if (!Array.isArray(options)) return ['Vrai', 'Faux'];
          return options.map(opt => normalizeAnswer(opt)).slice(0, 2);
        };

        const normalizedOptions = normalizeOptions(question.options);
        const normalizedAnswer = normalizeAnswer(question.correctAnswer);

        const stored = await prisma.question.create({
          data: {
            questionText: question.questionText,
            options: normalizedOptions,
            correctAnswer: normalizedAnswer,
            explanation: question.explanation,
            difficulty: new Decimal(question.estimatedDifficulty || 0.5),
            qualityScore: new Decimal(qualityScore),
            category: generationTopic,
            questionType: 'true-false',
            status: 'to_review',
            aiProvider: provider.name,
            aiModel: provider.model,
            mitreTechniques: question.mitreTechniques || [],
            tags: question.tags || [],
            potentialDuplicates: potentialDuplicates.length > 0 ? potentialDuplicates : null,
            metadata: {
              create: {
                embeddingId: `q_${Date.now()}_${i}`,
                validationScore: new Decimal(qualityScore),
                validatorModel: provider.name,
              },
            },
          },
        });

        if (potentialDuplicates.length > 0) {
          console.info(`[PoolMaintenance] Found ${potentialDuplicates.length} similar questions for review`);
        }

        await upsertEmbedding(stored.id, embedding, {
          question_id: stored.id,
          question_text: question.questionText,
          category: generationTopic,
          difficulty: question.estimatedDifficulty,
          tags: question.tags || [],
          created_at: new Date().toISOString(),
        });

        generatedCount++;
      } catch (error) {
        console.error(`[PoolMaintenance] Failed to generate question ${i + 1}:`, error);
        failedCount++;
      }
    }

    const durationMs = Date.now() - startTime;
    const poolSizeAfterGen = await prisma.question.count({
      where: {
        category: generationTopic,
        status: 'to_review',
        isRejected: false,
      },
    });

    // Log the generation activity
    await prisma.generationLog.create({
      data: {
        settingsId: settings.id,
        topic: generationTopic,
        difficulty: generationDifficulty,
        batchSize: neededCount,
        generatedCount,
        savedCount: generatedCount,
        failedCount,
        poolSizeBeforeGen,
        poolSizeAfterGen,
        durationMs,
        completedAt: new Date(),
      },
    });

    console.info(`[PoolMaintenance] Generated ${generatedCount} questions in ${durationMs}ms`);
    return { poolSize: poolSizeAfterGen, generatedCount, failedCount, durationMs };
  } catch (error) {
    console.error('[PoolMaintenance] Error:', error);
    throw error;
  }
}

/**
 * Generate a single question for pool maintenance (bypasses cache limits)
 * Used by background pool maintenance for one-by-one generation
 */
export async function generateQuestionForPool(
  topic: string,
  provider: AIProvider,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<{ id: number; question: string } | null> {
  try {
    // Generate one question and save it directly to to_review
    const context: GenerationContext = {
      topic,
      difficulty,
      attemptCount: 1,
      provider,
    };

    const { question, embedding, questionHash } = await generateSingleQuestion(context);

    // Check for exact duplicates
    const existingHash = await prisma.question.findFirst({
      where: { questionHash },
      select: { id: true },
    });

    if (existingHash) {
      console.log('[PoolGen] Duplicate detected, skipping');
      return null;
    }

    // Save to database
    const saved = await prisma.question.create({
      data: {
        questionText: question.questionText,
        options: question.options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        difficulty: new Decimal(difficulty === 'easy' ? 0.3 : difficulty === 'medium' ? 0.6 : 0.9),
        category: topic,
        status: 'to_review',
        isRejected: false,
        questionHash,
        aiProvider: provider.name,
        aiModel: provider.model,
        questionType: 'true-false',
        createdAt: new Date(),
      },
    });

    console.log(`[PoolGen] Generated and saved question ${saved.id}`);
    if (embedding.length > 0) {
      const difficultyNum = difficulty === 'easy' ? 0.3 : difficulty === 'medium' ? 0.6 : 0.9;
      await upsertEmbedding(saved.id, embedding, {
        question_id: saved.id,
        question_text: question.questionText,
        category: topic,
        difficulty: difficultyNum,
        tags: [],
        created_at: new Date().toISOString(),
      });
    }

    console.log(`[PoolGen] Generated and saved question ${saved.id}`);
    return { id: saved.id, question: question.text };
  } catch (error) {
    console.error('[PoolGen] Failed to generate question:', error);
    throw error;
  }
}