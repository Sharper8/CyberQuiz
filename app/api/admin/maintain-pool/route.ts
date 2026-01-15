import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth/admin-auth';
import { generateToMaintainPool } from '@/lib/services/question-generator';
import { getAIProvider } from '@/lib/ai/provider-factory';

/**
 * POST /api/admin/maintain-pool
 * Trigger background generation to maintain question pool
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

    const body = await request.json();
    const { topic, difficulty } = body;

    const provider = await getAIProvider('ollama');
    const result = await generateToMaintainPool(provider, topic, difficulty);

    return NextResponse.json({
      poolSize: result.poolSize,
      generatedCount: result.generatedCount,
      failedCount: result.failedCount,
      durationMs: result.durationMs,
      message: `Pool maintained: ${result.generatedCount} questions generated`,
    });
  } catch (error: any) {
    console.error('[MaintainPool] Error:', error);
    
    if (error.message?.includes('No AI provider available')) {
      return NextResponse.json(
        { error: 'AI provider not ready. Models may still be loading.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to maintain pool', details: error.message },
      { status: 500 }
    );
  }
}
