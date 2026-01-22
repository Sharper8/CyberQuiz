import crypto from 'crypto';

/**
 * Generate a normalized hash of a question text for duplicate detection
 * 
 * This function is used across the application to identify semantically
 * identical questions by normalizing the text and creating a SHA-256 hash.
 * 
 * @param questionText - The raw question text to hash
 * @returns A SHA-256 hash of the normalized question text
 * 
 * @example
 * const hash1 = generateQuestionHash("What is HTTPS?");
 * const hash2 = generateQuestionHash("what is https?");
 * // hash1 === hash2 (true)
 */
export function generateQuestionHash(questionText: string): string {
  const normalized = questionText
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return crypto.createHash('sha256').update(normalized).digest('hex');
}
