/**
 * API Route: Buffer Status
 * GET /api/admin/buffer/status
 * Returns current buffer status for admin UI
 */

import { NextResponse } from 'next/server';
import { getBufferStatus } from '@/lib/services/buffer-maintenance';
import { getGenerationSpaceConfig } from '@/lib/services/generation-space';

export async function GET() {
  try {
    const [bufferStatus, spaceConfig] = await Promise.all([
      getBufferStatus(),
      getGenerationSpaceConfig(),
    ]);

    return NextResponse.json({
      buffer: bufferStatus,
      structuredSpace: spaceConfig,
    });
  } catch (error: any) {
    console.error('[BufferStatus] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
