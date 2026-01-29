export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { UsernameSchema } from '@/lib/validators/username';
import { initializeQuizSession } from '@/lib/services/quiz-engine';
import { logAuthEvent } from '@/lib/logging/logger';
import { containsBannedWord } from '@/lib/services/banned-words';

/**
 * POST /api/quiz/start
 * Initialize a new quiz session for a user
 * Validates username and creates quiz session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body;

    // Validate username format
    const validation = UsernameSchema.safeParse(username);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid username format', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Check for banned words (both hardcoded and database)
    const isBannedWord = await containsBannedWord(validation.data);
    if (isBannedWord) {
      return NextResponse.json(
        { error: 'Username contains inappropriate language or is banned' },
        { status: 400 }
      );
    }

    // Check if user is explicitly banned
    const bannedUser = await prisma.bannedUser.findUnique({
      where: { username: validation.data },
    });

    if (bannedUser) {
      return NextResponse.json(
        { error: `You have been banned from playing. Reason: ${bannedUser.reason || 'Violation of rules'}` },
        { status: 403 }
      );
    }

    // Initialize quiz session (usernames can be reused)
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
