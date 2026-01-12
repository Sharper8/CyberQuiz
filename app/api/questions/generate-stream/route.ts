import { NextRequest } from 'next/server';
import { generateQuestionsWithProgress } from '@/lib/services/question-generator';
import { getAIProvider } from '@/lib/ai/provider-factory';
import { verifyAdminToken } from '@/lib/auth/admin-auth';
import { z } from 'zod';

const GenerateRequestSchema = z.object({
  topic: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  count: z.number().int().min(1).max(10).optional(),
});

/**
 * POST /api/questions/generate-stream
 * Generate questions with real-time progress updates via Server-Sent Events
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    const adminId = await verifyAdminToken(request);
    if (!adminId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const validation = GenerateRequestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request format', details: validation.error.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { topic, difficulty = 'medium' } = validation.data;

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        try {
          // Get AI provider
          sendEvent('progress', { 
            step: 'init', 
            message: 'Initialisation du générateur IA...' 
          });
          
          const provider = await getAIProvider('ollama');

          if (!(await provider.isAvailable())) {
            throw new Error('AI provider not available');
          }

          // Check cache first
          sendEvent('progress', { 
            step: 'cache_check', 
            message: 'Vérification du cache de questions...' 
          });

          // Generate with progress callbacks
          await generateQuestionsWithProgress(
            topic,
            provider,
            difficulty,
            (progressData) => {
              sendEvent('progress', progressData);
            }
          );

          sendEvent('complete', { 
            message: 'Génération terminée!',
            topic,
            difficulty 
          });

          controller.close();
        } catch (error) {
          sendEvent('error', { 
            message: error instanceof Error ? error.message : 'Erreur inconnue' 
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[API/questions/generate-stream] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to start generation stream',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
