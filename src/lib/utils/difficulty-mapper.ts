/**
 * Difficulty mapping utilities
 * Maps between numeric difficulty (0.0-1.0) and categorical levels
 */

export type AdminDifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

/**
 * Map numeric difficulty (0.0-1.0) to admin difficulty level
 * Used to pre-fill adminDifficulty when question is generated
 */
export function mapNumericToAdminDifficulty(numericDifficulty: number): AdminDifficultyLevel {
  if (numericDifficulty <= 0.25) return 'Beginner';
  if (numericDifficulty <= 0.50) return 'Intermediate';
  if (numericDifficulty <= 0.75) return 'Advanced';
  return 'Expert';
}

/**
 * Map admin difficulty level to numeric range (for analytics/filtering)
 * Returns the midpoint of the range
 */
export function mapAdminDifficultyToNumeric(adminDifficulty: AdminDifficultyLevel): number {
  switch (adminDifficulty) {
    case 'Beginner': return 0.125;
    case 'Intermediate': return 0.375;
    case 'Advanced': return 0.625;
    case 'Expert': return 0.875;
  }
}

/**
 * Get all difficulty levels in order
 */
export function getAllDifficultyLevels(): AdminDifficultyLevel[] {
  return ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
}

/**
 * Validate admin difficulty level
 */
export function isValidAdminDifficulty(value: string): value is AdminDifficultyLevel {
  return ['Beginner', 'Intermediate', 'Advanced', 'Expert'].includes(value);
}
