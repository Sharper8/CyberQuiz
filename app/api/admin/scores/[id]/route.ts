export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyAdminToken } from '@/lib/auth/admin-auth';

/**
 * DELETE /api/admin/scores/[id]
 * Delete a score entry from the leaderboard
 * Query param: banUsername=true to also add username to banned list
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await verifyAdminToken(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const scoreId = parseInt(id);
    if (isNaN(scoreId)) {
      return NextResponse.json({ error: 'Invalid score ID' }, { status: 400 });
    }

    // Get the score to find username
    const score = await prisma.score.findUnique({
      where: { id: scoreId },
    });

    if (!score) {
      return NextResponse.json({ error: 'Score not found' }, { status: 404 });
    }

    // Check if we should also ban the username
    const { searchParams } = new URL(request.url);
    const shouldBan = searchParams.get('banUsername') === 'true';

    if (shouldBan) {
      // Add username to banned words (ignore if already exists)
      await prisma.bannedWord.upsert({
        where: { word: score.username.toLowerCase() },
        create: {
          word: score.username.toLowerCase(),
          reason: 'Added from leaderboard moderation',
          createdBy: `admin-${adminId}`,
        },
        update: {}, // Do nothing if already exists
      });

      console.log(`[Admin] Banned username: ${score.username} by admin-${adminId}`);
    }

    // Delete the score
    await prisma.score.delete({
      where: { id: scoreId },
    });

    console.log(`[Admin] Deleted score ID ${scoreId} (${score.username}) by admin-${adminId}`);

    return NextResponse.json({
      success: true,
      message: shouldBan 
        ? `Score deleted and username "${score.username}" banned` 
        : 'Score deleted',
      scoreId,
      bannedUsername: shouldBan ? score.username : null,
    });
  } catch (error) {
    console.error('[API/admin/scores/delete] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete score' },
      { status: 500 }
    );
  }
}
