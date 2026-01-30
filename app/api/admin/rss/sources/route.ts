/**
 * API Route: RSS Sources Management
 * GET /api/admin/rss/sources - List all RSS sources
 * POST /api/admin/rss/sources - Add a new RSS source
 * DELETE /api/admin/rss/sources/[id] - Remove an RSS source
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth/admin-auth';
import { prisma } from '@/lib/db/prisma';
import { fetchRssFeed } from '@/lib/services/rss-fetcher';

export async function GET(request: NextRequest) {
  try {
    const adminId = await verifyAdminToken(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.generationSettings.findFirst();
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    const sources = await prisma.rssSource.findMany({
      where: { settingsId: settings.id },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    return NextResponse.json(sources);
  } catch (error) {
    console.error('[RSS Sources GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RSS sources' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminId = await verifyAdminToken(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url, title } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Invalid RSS URL' },
        { status: 400 }
      );
    }

    // Validate feed by trying to fetch it
    let feedTitle = title;
    try {
      const articles = await fetchRssFeed(url);
      if (articles.length === 0) {
        return NextResponse.json(
          { error: 'Feed appears to be empty' },
          { status: 400 }
        );
      }
      if (!feedTitle) {
        feedTitle = new URL(url).hostname;
      }
    } catch (error: any) {
      return NextResponse.json(
        { error: `Failed to validate feed: ${error.message}` },
        { status: 400 }
      );
    }

    const settings = await prisma.generationSettings.findFirst();
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    // Check for duplicates
    const existing = await prisma.rssSource.findFirst({
      where: {
        settingsId: settings.id,
        url,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'This feed is already added' },
        { status: 409 }
      );
    }

    const source = await prisma.rssSource.create({
      data: {
        settingsId: settings.id,
        url,
        title: feedTitle,
        enabled: true,
      },
    });

    return NextResponse.json(source, { status: 201 });
  } catch (error) {
    console.error('[RSS Sources POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to add RSS source' },
      { status: 500 }
    );
  }
}
