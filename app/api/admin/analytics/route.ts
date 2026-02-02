/**
 * Analytics API for admin dashboard
 * Provides statistics on question generation efficiency and user performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Note: For now, no auth check (same as other admin routes)
  // In production, add JWT verification here

  try {
    // 1. Generation Efficiency Stats (last 100 generated questions)
    const totalGenerated = await prisma.question.count();
    const totalDuplicatesDetected = await prisma.duplicateLog.count();
    
    // Get duplicate detection over time (grouped by generation sessions)
    // A session is defined as questions generated within 5 minutes of each other
    const duplicatesOverTime = await prisma.$queryRaw<Array<{
      session_start: Date;
      session_end: Date;
      session_number: number;
      duplicate_count: bigint;
      total_generated: bigint;
      efficiency_rate: number;
    }>>`
      WITH question_times AS (
        SELECT 
          id,
          "createdAt",
          LAG("createdAt") OVER (ORDER BY "createdAt") as prev_created
        FROM "Question"
        WHERE status != 'rejected'
        ORDER BY "createdAt" DESC
        LIMIT 500
      ),
      question_sessions AS (
        SELECT 
          id,
          "createdAt",
          SUM(CASE 
            WHEN "createdAt" - prev_created > INTERVAL '5 minutes' OR prev_created IS NULL
            THEN 1 
            ELSE 0 
          END) OVER (ORDER BY "createdAt") as session_number
        FROM question_times
      ),
      session_stats AS (
        SELECT 
          qs.session_number,
          MIN(qs."createdAt") as session_start,
          MAX(qs."createdAt") as session_end,
          COUNT(DISTINCT qs.id) as total_generated,
          COUNT(DISTINCT dl.id) as duplicate_count
        FROM question_sessions qs
        LEFT JOIN "DuplicateLog" dl ON dl."originalQuestionId" = qs.id
        GROUP BY qs.session_number
      )
      SELECT 
        session_number::int,
        session_start,
        session_end,
        duplicate_count::bigint,
        total_generated::bigint,
        CASE 
          WHEN total_generated > 0 
          THEN ROUND(CAST((1.0 - (duplicate_count::float / total_generated::float)) * 100 AS numeric), 2)
          ELSE 100.0
        END as efficiency_rate
      FROM session_stats
      ORDER BY session_number DESC
      LIMIT 20
    `;

    // 2. Current efficiency metrics
    const recentQuestions = await prisma.question.findMany({
      where: { status: { not: 'rejected' } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true },
    });

    const recentQuestionIds = recentQuestions.map(q => q.id);
    const recentDuplicates = await prisma.duplicateLog.count({
      where: {
        originalQuestionId: { in: recentQuestionIds },
      },
    });

    const currentEfficiencyRate = recentQuestions.length > 0
      ? ((recentQuestions.length - recentDuplicates) / recentQuestions.length) * 100
      : 100;

    // 3. Duplicate detection breakdown by method
    const duplicatesByMethodRaw = await prisma.duplicateLog.groupBy({
      by: ['detectionMethod'],
      _count: { id: true },
    });

    // Ensure both methods are always present in the response
    const duplicatesByMethod = [
      {
        detectionMethod: 'hash' as const,
        _count: { id: duplicatesByMethodRaw.find(d => d.detectionMethod === 'hash')?._count.id || 0 },
      },
      {
        detectionMethod: 'embedding' as const,
        _count: { id: duplicatesByMethodRaw.find(d => d.detectionMethod === 'embedding')?._count.id || 0 },
      },
    ];

    // 4. Hardest questions for users (based on incorrect answer rate)
    const hardestQuestions = await prisma.$queryRaw<Array<{
      question_id: number;
      question_text: string;
      total_attempts: bigint;
      incorrect_attempts: bigint;
      difficulty_rate: number;
      category: string;
      generation_difficulty: string | null;
    }>>`
      SELECT 
        q.id as question_id,
        q."questionText" as question_text,
        COUNT(rh.id)::bigint as total_attempts,
        COUNT(CASE WHEN rh."isCorrect" = false THEN 1 END)::bigint as incorrect_attempts,
        ROUND(
          CAST((COUNT(CASE WHEN rh."isCorrect" = false THEN 1 END)::float / 
           NULLIF(COUNT(rh.id)::float, 0)) * 100 AS numeric), 
          2
        ) as difficulty_rate,
        q.category,
        q."generationDifficulty"
      FROM "Question" q
      INNER JOIN "ResponseHistory" rh ON rh."questionId" = q.id
      WHERE q.status = 'accepted'
      GROUP BY q.id, q."questionText", q.category, q."generationDifficulty"
      HAVING COUNT(rh.id) >= 3
      ORDER BY difficulty_rate DESC
      LIMIT 50
    `;

    // 5. Easiest questions
    const easiestQuestions = await prisma.$queryRaw<Array<{
      question_id: number;
      question_text: string;
      total_attempts: bigint;
      incorrect_attempts: bigint;
      difficulty_rate: number;
      category: string;
      generation_difficulty: string | null;
    }>>`
      SELECT 
        q.id as question_id,
        q."questionText" as question_text,
        COUNT(rh.id)::bigint as total_attempts,
        COUNT(CASE WHEN rh."isCorrect" = false THEN 1 END)::bigint as incorrect_attempts,
        ROUND(
          CAST((COUNT(CASE WHEN rh."isCorrect" = false THEN 1 END)::float / 
           NULLIF(COUNT(rh.id)::float, 0)) * 100 AS numeric), 
          2
        ) as difficulty_rate,
        q.category,
        q."generationDifficulty"
      FROM "Question" q
      INNER JOIN "ResponseHistory" rh ON rh."questionId" = q.id
      WHERE q.status = 'accepted'
      GROUP BY q.id, q."questionText", q.category, q."generationDifficulty"
      HAVING COUNT(rh.id) >= 3
      ORDER BY difficulty_rate ASC
      LIMIT 50
    `;

    // 6. Overall stats
    const totalAccepted = await prisma.question.count({ where: { status: 'accepted' } });
    const totalRejected = await prisma.question.count({ where: { status: 'rejected' } });
    const totalToReview = await prisma.question.count({ where: { status: 'to_review' } });
    const totalResponses = await prisma.responseHistory.count();
    const totalSessions = await prisma.quizSession.count();

    return NextResponse.json({
      generationEfficiency: {
        totalGenerated,
        totalDuplicatesDetected,
        currentEfficiencyRate: Math.round(currentEfficiencyRate * 100) / 100,
        recentQuestionsAnalyzed: recentQuestions.length,
        recentDuplicates,
        duplicatesByMethod: duplicatesByMethod.map(d => ({
          method: d.detectionMethod,
          count: d._count.id,
        })),
        efficiencyOverTime: duplicatesOverTime.map(d => ({
          sessionNumber: d.session_number,
          sessionStart: d.session_start,
          sessionEnd: d.session_end,
          duplicateCount: Number(d.duplicate_count),
          totalGenerated: Number(d.total_generated),
          efficiencyRate: Number(d.efficiency_rate),
        })),
      },
      questionDifficulty: {
        hardest: hardestQuestions.map(q => ({
          id: q.question_id,
          questionText: q.question_text,
          totalAttempts: Number(q.total_attempts),
          incorrectAttempts: Number(q.incorrect_attempts),
          difficultyRate: Number(q.difficulty_rate),
          category: q.category,
          generationDifficulty: q.generation_difficulty,
        })),
        easiest: easiestQuestions.map(q => ({
          id: q.question_id,
          questionText: q.question_text,
          totalAttempts: Number(q.total_attempts),
          incorrectAttempts: Number(q.incorrect_attempts),
          difficultyRate: Number(q.difficulty_rate),
          category: q.category,
          generationDifficulty: q.generation_difficulty,
        })),
      },
      overview: {
        totalQuestions: totalGenerated,
        accepted: totalAccepted,
        rejected: totalRejected,
        toReview: totalToReview,
        totalResponses,
        totalSessions,
      },
    });
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
