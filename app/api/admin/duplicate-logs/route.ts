/**
 * Admin API: Get duplicate detection logs
 * Shows detected duplicates with original and similar questions
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get total count
    const totalCount = await prisma.duplicateLog.count();

    // Get duplicate logs
    const logs = await prisma.duplicateLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // Fetch associated questions
    const formattedLogs = await Promise.all(
      logs.map(async (log) => {
        const originalQuestion = log.originalQuestionId
          ? await prisma.question.findUnique({
              where: { id: log.originalQuestionId },
              select: {
                id: true,
                questionText: true,
                difficulty: true,
                generationDifficulty: true,
                category: true,
                status: true,
              },
            })
          : null;

        return {
          id: log.id,
          detectedAt: log.createdAt,
          similarityScore: log.similarityScore ? Number(log.similarityScore) : null,
          detectionMethod: log.detectionMethod,
          generatedQuestionText: log.attemptedText,
          duplicateOf: originalQuestion
            ? {
                id: originalQuestion.id,
                text: originalQuestion.questionText,
                difficulty: Number(originalQuestion.difficulty),
                generationDifficulty: originalQuestion.generationDifficulty,
                category: originalQuestion.category,
                status: originalQuestion.status,
              }
            : null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      total: totalCount,
      count: formattedLogs.length,
      logs: formattedLogs,
    });
  } catch (error: any) {
    console.error('[Admin] Error fetching duplicate logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch duplicate logs', details: error.message },
      { status: 500 }
    );
  }
}
