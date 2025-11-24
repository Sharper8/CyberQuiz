import { z } from 'zod';
import { prisma } from '../db/prisma';

// Profanity blocklist (minimal example; use dedicated library in production)
const PROFANITY_LIST = [
  'badword',
  'insult',
  'offensive',
  // Add more as needed; consider using `better-profanity` package
];

export const UsernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(32, 'Username must be at most 32 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
  .refine(
    (username) => !PROFANITY_LIST.some((word) => username.toLowerCase().includes(word)),
    'Username contains inappropriate language'
  );

export type Username = z.infer<typeof UsernameSchema>;

/**
 * Validates and checks username uniqueness for a quiz session
 * @param username The username to validate
 * @throws Error if validation fails
 */
export async function validateUsernameUnique(username: string): Promise<void> {
  UsernameSchema.parse(username);

  // Check uniqueness in active/recent quiz sessions (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const existing = await prisma.quizSession.findFirst({
    where: {
      username,
      createdAt: { gte: sevenDaysAgo },
    },
  });

  if (existing) {
    throw new Error(`Username "${username}" was recently used. Please choose a different one.`);
  }
}
