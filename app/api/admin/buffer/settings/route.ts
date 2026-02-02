/**
 * API Route: Buffer Settings
 * GET/POST /api/admin/buffer/settings
 * Manage buffer and generation space configuration
 */

import { NextResponse } from 'next/server';
import { updateBufferSettings } from '@/lib/services/buffer-maintenance';
import { updateGenerationSpaceConfig, getGenerationSpaceConfig } from '@/lib/services/generation-space';
import { prisma } from '@/lib/db/prisma';

// Force dynamic - admin settings require runtime database access
export const dynamic = 'force-dynamic';

const DEFAULT_RSS_FEEDS = [
  {
    title: 'BleepingComputer',
    url: 'https://www.bleepingcomputer.com/feed/',
  },
  {
    title: 'Krebs on Security',
    url: 'https://krebsonsecurity.com/feed/',
  },
  {
    title: 'The Hacker News',
    url: 'https://feeds.feedburner.com/TheHackersNews',
  },
];

const LEGACY_RSS_FEEDS = new Set([
  'https://www.cisa.gov/news-events/cybersecurity-advisories/rss.xml',
  'https://www.securityweek.com/feed',
]);

export async function GET() {
  try {
    const settings = await prisma.generationSettings.findFirst();
    const spaceConfig = await getGenerationSpaceConfig();

    return NextResponse.json({
      bufferSize: settings?.bufferSize || 10,
      autoRefillEnabled: settings?.autoRefillEnabled ?? true,
      defaultModel: settings?.defaultModel || 'mistral:7b',
      fallbackModel: settings?.fallbackModel || 'mistral:7b',
      rssEnabled: settings?.rssEnabled ?? false,
      useRssAsContext: settings?.useRssAsContext ?? true,
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

    // Update model settings and RSS settings
    if (body.defaultModel || body.fallbackModel || body.rssEnabled !== undefined || body.useRssAsContext !== undefined) {
      const settings = await prisma.generationSettings.findFirst();
      if (settings) {
        await prisma.generationSettings.update({
          where: { id: settings.id },
          data: {
            ...(body.defaultModel && { defaultModel: body.defaultModel }),
            ...(body.fallbackModel && { fallbackModel: body.fallbackModel }),
            ...(body.rssEnabled !== undefined && { rssEnabled: body.rssEnabled }),
            ...(body.useRssAsContext !== undefined && { useRssAsContext: body.useRssAsContext }),
          },
        });

        if (body.rssEnabled === true) {
          const existingSources = await prisma.rssSource.findMany({
            where: { settingsId: settings.id },
          });

          const hasOnlyLegacyFeeds =
            existingSources.length > 0 &&
            existingSources.every((source) => LEGACY_RSS_FEEDS.has(source.url));

          if (existingSources.length === 0 || hasOnlyLegacyFeeds) {
            if (hasOnlyLegacyFeeds) {
              await prisma.rssSource.deleteMany({
                where: {
                  settingsId: settings.id,
                  url: { in: Array.from(LEGACY_RSS_FEEDS) },
                },
              });
            }

            await prisma.rssSource.createMany({
              data: DEFAULT_RSS_FEEDS.map((feed) => ({
                settingsId: settings.id,
                title: feed.title,
                url: feed.url,
                enabled: true,
              })),
              skipDuplicates: true,
            });
          }
        }
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
