/**
 * API Route: Buffer Settings
 * GET/POST /api/admin/buffer/settings
 * Manage buffer and generation space configuration
 */

import { NextResponse } from 'next/server';
import { updateBufferSettings } from '@/lib/services/buffer-maintenance';
import { updateGenerationSpaceConfig, getGenerationSpaceConfig } from '@/lib/services/generation-space';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const settings = await prisma.generationSettings.findFirst();
    const spaceConfig = await getGenerationSpaceConfig();

    return NextResponse.json({
      bufferSize: settings?.bufferSize || 10,
      autoRefillEnabled: settings?.autoRefillEnabled ?? true,
      defaultModel: settings?.defaultModel || 'ollama:mistral:7b',
      fallbackModel: settings?.fallbackModel || 'ollama:mistral:7b',
      structuredSpace: spaceConfig,
    });
  } catch (error: any) {
    console.error('[BufferSettings] GET error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Update buffer settings
    if (body.bufferSize !== undefined || body.autoRefillEnabled !== undefined) {
      await updateBufferSettings({
        bufferSize: body.bufferSize,
        autoRefillEnabled: body.autoRefillEnabled,
      });
    }

    // Update structured space configuration
    if (body.structuredSpace) {
      await updateGenerationSpaceConfig(body.structuredSpace);
    }

    // Update model settings
    if (body.defaultModel || body.fallbackModel) {
      const settings = await prisma.generationSettings.findFirst();
      if (settings) {
        await prisma.generationSettings.update({
          where: { id: settings.id },
          data: {
            defaultModel: body.defaultModel,
            fallbackModel: body.fallbackModel,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[BufferSettings] POST error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
