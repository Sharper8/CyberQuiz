/**
 * Admin generation status endpoint
 * Returns: pool size, generation status, is paused
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getGenerationStatus } from '@/lib/services/pool-maintenance';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // Get current generation status
    const genStatus = getGenerationStatus();

    // Get pool count
    const poolCount = await prisma.question.count({
      where: { status: 'to_review' },
    });

    // Get current settings
    const settings = await prisma.generationSettings.findFirst();

    return NextResponse.json({
      poolSize: poolCount,
      targetPoolSize: settings?.targetPoolSize || 50,
      autoGenerateEnabled: settings?.autoGenerateEnabled || true,
      generationTopic: settings?.generationTopic || 'Cybersecurity',
      generationDifficulty: settings?.generationDifficulty || 'medium',
      maxConcurrentGeneration: settings?.maxConcurrentGeneration || 10,
      isGenerating: genStatus.isGenerating,
      isPaused: genStatus.isPaused,
      currentGeneration: genStatus.currentGeneration,
    });
  } catch (error: any) {
    console.error('[GenerationStatus] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
