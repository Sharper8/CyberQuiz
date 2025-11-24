import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { recordAnswer, completeQuizSession } from '@/lib/services/quiz-engine';
import { logQuizCompletion } from '@/lib/logging/logger';
import { z } from 'zod';

const AnswerSchema = z.object({
  questionId: z.string(),
  answer: z.enum(['true', 'false']),
});

/**
 * POST /api/quiz/[sessionId]/answer
 * Submit an answer to a question
 * Handles warm-up logic, termination on first wrong, and scoring
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();

    // Validate input
    const validation = AnswerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request format', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { questionId, answer } = validation.data;

    // Verify session exists
    const session = await prisma.quizSession.findUnique({
      where: { id: parseInt(sessionId) },
      include: { sessionQuestions: { select: { questionId: true } } },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Record answer and get result
    const result = await recordAnswer(parseInt(sessionId), parseInt(questionId), answer);

    // If should terminate (first wrong after warm-up), complete session
    if (result.shouldTerminate) {
      const finalScore = await completeQuizSession(parseInt(sessionId));

      logQuizCompletion(
        session.username,
        sessionId,
        finalScore,
        session.sessionQuestions.length + 1
      );

      return NextResponse.json(
        {
          isCorrect: result.isCorrect,
          shouldTerminate: true,
          score: finalScore,
          message: 'First incorrect answer after warm-up. Quiz terminated.',
        },
        { status: 200 }
      );
    }

    // Continue quiz
    return NextResponse.json(
      {
        isCorrect: result.isCorrect,
        shouldTerminate: false,
        score: result.score,
        warmupComplete: result.warmupComplete,
        message: result.warmupComplete
          ? 'Warm-up complete! Now facing adaptive difficulty.'
          : 'Keep going!',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API/quiz/answer] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process answer' },
      { status: 500 }
    );
  }
}
