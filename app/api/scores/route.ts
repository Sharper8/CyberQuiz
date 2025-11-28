import { NextRequest, NextResponse } from 'next/server';
import {
  getTopScores,
  getUserBestScore,
  getUserScoreHistory,
  getLeaderboardStats,
  recordScore,
} from '@/lib/services/leaderboard';

/**
 * GET /api/scores
 * Fetch leaderboard data
 * Query params:
 *   - limit: top N scores (default 100)
 *   - username: get specific user's best score
 *   - history: get user's score history (requires username)
 *   - stats: get leaderboard statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);
    const username = searchParams.get('username');
    const history = searchParams.get('history') === 'true';
    const stats = searchParams.get('stats') === 'true';

    if (history && !username) {
      return NextResponse.json(
        { error: 'username required for history' },
        { status: 400 }
      );
    }

    // Get stats
    if (stats) {
      const leaderboardStats = await getLeaderboardStats();
      return NextResponse.json(leaderboardStats, { status: 200 });
    }

    // Get user's score history
    if (history && username) {
      const scoreHistory = await getUserScoreHistory(username, limit);
      return NextResponse.json(
        {
          username,
          scores: scoreHistory,
        },
        { status: 200 }
      );
    }

    // Get user's best score
    if (username) {
      const bestScore = await getUserBestScore(username);
      if (!bestScore) {
        return NextResponse.json(
          {
            username,
            bestScore: null,
            message: 'No scores found for this user in the last 7 days',
          },
          { status: 200 }
        );
      }
      return NextResponse.json(
        {
          username,
          bestScore,
        },
        { status: 200 }
      );
    }

    // Get top scores leaderboard
    const topScores = await getTopScores(limit);
    return NextResponse.json(
      {
        leaderboard: topScores,
        count: topScores.length,
        limit,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API/scores] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scores' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scores
 * Submit a new score
 * Body:
 *   - username: player username
 *   - score: points earned
 *   - totalQuestions: total questions in quiz
 *   - topic: optional quiz topic
 *   - quizType: optional quiz type/mode
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, score, totalQuestions, topic, quizType } = body;

    if (!username || score === undefined || !totalQuestions) {
      return NextResponse.json(
        { error: 'username, score, and totalQuestions are required' },
        { status: 400 }
      );
    }

    const newScore = await recordScore({
      username,
      score,
      totalQuestions,
      topic: topic || quizType || null,
    });

    return NextResponse.json(newScore, { status: 201 });
  } catch (error) {
    console.error('[API/scores] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit score' },
      { status: 500 }
    );
  }
}
