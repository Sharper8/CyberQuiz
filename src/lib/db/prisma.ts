import { PrismaClient } from '@prisma/client';

// Singleton Prisma client with basic query logging for observability
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ||
  new PrismaClient();

// Simplified client: removed event logging to avoid type issues with newer Prisma typings.

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

export default prisma;
