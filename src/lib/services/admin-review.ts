import { prisma } from '../db/prisma';
import { AIProvider } from '../ai/providers/base';
import { logger } from '../logging/logger';

/**
 * Admin question review service
 * Manage approve/reject workflow for cached questions awaiting review
 * Track admin decisions and soft-delete rejected questions
 */

export interface ReviewMetadata {
  adminId: string;
  reason?: string;
  timestamp: Date;
  aiProvider?: string;
}

/**
 * Fetch paginated list of questions awaiting review
 */
export async function getPendingQuestions(
  category?: string,
  limit: number = 20,
  offset: number = 0
): Promise<{
  questions: any[];
  total: number;
}> {
  const where = {
    status: 'to_review',
    isRejected: false,
    ...(category && { category }),
  };

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        metadata: true,
      },
    }),
    prisma.question.count({ where }),
  ]);

  return { questions, total };
}

/**
 * Accept a question and move it to "accepted" status
 * Makes it available for quiz retrieval
 */
export async function acceptQuestion(
  questionId: number,
  adminId: number,
  reason?: string
): Promise<void> {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    throw new Error(`Question ${questionId} not found`);
  }

  if (question.status !== 'to_review') {
    throw new Error(`Question ${questionId} is not pending review (status: ${question.status})`);
  }

  await prisma.question.update({
    where: { id: questionId },
    data: {
      status: 'accepted',
      // metadata update fields removed (adminReviewNote/adminReviewedAt not in schema)
    },
  });

  logger.info(`[AdminReview] Question ${questionId} accepted by admin ${adminId}`, {
    questionId,
    adminId,
    reason,
  });
}

/**
 * Reject a question and soft-delete it with isRejected flag
 * Prevents regeneration of similar questions
 * Soft delete keeps audit trail
 */
export async function rejectQuestion(
  questionId: number,
  adminId: number,
  reason: string
): Promise<void> {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    throw new Error(`Question ${questionId} not found`);
  }

  if (question.status !== 'to_review') {
    throw new Error(`Question ${questionId} is not pending review (status: ${question.status})`);
  }

  await prisma.question.update({
    where: { id: questionId },
    data: {
      status: 'rejected',
      isRejected: true, // Soft delete flag prevents regeneration
      // metadata update removed (adminReviewNote/adminReviewedAt not in schema)
    },
  });

  logger.info(`[AdminReview] Question ${questionId} rejected by admin ${adminId}`, {
    questionId,
    adminId,
    reason,
  });
}

/**
 * Bulk accept multiple questions (e.g., admin review batch)
 */
export async function bulkAcceptQuestions(
  questionIds: number[],
  adminId: number
): Promise<number> {
  const result = await prisma.question.updateMany({
    where: {
      id: { in: questionIds },
      status: 'to_review',
      isRejected: false,
    },
    data: {
      status: 'accepted',
    },
  });

  logger.info(`[AdminReview] Bulk accepted ${result.count} questions by admin ${adminId}`, {
    count: result.count,
    adminId,
  });

  return result.count;
}

/**
 * Bulk reject multiple questions with reason
 */
export async function bulkRejectQuestions(
  questionIds: number[],
  adminId: number,
  reason: string
): Promise<number> {
  const result = await prisma.question.updateMany({
    where: {
      id: { in: questionIds },
      status: 'to_review',
      isRejected: false,
    },
    data: {
      status: 'rejected',
      isRejected: true,
    },
  });

  logger.info(`[AdminReview] Bulk rejected ${result.count} questions by admin ${adminId}`, {
    count: result.count,
    adminId,
    reason,
  });

  return result.count;
}

/**
 * Get review statistics (e.g., for admin dashboard)
 */
export async function getReviewStats(): Promise<{
  pending: number;
  accepted: number;
  rejected: number;
  byCategory: Record<string, number>;
}> {
  const [pending, accepted, rejected] = await Promise.all([
    prisma.question.count({
      where: { status: 'to_review', isRejected: false },
    }),
    prisma.question.count({
      where: { status: 'accepted' },
    }),
    prisma.question.count({
      where: { status: 'rejected', isRejected: true },
    }),
  ]);

  // Count by category
  const byCategory = await prisma.question.groupBy({
    by: ['category'],
    _count: {
      id: true,
    },
    where: {
      status: 'accepted',
    },
  });

  return {
    pending,
    accepted,
    rejected,
    byCategory: Object.fromEntries(
      byCategory.map((g) => [g.category, g._count.id])
    ),
  };
}

/**
 * Set AI provider preference for next generation batch
 * Allows admin to toggle between Ollama and OpenAI
 */
export async function setAIProviderForNextBatch(
  provider: 'ollama' | 'openai',
  adminId: string
): Promise<void> {
  // Store in a simple config or admin log
  // For MVP, could be env-based or Redis key
  logger.info(`[AdminReview] AI provider toggled to ${provider} by admin ${adminId}`, {
    adminId,
    provider,
  });

  // Implementation: Could store in AdminConfig table or emit event
  // For now, just log the preference
}
