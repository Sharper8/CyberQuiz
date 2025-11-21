import { PrismaClient } from '@prisma/client';

// Singleton Prisma client with basic query logging for observability
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' }
    ]
  });

prisma.$on('query', (e) => {
  if (process.env.LOG_QUERIES === 'true') {
    console.info('[prisma.query]', { query: e.query, params: e.params, durationMs: e.duration });
  }
});

prisma.$on('error', (e) => {
  console.error('[prisma.error]', e);
});

prisma.$on('warn', (e) => {
  console.warn('[prisma.warn]', e);
});

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

export default prisma;
