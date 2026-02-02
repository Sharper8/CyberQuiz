export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth/admin-auth';
import { ensureBufferFilled, getBufferStatus } from '@/lib/services/buffer-maintenance';

/**
 * GET /api/admin/maintain-pool
 * Get current buffer status
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

    const status = await getBufferStatus();
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
 * Manually trigger buffer generation
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

    // Trigger buffer refill (non-blocking)
    await ensureBufferFilled();

    // Get updated status
    const status = await getBufferStatus();

    return NextResponse.json({
      message: 'Buffer refill triggered',
      status,
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
      { error: 'Failed to trigger buffer refill', message: error.message },
      { status: 500 }
    );
  }
}
