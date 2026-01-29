export const dynamic = 'force-dynamic';

/**
 * Pause/Resume generation endpoints
 */

import { NextResponse, NextRequest } from 'next/server';
import { pauseGeneration, resumeGeneration, getGenerationStatus } from '@/lib/services/pool-maintenance';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  try {
    const { action } = await params;

    let status;
    if (action === 'pause') {
      status = pauseGeneration();
      return NextResponse.json({
        success: true,
        message: 'Generation paused',
        status: {
          isGenerating: status.isGenerating,
          isPaused: status.isPaused,
          currentGeneration: getGenerationStatus().currentGeneration,
        },
      });
    } else if (action === 'resume') {
      status = resumeGeneration();
      return NextResponse.json({
        success: true,
        message: 'Generation resumed',
        status: {
          isGenerating: status.isGenerating,
          isPaused: status.isPaused,
          currentGeneration: getGenerationStatus().currentGeneration,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "pause" or "resume"' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
