import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyAdminToken } from '@/lib/auth/admin-auth';

/**
 * DELETE /api/admin/scores
 * Clear all scores from the leaderboard
 */
export async function DELETE(request: NextRequest) {
  try {
    const adminId = await verifyAdminToken(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all scores
    const result = await prisma.score.deleteMany({});

    console.log(`[Admin] Cleared leaderboard (deleted ${result.count} scores) by admin-${adminId}`);

    return NextResponse.json({
      success: true,
      message: `Leaderboard cleared (${result.count} scores deleted)`,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error('[API/admin/scores/clear] Error:', error);
    return NextResponse.json(
      { error: 'Failed to clear leaderboard' },
      { status: 500 }
    );
  }
}
