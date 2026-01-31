/**
 * API Route: Delete RSS Source
 * DELETE /api/admin/rss/sources/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth/admin-auth';
import { prisma } from '@/lib/db/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await verifyAdminToken(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const sourceId = parseInt(id);
    if (isNaN(sourceId)) {
      return NextResponse.json(
        { error: 'Invalid source ID' },
        { status: 400 }
      );
    }

    // Verify the source belongs to this admin's settings
    const settings = await prisma.generationSettings.findFirst();
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    const source = await prisma.rssSource.findUnique({
      where: { id: sourceId },
    });

    if (!source || source.settingsId !== settings.id) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    // Delete the source (articles cascade delete)
    await prisma.rssSource.delete({
      where: { id: sourceId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[RSS Sources DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete RSS source' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await verifyAdminToken(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const sourceId = parseInt(id);
    if (isNaN(sourceId)) {
      return NextResponse.json(
        { error: 'Invalid source ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { enabled, refreshIntervalMin } = body;

    const settings = await prisma.generationSettings.findFirst();
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    const source = await prisma.rssSource.findUnique({
      where: { id: sourceId },
    });

    if (!source || source.settingsId !== settings.id) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    const updated = await prisma.rssSource.update({
      where: { id: sourceId },
      data: {
        ...(typeof enabled === 'boolean' && { enabled }),
        ...(refreshIntervalMin && { refreshIntervalMin }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[RSS Sources PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update RSS source' },
      { status: 500 }
    );
  }
}
