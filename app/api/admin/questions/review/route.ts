import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  acceptQuestion,
  rejectQuestion,
  getPendingQuestions,
  getReviewStats,
} from '@/lib/services/admin-review';
import { verifyAdminToken } from '@/lib/auth/admin-auth';
import { getAIProvider } from '@/lib/ai/provider-factory';
import { generateToMaintainPool } from '@/lib/services/question-generator';
import { z } from 'zod';

const ReviewSchema = z.object({
  action: z.enum(['accept', 'reject']),
  questionId: z.number(),
  reason: z.string().optional(),
});

/**
 * GET /api/admin/questions/review
 * Get questions pending admin review
 * Requires admin authentication
 */
export async function GET(request: NextRequest) {
  try {
    const adminId = await verifyAdminToken(request);
    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category');
    const stats = searchParams.get('stats') === 'true';

    if (stats) {
      const reviewStats = await getReviewStats();
      return NextResponse.json(reviewStats, { status: 200 });
    }

    const { questions, total } = await getPendingQuestions(category, limit, offset);

    return NextResponse.json(
      {
        questions: questions.map((q) => ({
          id: q.id,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          qualityScore: q.qualityScore ? Number(q.qualityScore) : null,
          category: q.category,
          aiProvider: q.aiProvider,
          potentialDuplicates: q.potentialDuplicates,
          createdAt: q.createdAt,
        })),
        total,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API/admin/review] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending questions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/questions/review
 * Accept or reject a question
 * Requires admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    const adminId = await verifyAdminToken(request);
    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = ReviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request format', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { action, questionId, reason } = validation.data;

    if (action === 'accept') {
      const question = await acceptQuestion(questionId, adminId, reason);
      
      // Map difficulty from decimal to category
      const difficultyMap = (diff: number): 'easy' | 'medium' | 'hard' => {
        if (diff < 0.33) return 'easy';
        if (diff < 0.67) return 'medium';
        return 'hard';
      };

      // Auto-generate ONE question in background to maintain pool (non-blocking)
      // This ensures the pool always has questions ready for review
      generateToMaintainPool(
        await getAIProvider('ollama'),
        question.category,
        difficultyMap(Number(question.difficulty))
      ).catch((err) => {
        console.error('[AutoGenerate] Failed to maintain pool:', err);
      });

      return NextResponse.json(
        { message: 'Question accepted and added to quiz pool. New question generation triggered.' },
        { status: 200 }
      );
    } else if (action === 'reject') {
      if (!reason) {
        return NextResponse.json(
          { error: 'reason required for rejection' },
          { status: 400 }
        );
      }
      await rejectQuestion(questionId, adminId, reason);
      return NextResponse.json(
        { message: 'Question rejected and soft-deleted' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[API/admin/review] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process review' },
      { status: 500 }
    );
  }
}
