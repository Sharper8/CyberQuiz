import { prisma } from '../db/prisma';
import { AIProvider } from '../ai/providers/base';
import { logger } from '../logging/logger';

/**
 * Chat/Explain service
 * Generates AI explanations for quiz answers
 * Called after user requests explanation or at end of quiz
 */

interface ExplainRequest {
  sessionId: number;
  questionId: number;
  userAnswer: string;
  provider: AIProvider;
}

interface ExplainResponse {
  explanation: string;
  tips?: string[];
  relatedConcepts?: string[];
}

/**
 * Generate explanation for a quiz question answer
 * AI explains why the answer is correct/incorrect
 */
export async function explainAnswer(request: ExplainRequest): Promise<ExplainResponse> {
  const { sessionId, questionId, userAnswer, provider } = request;

  // Get question and session data
  const [question, session] = await Promise.all([
    prisma.question.findUnique({ where: { id: questionId } }),
    prisma.quizSession.findUnique({ where: { id: sessionId } }),
  ]);

  if (!question || !session) {
    throw new Error('Question or session not found');
  }

  const isCorrect = userAnswer === question.correctAnswer;
  const feedback = isCorrect
    ? `The user answered "${userAnswer}" which is CORRECT.`
    : `The user answered "${userAnswer}" but the correct answer is "${question.correctAnswer}".`;

  // Build explain prompt
  const explainPrompt = `
You are a cybersecurity expert educator. A user just answered a quiz question.

Question: "${question.questionText}"
Question Type: True/False
Category: ${question.category}
Difficulty: ${question.difficulty}
${feedback}

Provide a concise but thorough explanation:
1. Why the answer is correct/incorrect
2. Key concepts related to this topic
3. One practical tip for remembering this concept

Format your response as a JSON object with keys: explanation (string), tips (array of strings), relatedConcepts (array of strings)

Example JSON response:
{
  "explanation": "The answer is correct because...",
  "tips": ["Tip 1", "Tip 2"],
  "relatedConcepts": ["Concept A", "Concept B"]
}
`;

  try {
    // Call AI to generate explanation
    const response = await provider.generateQuestion({
      topic: question.category,
      difficulty: 'easy', // Explanations always simple to understand
      questionType: 'true-false',
      count: 1,
      additionalContext: explainPrompt,
    });

    // Extract and parse response (in real implementation, we'd have a dedicated explain method)
    // For now, treat as structured text and extract JSON
    let explanation = JSON.parse(response as any);

    // Ensure expected fields exist
    const result: ExplainResponse = {
      explanation: explanation.explanation || question.explanation,
      tips: explanation.tips || [],
      relatedConcepts: explanation.relatedConcepts || question.mitreTechniques || [],
    };

    logger.info('[Explain] Generated explanation for question', {
      sessionId,
      questionId,
      userAnswer,
      isCorrect,
      provider: provider.name,
    });

    return result;
  } catch (error) {
    logger.error('[Explain] Failed to generate explanation', {
      sessionId,
      questionId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Fallback to pre-generated explanation
    return {
      explanation: question.explanation,
      tips: [`Study category: ${question.category}`, 'Review MITRE techniques: ' + question.mitreTechniques.join(', ')],
      relatedConcepts: question.mitreTechniques,
    };
  }
}

/**
 * Get chat history for a session (future feature for multi-turn chat)
 */
export async function getChatHistory(sessionId: string): Promise<any[]> {
  // Placeholder for future chat history feature
  // Could store chat messages in a ChatMessage table
  return [];
}

/**
 * Save chat message to history
 */
export async function saveChatMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<void> {
  // Placeholder for future implementation
  logger.debug('[Chat] Saved message', {
    sessionId,
    role,
    contentLength: content.length,
  });
}
