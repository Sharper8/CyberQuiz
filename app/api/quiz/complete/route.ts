export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * POST /api/quiz/complete
 * Save quiz score to leaderboard
 * Body: { sessionId, score, totalQuestions, timeTaken?, topic? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, score, totalQuestions, timeTaken, topic } = body;
    
    console.log('[API/quiz/complete] Received request:', { sessionId, score, totalQuestions, timeTaken, topic });

    if (!sessionId || score === undefined || totalQuestions === undefined || totalQuestions < 0) {
      console.warn('[API/quiz/complete] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, score, totalQuestions' },
        { status: 400 }
      );
    }

    // Fetch the session to get username and other details
    const session = await prisma.quizSession.findUnique({
      where: { id: parseInt(sessionId) },
    });
    
    console.log('[API/quiz/complete] Found session:', session?.id, session?.username);

    if (!session) {
      console.warn('[API/quiz/complete] Session not found:', sessionId);
      return NextResponse.json(
        { error: 'Quiz session not found' },
        { status: 404 }
      );
    }

    // Calculate accuracy percentage (avoid division by zero)
    const accuracyPercentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

    // Create score record
    const scoreRecord = await prisma.score.create({
      data: {
        sessionId: parseInt(sessionId),
        username: session.username,
        score,
        totalQuestions,
        accuracyPercentage,
        timeTaken,
        topic: topic || null,
      },
    });
    
    console.log('[API/quiz/complete] Score created:', scoreRecord.id, scoreRecord.username);

    // Update quiz session to mark as completed
    await prisma.quizSession.update({
      where: { id: parseInt(sessionId) },
      data: {
        status: 'completed',
        endTime: new Date(),
        score,
      },
    });
    
    console.log('[API/quiz/complete] Session updated to completed');

    return NextResponse.json(
      {
        success: true,
        scoreId: scoreRecord.id,
        message: 'Score saved successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API/quiz/complete] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save quiz score' },
      { status: 500 }
    );
  }
}
