import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * POST /api/quiz/verify-answer
 * Verify if an answer is correct (server-side validation)
 * Request body: { questionId: number, userAnswer: boolean }
 * Response: { correct: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const { questionId, userAnswer } = await request.json();

    if (typeof questionId !== 'number' || typeof userAnswer !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Fetch the question from database
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        correctAnswer: true,
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Parse the correct answer to boolean
    const answerLower = String(question.correctAnswer).toLowerCase().trim();
    const correctAsBoolean = 
      answerLower === 'true' ||
      answerLower === '1' ||
      answerLower === 'vrai' ||
      answerLower === 'oui' ||
      answerLower === 'yes';

    // Verify the answer
    const isCorrect = userAnswer === correctAsBoolean;

    return NextResponse.json({
      correct: isCorrect,
    });
  } catch (error: any) {
    console.error('Error verifying answer:', error);
    return NextResponse.json(
      { error: 'Failed to verify answer' },
      { status: 500 }
    );
  }
}
