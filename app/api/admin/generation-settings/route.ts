import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth/admin-auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const UpdateSettingsSchema = z.object({
  targetPoolSize: z.number().int().min(1).max(500).optional(),
  autoGenerateEnabled: z.boolean().optional(),
  generationTopic: z.string().min(1).max(255).optional(),
  generationDifficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  maxConcurrentGeneration: z.number().int().min(1).max(20).optional(),
});

/**
 * GET /api/admin/generation-settings
 * Get current generation settings
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

    const settings = await prisma.generationSettings.findFirst();
    
    if (!settings) {
      // Create default if not exists
      const defaultSettings = await prisma.generationSettings.create({
        data: {
          targetPoolSize: 50,
          autoGenerateEnabled: true,
          generationTopic: 'Cybersecurity',
          generationDifficulty: 'medium',
          maxConcurrentGeneration: 5,
        },
      });
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('[GenerationSettings GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/generation-settings
 * Update generation settings
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
    const validation = UpdateSettingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request format', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Get or create settings
    let settings = await prisma.generationSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.generationSettings.create({
        data: {
          targetPoolSize: 50,
          autoGenerateEnabled: true,
          generationTopic: 'Cybersecurity',
          generationDifficulty: 'medium',
          maxConcurrentGeneration: 5,
        },
      });
    }

    // Update with provided fields
    const updated = await prisma.generationSettings.update({
      where: { id: settings.id },
      data: validation.data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[GenerationSettings POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
