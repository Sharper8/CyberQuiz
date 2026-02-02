/**
 * Admin API: Update question difficulty
 * PATCH /api/admin/questions/[id]/difficulty
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { isValidAdminDifficulty, type AdminDifficultyLevel } from '@/lib/utils/difficulty-mapper';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const questionId = parseInt(id);
    if (isNaN(questionId)) {
      return NextResponse.json({ error: 'Invalid question ID' }, { status: 400 });
    }

    const body = await request.json();
    const { adminDifficulty } = body;

    // Validate difficulty level
    if (!adminDifficulty || !isValidAdminDifficulty(adminDifficulty)) {
      return NextResponse.json(
        { 
          error: 'Invalid difficulty level', 
          validLevels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] 
        },
        { status: 400 }
      );
    }

    // Check if question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Update difficulty
    const updated = await prisma.question.update({
      where: { id: questionId },
      data: { generationDifficulty: adminDifficulty as AdminDifficultyLevel },
      select: {
        id: true,
        generationDifficulty: true,
        difficulty: true,
      },
    });

    return NextResponse.json({
      success: true,
      question: updated,
    });
  } catch (error: any) {
    console.error('[Admin] Error updating question difficulty:', error);
    return NextResponse.json(
      { error: 'Failed to update difficulty', details: error.message },
      { status: 500 }
    );
  }
}
