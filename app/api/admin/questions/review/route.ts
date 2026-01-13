import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  acceptQuestion,
  rejectQuestion,
  getPendingQuestions,
  getReviewStats,
} from '@/lib/services/admin-review';
import { verifyAdminToken } from '@/lib/auth/admin-auth';
import { z } from 'zod';

const ReviewSchema = z.object({
  action: z.enum(['accept', 'reject']),
  questionId: z.number(),
<<<<<<< HEAD
  reason: z.string().optional(),
=======
  reason: z.string().optional().default('No reason provided'),
>>>>>>> zip-work
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
<<<<<<< HEAD
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
=======
    // Fetch ALL questions to prevent any from being hidden due to pagination
    // The admin interface will handle filtering and display
    const limit = Math.min(parseInt(searchParams.get('limit') || '1000'), 10000);
>>>>>>> zip-work
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
<<<<<<< HEAD
        questions: questions.map((q) => ({
          id: q.id,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty.toString(),
          category: q.category,
          aiProvider: q.aiProvider,
          createdAt: q.createdAt,
        })),
=======
        questions: questions.map((q) => {
          const duplicates = q.potentialDuplicates ? (typeof q.potentialDuplicates === 'string' ? JSON.parse(q.potentialDuplicates) : q.potentialDuplicates) : [];
          return {
            id: q.id,
            questionText: q.questionText,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty.toString(),
            category: q.category,
            status: q.status,
            isRejected: q.isRejected,
            aiProvider: q.aiProvider,
            createdAt: q.createdAt,
            potentialDuplicates: duplicates,
          };
        }),
>>>>>>> zip-work
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
      await acceptQuestion(questionId, adminId, reason);
      return NextResponse.json(
        { message: 'Question accepted and added to quiz pool' },
        { status: 200 }
      );
    } else if (action === 'reject') {
<<<<<<< HEAD
      if (!reason) {
        return NextResponse.json(
          { error: 'reason required for rejection' },
          { status: 400 }
        );
      }
      await rejectQuestion(questionId, adminId, reason);
=======
      await rejectQuestion(questionId, adminId, reason || 'No reason provided');
>>>>>>> zip-work
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
