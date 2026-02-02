/**
 * Difficulty mapping utilities
 * Maps between numeric difficulty (0.0-1.0) and categorical levels
 */

export type AdminDifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

/**
 * Map numeric difficulty (0.0-1.0) to admin difficulty level
 * Used to pre-fill adminDifficulty when question is generated
 * Adjusted thresholds to match AI generation patterns (most questions are 0.4-0.7)
 */
export function mapNumericToAdminDifficulty(numericDifficulty: number): AdminDifficultyLevel {
  if (numericDifficulty <= 0.35) return 'Beginner';
  if (numericDifficulty <= 0.60) return 'Intermediate';
  if (numericDifficulty <= 0.80) return 'Advanced';
  return 'Expert';
}

/**
 * Map admin difficulty level to numeric range (for analytics/filtering)
 * Returns the midpoint of the range
 */
export function mapAdminDifficultyToNumeric(adminDifficulty: AdminDifficultyLevel): number {
  switch (adminDifficulty) {
    case 'Beginner': return 0.175;      // midpoint of 0.0-0.35
    case 'Intermediate': return 0.475;  // midpoint of 0.35-0.60
    case 'Advanced': return 0.700;      // midpoint of 0.60-0.80
    case 'Expert': return 0.900;        // midpoint of 0.80-1.0
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
