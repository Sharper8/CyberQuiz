import { prisma } from '../db/prisma';

/**
 * Leaderboard service with caching strategy
 * For small user base (1-5k users), cache leaderboard after each quiz completion
 * 7-day cleanup of old entries
 */

interface LeaderboardEntry {
  id: number;
  rank: number;
  username: string;
  score: number;
  totalQuestions: number;
  accuracyPercentage: number;
  topic: string | null;
  difficulty: string | null;
  completedAt: Date;
}

/**
 * Get top scores (cached leaderboard)
 * Returns top N entries, sorted by score descending
 */
export async function getTopScores(limit: number = 100): Promise<LeaderboardEntry[]> {
  const scores = await prisma.score.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    },
    orderBy: [{ score: 'desc' }, { createdAt: 'asc' }], // Tiebreaker: earliest completion wins
    take: limit,
  });

  return scores.map((score, index) => ({
    id: score.id,
    rank: index + 1,
    username: score.username,
    score: score.score,
    totalQuestions: score.totalQuestions,
    accuracyPercentage: Number(score.accuracyPercentage),
    topic: score.topic,
    difficulty: null, // TODO: Calculate from session questions
    completedAt: score.createdAt,
  }));
}

/**
 * Get user's best score on leaderboard
 */
export async function getUserBestScore(username: string): Promise<LeaderboardEntry | null> {
  const score = await prisma.score.findFirst({
    where: {
      username,
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    orderBy: { score: 'desc' },
  });

  if (!score) return null;

  // Get rank
  const betterScores = await prisma.score.count({
    where: {
      score: { gt: score.score },
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
  });

  return {
    id: score.id,
    rank: betterScores + 1,
    username: score.username,
    score: score.score,
    totalQuestions: score.totalQuestions,
    accuracyPercentage: Number(score.accuracyPercentage),
    topic: score.topic,
    difficulty: null, // TODO: Calculate from session questions
    completedAt: score.createdAt,
  };
}

/**
 * Get all scores for a user (historical)
 */
export async function getUserScoreHistory(username: string, limit: number = 50): Promise<LeaderboardEntry[]> {
  const scores = await prisma.score.findMany({
    where: { username },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return scores.map((score, index) => ({
    id: score.id,
    rank: index + 1, // Rank in user's history, not leaderboard
    username: score.username,
    score: score.score,
    totalQuestions: score.totalQuestions,
    accuracyPercentage: Number(score.accuracyPercentage),
    topic: score.topic,
    difficulty: null, // TODO: Calculate from session questions
    completedAt: score.createdAt,
  }));
}

/**
 * Get leaderboard statistics
 */
export async function getLeaderboardStats(): Promise<{
  totalPlayers: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  totalScores: number;
}> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [stats, highestScore, lowestScore] = await Promise.all([
    prisma.score.aggregate({
      _count: true,
      _avg: { score: true },
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.score.findFirst({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { score: 'desc' },
      select: { score: true },
    }),
    prisma.score.findFirst({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { score: 'asc' },
      select: { score: true },
    }),
  ]);

  const uniquePlayers = await prisma.score.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo },
    },
    distinct: ['username'],
    select: { username: true },
  });

  return {
    totalPlayers: uniquePlayers.length,
    averageScore: Math.round(stats._avg.score || 0),
    highestScore: highestScore?.score || 0,
    lowestScore: lowestScore?.score || 0,
    totalScores: stats._count,
  };
}

/**
 * Cleanup old scores (7+ days old)
 * Called periodically (e.g., daily cron job)
 */
export async function cleanupOldScores(): Promise<number> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const result = await prisma.score.deleteMany({
    where: {
      createdAt: { lt: sevenDaysAgo },
    },
  });

  console.info(`[Leaderboard] Cleaned up ${result.count} old score entries`);
  return result.count;
}

/**
 * Invalidate/refresh cache after quiz completion
 * In production, could be Redis cache invalidation
 * For MVP with small user base, recompute on-demand
 */
export async function refreshLeaderboardCache(): Promise<void> {
  // In this implementation, leaderboard is computed on-demand
  // No explicit cache invalidation needed
  // For production with larger user base, use Redis or similar
}
