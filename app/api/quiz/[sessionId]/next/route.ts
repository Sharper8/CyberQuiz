import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getNextQuestion } from '@/lib/services/quiz-engine';

/**
 * GET /api/quiz/[sessionId]/next
 * Fetch the next question for a quiz session
 * Returns null if no more questions available (quiz ends)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // Verify session exists
    const session = await prisma.quizSession.findUnique({
      where: { id: parseInt(sessionId) },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get next question
    const question = await getNextQuestion(parseInt(sessionId));

    if (!question) {
      return NextResponse.json(
        {
          message: 'No more questions available. Quiz completed.',
          question: null,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        question: {
          id: question.id,
          questionText: question.questionText,
          options: question.options,
          difficulty: question.difficulty.toString(), // Serialize Decimal
        },
        // Note: correctAnswer not sent to client
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API/quiz/next] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch next question' },
      { status: 500 }
    );
  }
}
