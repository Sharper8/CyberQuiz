import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyAdminToken } from '@/lib/auth/admin-auth';

/**
 * GET /api/admin/duplicate-stats
 * Get duplicate detection statistics and cycling rate
 * Requires admin authentication
 */
export async function GET(request: NextRequest) {
  try {
    const adminId = await verifyAdminToken(request);
    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic');
    const hours = parseInt(searchParams.get('hours') || '24');

    // Calculate time window
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Get duplicate logs
    const duplicateLogs = await prisma.duplicateLog.findMany({
      where: {
        ...(topic && { topic }),
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Calculate statistics
    const totalDuplicates = duplicateLogs.length;
    const hashDuplicates = duplicateLogs.filter(d => d.detectionMethod === 'hash').length;
    const embeddingDuplicates = duplicateLogs.filter(d => d.detectionMethod === 'embedding').length;

    // Get total generation attempts
    const totalGenerated = await prisma.question.count({
      where: {
        ...(topic && { category: topic }),
        createdAt: { gte: since },
      },
    });

    // Calculate cycling rate (duplicates / total attempts)
    const totalDuplicatesNum = Number(totalDuplicates);
    const totalGeneratedNum = Number(totalGenerated);
    const cyclingRate = totalGeneratedNum > 0 
      ? (totalDuplicatesNum / (totalGeneratedNum + totalDuplicatesNum)) * 100 
      : 0;

    // Get top duplicate hashes
    const duplicatesByHash = duplicateLogs.reduce((acc, log) => {
      acc[log.questionHash] = (acc[log.questionHash] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topDuplicates = Object.entries(duplicatesByHash)
      .map(([hash, count]: [string, number]) => ({
        hash,
        count,
        examples: duplicateLogs.filter(d => d.questionHash === hash).slice(0, 2),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      statistics: {
        totalDuplicates,
        hashDuplicates,
        embeddingDuplicates,
        totalGenerated,
        cyclingRate: Number(cyclingRate.toFixed(2)),
        timeWindowHours: hours,
      },
      topDuplicates,
      recentDuplicates: duplicateLogs.slice(0, 20).map(d => ({
        id: d.id,
        questionHash: d.questionHash.substring(0, 16) + '...',
        attemptedText: d.attemptedText.substring(0, 100) + '...',
        detectionMethod: d.detectionMethod,
        similarityScore: d.similarityScore ? Number(d.similarityScore) : null,
        topic: d.topic,
        createdAt: d.createdAt,
      })),
    });
  } catch (error) {
    console.error('[API/admin/duplicate-stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch duplicate statistics' },
      { status: 500 }
    );
  }
}
