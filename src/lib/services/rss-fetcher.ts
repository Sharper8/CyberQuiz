/**
 * RSS Feed Fetcher Service
 * Fetches and parses RSS feeds for content-based question generation
 */

import { prisma } from '../db/prisma';
import xml2js from 'xml2js';

interface RssArticle {
  title: string;
  link: string;
  description?: string;
  content?: string;
  pubDate?: string;
  guid?: string;
}

const xmlParser = new xml2js.Parser();
const RSS_FETCH_TIMEOUT = 10000; // 10 seconds

/**
 * Fetch a single RSS feed and parse its contents
 */
export async function fetchRssFeed(feedUrl: string): Promise<RssArticle[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), RSS_FETCH_TIMEOUT);

    const response = await fetch(feedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'CyberQuiz/1.0 (RSS Feed Fetcher)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    const parsed = await xmlParser.parseStringPromise(text);

    // Handle both RSS 2.0 and Atom feeds
    let items: any[] = [];
    
    if (parsed.rss?.channel?.[0]?.item) {
      // RSS 2.0 format
      items = parsed.rss.channel[0].item;
    } else if (parsed.feed?.entry) {
      // Atom format
      items = parsed.feed.entry;
    }

    return items.map((item: any) => ({
      title: extractText(item.title),
      link: extractText(item.link?.[0] || item.link?.[0]?.$.href || item.id?.[0]),
      description: extractText(item.description || item.summary),
      content: extractText(item['content:encoded'] || item.content),
      pubDate: extractText(item.pubDate || item.published),
      guid: extractText(item.guid || item.id),
    }));
  } catch (error: any) {
    console.error(`[RssFetcher] Error fetching ${feedUrl}:`, error.message);
    throw error;
  }
}

/**
 * Extract text from various XML structures
 */function extractText(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    if (value.length === 0) return '';
    const first = value[0];
    if (typeof first === 'string') return first;
    if (first._) return first._;
    if (first.$?.href) return first.$.href;
  }
  if (value._) return value._;
  return JSON.stringify(value);
}

/**
 * Sync RSS sources and update articles in database
 */
export async function syncRssSources(): Promise<{
  fetched: number;
  errors: number;
  articlesAdded: number;
}> {
  const settings = await prisma.generationSettings.findFirst();
  
  if (!settings || !settings.rssEnabled) {
    return { fetched: 0, errors: 0, articlesAdded: 0 };
  }

  const sources = await prisma.rssSource.findMany({
    where: {
      settingsId: settings.id,
      enabled: true,
    },
  });

  let totalFetched = 0;
  let totalErrors = 0;
  let totalAdded = 0;

  for (const source of sources) {
    try {
      const articles = await fetchRssFeed(source.url);
      
      for (const article of articles) {
        try {
          const guid = article.guid || article.link;
          
          // Check if article already exists
          const existing = await prisma.rssArticle.findFirst({
            where: {
              sourceId: source.id,
              guid,
            },
          });

          if (!existing) {
            await prisma.rssArticle.create({
              data: {
                sourceId: source.id,
                title: article.title,
                link: article.link,
                description: article.description,
                content: article.content,
                pubDate: article.pubDate ? new Date(article.pubDate) : null,
                guid,
              },
            });
            totalAdded++;
          }
        } catch (error) {
          console.error(`[RssFetcher] Error saving article from ${source.url}:`, error);
        }
      }

      totalFetched++;

      // Update source fetch timestamp
      await prisma.rssSource.update({
        where: { id: source.id },
        data: {
          lastFetchedAt: new Date(),
          lastFetchError: null,
        },
      });
    } catch (error: any) {
      totalErrors++;
      
      // Update source with error message
      await prisma.rssSource.update({
        where: { id: source.id },
        data: {
          lastFetchError: error.message,
        },
      });
    }
  }

  return {
    fetched: totalFetched,
    errors: totalErrors,
    articlesAdded: totalAdded,
  };
}

/**
 * Get recent RSS articles for context in generation prompts
 */
export async function getRecentRssContext(maxArticles: number = 5): Promise<string> {
  const settings = await prisma.generationSettings.findFirst();
  
  if (!settings || !settings.rssEnabled || !settings.useRssAsContext) {
    return '';
  }

  const articles = await prisma.rssArticle.findMany({
    where: {
      source: {
        settingsId: settings.id,
        enabled: true,
      },
      usedForQuestion: false, // Prefer unused articles
    },
    include: {
      source: true,
    },
    orderBy: { pubDate: 'desc' },
    take: maxArticles,
  });

  if (articles.length === 0) {
    return '';
  }

  return articles
    .map(
      (article) =>
        `Source: ${article.source?.title || 'Unknown'}\n` +
        `Title: ${article.title}\n` +
        `Summary: ${article.description || article.content?.substring(0, 500) || 'N/A'}`
    )
    .join('\n\n---\n\n');
}

/**
 * Get recent RSS articles with context for generation
 */
export async function getRssContextForGeneration(maxArticles: number = 5): Promise<{
  context: string;
  articleIds: number[];
  sourceIds: number[];
  articles: Array<{
    id: number;
    title: string;
    link: string;
    sourceId: number;
    sourceTitle?: string | null;
    sourceUrl?: string | null;
  }>;
}> {
  const settings = await prisma.generationSettings.findFirst();

  if (!settings || !settings.rssEnabled || !settings.useRssAsContext) {
    return { context: '', articleIds: [], sourceIds: [], articles: [] };
  }

  const articles = await prisma.rssArticle.findMany({
    where: {
      source: {
        settingsId: settings.id,
        enabled: true,
      },
      usedForQuestion: false,
    },
    include: {
      source: true,
    },
    orderBy: { pubDate: 'desc' },
    take: maxArticles,
  });

  if (articles.length === 0) {
    return { context: '', articleIds: [], sourceIds: [], articles: [] };
  }

  const context = articles
    .map(
      (article) =>
        `Source: ${article.source?.title || article.source?.url || 'Unknown'}\n` +
        `Title: ${article.title}\n` +
        `Link: ${article.link}\n` +
        `Summary: ${article.description || article.content?.substring(0, 500) || 'N/A'}`
    )
    .join('\n\n---\n\n');

  const articleIds = articles.map((article) => article.id);
  const sourceIds = Array.from(new Set(articles.map((article) => article.sourceId)));

  return {
    context,
    articleIds,
    sourceIds,
    articles: articles.map((article) => ({
      id: article.id,
      title: article.title,
      link: article.link,
      sourceId: article.sourceId,
      sourceTitle: article.source?.title,
      sourceUrl: article.source?.url,
    })),
  };
}

/**
 * Mark articles as used for generation
 */
export async function markArticlesAsUsed(articleIds: number[]): Promise<void> {
  if (articleIds.length === 0) return;

  await prisma.rssArticle.updateMany({
    where: { id: { in: articleIds } },
    data: {
      usedForQuestion: true,
      lastUsedAt: new Date(),
    },
  });
}
