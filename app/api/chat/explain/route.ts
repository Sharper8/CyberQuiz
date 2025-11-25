import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { explainAnswer } from '@/lib/services/chat-explain';
import { getAIProvider } from '@/lib/ai/provider-factory';
import { z } from 'zod';

const ExplainRequestSchema = z.object({
  sessionId: z.number(),
  questionId: z.number(),
  userAnswer: z.enum(['true', 'false']),
});

/**
 * POST /api/chat/explain
 * Generate AI explanation for a quiz answer
 * Called after user answers question or requests more details
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = ExplainRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request format', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { sessionId, questionId, userAnswer } = validation.data;

    // Verify session exists
    const session = await prisma.quizSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Get AI provider (prefer Ollama)
    const provider = await getAIProvider('ollama');

    // Generate explanation
    const explanation = await explainAnswer({
      sessionId,
      questionId,
      userAnswer,
      provider,
    });

    return NextResponse.json(
      {
        explanation: explanation.explanation,
        tips: explanation.tips,
        relatedConcepts: explanation.relatedConcepts,
        correctAnswer: question.correctAnswer,
        isCorrect: userAnswer === question.correctAnswer,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API/chat/explain] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { status: 500 }
    );
  }
}
