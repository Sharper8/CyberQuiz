import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate limiting middleware for API endpoints
 * Enforces:
 * - Global limit: 100 questions/10 minutes
 * - Per-user limit: 5 questions/second
 * - Admin routes: unlimited (by-pass)
 *
 * Implementation uses in-memory store for MVP (Redis in production)
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store: key -> { count, resetTime }
const globalStore = new Map<string, RateLimitEntry>();
const userStore = new Map<string, RateLimitEntry>();

const GLOBAL_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const GLOBAL_LIMIT = 100; // questions per window
const USER_WINDOW_MS = 1000; // 1 second
const USER_LIMIT = 5; // questions per window

/**
 * Check global rate limit (100 questions per 10 min)
 */
function checkGlobalLimit(): boolean {
  const now = Date.now();
  const entry = globalStore.get('global');

  if (!entry || now >= entry.resetTime) {
    // Create new window
    globalStore.set('global', {
      count: 1,
      resetTime: now + GLOBAL_WINDOW_MS,
    });
    return true;
  }

  if (entry.count >= GLOBAL_LIMIT) {
    return false; // Rate limit exceeded
  }

  entry.count++;
  return true;
}

/**
 * Check per-user rate limit (5 questions per second)
 */
function checkUserLimit(userId: string): boolean {
  const now = Date.now();
  const key = `user:${userId}`;
  const entry = userStore.get(key);

  if (!entry || now >= entry.resetTime) {
    // Create new window
    userStore.set(key, {
      count: 1,
      resetTime: now + USER_WINDOW_MS,
    });
    return true;
  }

  if (entry.count >= USER_LIMIT) {
    return false; // Rate limit exceeded
  }

  entry.count++;
  return true;
}

/**
 * Cleanup expired entries (can be called periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();

  // Cleanup global store
  for (const [key, entry] of globalStore.entries()) {
    if (now >= entry.resetTime) {
      globalStore.delete(key);
    }
  }

  // Cleanup user store
  for (const [key, entry] of userStore.entries()) {
    if (now >= entry.resetTime) {
      userStore.delete(key);
    }
  }
}

/**
 * Rate limit middleware for question generation endpoints
 * Usage: Apply to /api/questions/generate and similar routes
 */
export function rateLimitMiddleware(request: NextRequest, userId?: string) {
  // Check global limit
  if (!checkGlobalLimit()) {
    return NextResponse.json(
      {
        error: 'Global rate limit exceeded',
        message: 'Too many questions generated. Please try again later.',
        retryAfter: GLOBAL_WINDOW_MS / 1000,
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil(GLOBAL_WINDOW_MS / 1000).toString(),
        },
      }
    );
  }

  // Check per-user limit (if userId provided)
  if (userId && !checkUserLimit(userId)) {
    return NextResponse.json(
      {
        error: 'Per-user rate limit exceeded',
        message: 'You are generating questions too quickly. Please wait a moment.',
        retryAfter: USER_WINDOW_MS / 1000,
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil(USER_WINDOW_MS / 1000).toString(),
        },
      }
    );
  }

  return null; // No limit exceeded
}

/**
 * Get rate limit status (for debugging/monitoring)
 */
export function getRateLimitStatus() {
  const globalEntry = globalStore.get('global');
  const now = Date.now();

  return {
    global: {
      current: globalEntry?.count || 0,
      limit: GLOBAL_LIMIT,
      window: `${GLOBAL_WINDOW_MS / 1000 / 60} minutes`,
      resetIn: globalEntry ? Math.max(0, globalEntry.resetTime - now) : 0,
    },
    users: globalStore.size - 1, // Exclude global entry
    lastCleanup: now,
  };
}

/**
 * Periodic cleanup task (run every 5 minutes)
 */
export function startRateLimitCleanup(): NodeJS.Timer {
  return setInterval(() => {
    cleanupRateLimitStore();
    console.debug('[RateLimit] Cleanup completed');
  }, 5 * 60 * 1000);
}
