import { NextRequest, NextResponse } from 'next/server';
import {
  getTopScores,
  getUserBestScore,
  getUserScoreHistory,
  getLeaderboardStats,
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
