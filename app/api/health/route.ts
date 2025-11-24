import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { isProviderAvailable } from '@/lib/ai/provider-factory';

/**
 * GET /api/health
 * System health check - verifies all services are operational
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    const health: any = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {},
    };

    // Check database
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.services.database = {
        status: 'ok',
        message: 'PostgreSQL connection successful',
      };
    } catch (error) {
      health.services.database = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Database connection failed',
      };
      health.status = 'degraded';
    }

    // Check AI providers
    try {
      const ollamaAvailable = await isProviderAvailable('ollama');
      const openaiAvailable = await isProviderAvailable('openai');

      health.services.aiProviders = {
        status: ollamaAvailable || openaiAvailable ? 'ok' : 'error',
        ollama: ollamaAvailable ? 'available' : 'unavailable',
        openai: openaiAvailable ? 'available' : 'unavailable',
      };

      if (!ollamaAvailable && !openaiAvailable) {
        health.status = 'degraded';
      }
    } catch (error) {
      health.services.aiProviders = {
        status: 'error',
        message: error instanceof Error ? error.message : 'AI provider check failed',
      };
      health.status = 'error';
    }

    // Add response time
    health.responseTime = `${Date.now() - startTime}ms`;

    const statusCode = health.status === 'ok' ? 200 : health.status === 'degraded' ? 503 : 500;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    console.error('[API/health] Error:', error);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 500 }
    );
  }
}
