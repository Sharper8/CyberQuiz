import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth/admin-auth';
import { maintainQuestionPool, getGenerationStatus } from '@/lib/services/pool-maintenance';

/**
 * GET /api/admin/maintain-pool
 * Get current generation status
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

    const status = getGenerationStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('[MaintainPool GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/maintain-pool
 * Manually trigger background generation to maintain question pool
 */
export async function POST(request: NextRequest) {
  try {
    const adminId = await verifyAdminToken(request);
    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await maintainQuestionPool();

    if (result.skipped) {
      return NextResponse.json({
        message: 'Generation already in progress or disabled',
        ...result,
      });
    }

    return NextResponse.json({
      poolSizeBefore: result.poolSizeBefore,
      poolSizeAfter: result.poolSizeAfter,
      generated: result.generated,
      message: `Pool maintained: ${result.generated} questions generated`,
    });
  } catch (error: any) {
    console.error('[MaintainPool POST] Error:', error);
    
    if (error.message?.includes('No AI provider available')) {
      return NextResponse.json(
        { error: 'AI provider not ready. Models may still be loading.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to maintain pool', message: error.message },
      { status: 500 }
    );
  }
}
