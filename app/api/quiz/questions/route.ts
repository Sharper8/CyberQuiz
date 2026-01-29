export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/quiz/questions - Get questions for quiz WITHOUT answers
 * This endpoint returns questions without the correct answers to prevent cheating
 * Answers are validated on the server during quiz submission
 */
export async function GET(request: NextRequest) {
  try {
    const questions = await prisma.question.findMany({
      where: {
        status: 'accepted',
        isRejected: false,
        questionType: 'true-false', // Only use true-false questions
      },
      select: {
        id: true,
        questionText: true,
        options: true,
        category: true,
        explanation: true,
        // Explicitly exclude correctAnswer
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to prevent excessive data transfer
    });

    return NextResponse.json(questions);
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}
