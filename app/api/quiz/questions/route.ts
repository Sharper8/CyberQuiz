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
    // Use raw SQL to get random questions
    const questions = await prisma.$queryRaw<Array<{
      id: number;
      questionText: string;
      options: any;
      category: string | null;
      explanation: string;
    }>>`
      SELECT id, "questionText", options, category, explanation
      FROM "Question"
      WHERE status = 'accepted'
        AND "isRejected" = false
        AND "questionType" = 'true-false'
      ORDER BY RANDOM()
      LIMIT 100
    `;

    return NextResponse.json(questions);
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}
