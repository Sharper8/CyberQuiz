import { NextRequest, NextResponse } from 'next/server';
import { generateQuestionsForCache } from '@/lib/services/question-generator';
import { getAIProvider } from '@/lib/ai/provider-factory';
import { rateLimitMiddleware } from '@/lib/middleware/rate-limit';
import { verifyAdminToken } from '@/lib/auth/admin-auth';
import { z } from 'zod';

const GenerateRequestSchema = z.object({
  topic: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  count: z.number().int().min(1).max(10).optional(),
});

/**
 * POST /api/questions/generate
 * Generate new questions and cache them for admin review
 * Requires admin authentication
 * Subject to rate limiting (100 Q/10min global)
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limit first
    const limitError = rateLimitMiddleware(request);
    if (limitError) {
      return limitError;
    }

    // Verify admin token
    const adminId = await verifyAdminToken(request);
    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = GenerateRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request format', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { topic, difficulty = 'medium' } = validation.data;

    // Get AI provider
    const provider = await getAIProvider('ollama');
    
    // Check if provider is ready (models loaded)
    const isReady = await provider.isAvailable();
    if (!isReady) {
      return NextResponse.json(
        {
          error: 'AI provider not ready',
          message: 'Ollama models are still being downloaded. Please wait a few minutes and try again.',
        },
        { status: 503 } // Service Unavailable
      );
    }

    // Generate questions to cache
    const cacheSize = await generateQuestionsForCache(
      topic,
      provider,
      difficulty
    );

    return NextResponse.json(
      {
        topic,
        difficulty,
        cacheSize,
        message: `Generated questions cached for review (total in queue: ${cacheSize})`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API/questions/generate] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate questions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
