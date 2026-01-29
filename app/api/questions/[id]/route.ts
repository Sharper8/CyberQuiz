export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ensureBufferFilled } from '@/lib/services/buffer-maintenance';

// DELETE /api/questions/[id] - Soft delete by marking as rejected
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Soft delete: mark as rejected instead of hard delete
    await prisma.question.update({
      where: { id: parseInt(id) },
      data: {
        isRejected: true,
        status: 'rejected',
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}

// PATCH /api/questions/[id] - Update question status (accept/reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      status,
      validated,
      questionText,
      explanation,
      correctAnswer,
      category,
      tags,
      generationDomain,
      generationSkillType,
      generationDifficulty,
      generationGranularity,
    } = body;
    
    // Support both new status field and legacy validated field
    let updateData: any = {};
    
    if (status !== undefined) {
      updateData.status = status;
      updateData.isRejected = status === 'rejected';
    } else if (validated !== undefined) {
      // Legacy support: convert validated boolean to status
      updateData.status = validated ? 'accepted' : 'to_review';
      updateData.isRejected = !validated;
    }

    if (questionText !== undefined) updateData.questionText = questionText;
    if (explanation !== undefined) updateData.explanation = explanation;
    if (category !== undefined) updateData.category = category;
    if (generationDomain !== undefined) updateData.generationDomain = generationDomain;
    if (generationSkillType !== undefined) updateData.generationSkillType = generationSkillType;
    if (generationDifficulty !== undefined) updateData.generationDifficulty = generationDifficulty;
    if (generationGranularity !== undefined) updateData.generationGranularity = generationGranularity;

    if (correctAnswer !== undefined) {
      const normalized = typeof correctAnswer === 'boolean'
        ? (correctAnswer ? 'True' : 'False')
        : String(correctAnswer);
      updateData.correctAnswer = normalized;
      updateData.options = ['True', 'False'];
    }

    if (tags !== undefined) {
      const parsedTags = Array.isArray(tags)
        ? tags
        : String(tags)
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
      updateData.tags = parsedTags;
    }
    
    const question = await prisma.question.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        metadata: true,
      },
    });

    // Trigger buffer refill asynchronously when a question leaves the review pool
    ensureBufferFilled().catch((err) => {
      console.error('[BufferRefill] Failed to refill buffer after status change:', err);
    });
    
    return NextResponse.json(question);
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

// GET /api/questions/[id] - Get single question details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const question = await prisma.question.findUnique({
      where: { id: parseInt(id) },
      include: {
        metadata: true,
      },
    });
    
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    
    return NextResponse.json(question);
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 });
  }
}
