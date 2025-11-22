import { prisma } from '../db/prisma';
import { qdrant, upsertEmbedding, searchSimilar } from '../db/qdrant';
import { AIProvider } from '../ai/providers/base';
import { GeneratedQuestionSchema } from '../validators/question';
import { buildGenerationPrompt } from '../ai/prompts/generation';

interface GenerationContext {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  attemptCount: number;
  provider: AIProvider;
}

const DUPLICATE_SIMILARITY_THRESHOLD = 0.95;
const MAX_GENERATION_RETRIES = 3;
const CACHE_TARGET = 5; // Keep 5 questions in to_review cache per category

/**
 * Generate a single question with duplicate detection and regeneration on duplicate
 * On duplicate, retry with increased temperature and more context
 */
async function generateSingleQuestion(context: GenerationContext): Promise<any> {
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

  // Generate embedding
  const embedding = await provider.generateEmbedding(question.questionText);

  // Check for duplicates
  const similar = await searchSimilar(embedding, 1);
  if (similar.length > 0 && similar[0].score > DUPLICATE_SIMILARITY_THRESHOLD) {
    if (attemptCount < MAX_GENERATION_RETRIES) {
      console.info(
        `[QuestionGenerator] Duplicate detected (similarity: ${similar[0].score}), retrying with more context (attempt ${attemptCount + 1})`
      );
      // Recursive retry with incremented attempt count
      return generateSingleQuestion({
        ...context,
        attemptCount: attemptCount + 1,
      });
    } else {
      throw new Error(`Failed to generate unique question after ${MAX_GENERATION_RETRIES} attempts (duplicates detected)`);
    }
  }

  return { question, embedding };
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

      // Store in database with to_review status
      const stored = await prisma.question.create({
        data: {
          questionText: question.questionText,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          difficulty: new Decimal(question.estimatedDifficulty),
          qualityScore: new Decimal(validation.qualityScore),
          category: topic,
          questionType: 'true-false',
          status: 'to_review',
          aiProvider: provider.name,
          mitreTechniques: question.mitreTechniques || [],
          tags: question.tags || [],
          metadata: {
            create: {
              embeddingId: `q_${Date.now()}_${i}`, // Placeholder; will be set by Qdrant
              validationScore: new Decimal(validation.qualityScore),
              validatorModel: provider.name,
            },
          },
        },
      });

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

      const { question, embedding } = await generateSingleQuestion({
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

      onProgress?.({ 
        step: 'storing', 
        message: `Enregistrement de la question ${i + 1}/${targetCount}...`,
        current: i,
        total: targetCount
      });

      // Store in database with to_review status
      const stored = await prisma.question.create({
        data: {
          questionText: question.questionText,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          difficulty: new Decimal(question.estimatedDifficulty),
          qualityScore: new Decimal(validation.qualityScore),
          category: topic,
          questionType: 'true-false',
          status: 'to_review',
          aiProvider: provider.name,
          mitreTechniques: question.mitreTechniques || [],
          tags: question.tags || [],
          metadata: {
            create: {
              embeddingId: `q_${Date.now()}_${i}`,
              validationScore: new Decimal(validation.qualityScore),
              validatorModel: provider.name,
            },
          },
        },
      });

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

// Import Decimal from prisma for type safety
import { Decimal } from '@prisma/client/runtime/library';
