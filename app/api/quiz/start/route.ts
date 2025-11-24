import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { UsernameSchema } from '@/lib/validators/username';
import { initializeQuizSession } from '@/lib/services/quiz-engine';
import { logAuthEvent } from '@/lib/logging/logger';

/**
 * POST /api/quiz/start
 * Initialize a new quiz session for a user
 * Validates username and creates quiz session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body;

    // Validate username
    const validation = UsernameSchema.safeParse(username);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid username format', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Check username uniqueness (7-day window)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSession = await prisma.quizSession.findFirst({
      where: {
        username: validation.data,
        createdAt: { gte: sevenDaysAgo },
      },
    });

    if (recentSession) {
      return NextResponse.json(
        { error: 'Username already used in the last 7 days. Please choose a different username.' },
        { status: 409 }
      );
    }

    // Initialize quiz session
    const session = await initializeQuizSession(validation.data);

    logAuthEvent('login', validation.data, {
      sessionId: session.sessionId,
    });

    return NextResponse.json(
      {
        sessionId: session.sessionId,
        username: session.username,
        message: 'Quiz session started. Get ready for 5 warm-up questions!',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API/quiz/start] Error:', error);
    return NextResponse.json(
      { error: 'Failed to start quiz session' },
      { status: 500 }
    );
  }
}
