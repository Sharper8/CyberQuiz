import { prisma } from '../db/prisma';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Quiz session state management
 * Tracks warm-up phase, score, and question progression
 */

export interface QuizSessionState {
  sessionId: string;
  username: string;
  warmupComplete: boolean;
  score: number;
  questionsAnswered: number;
  currentQuestionId?: string;
  terminatedEarly: boolean;
}

/**
 * Initialize a quiz session with warm-up state
 */
export async function initializeQuizSession(username: string): Promise<QuizSessionState> {
  const session = await prisma.quizSession.create({
    data: {
      username,
      warmupComplete: false,
      score: 0,
    },
  });

  return {
    sessionId: session.id,
    username: session.username,
    warmupComplete: session.warmupComplete,
    score: session.score,
    questionsAnswered: 0,
    terminatedEarly: false,
  };
}

/**
 * Fetch next question from database (no generation during quiz)
 * During warm-up: fetch up to 5 questions in sequence
 * Post warm-up: randomly select from DB (avoiding already-answered questions)
 */
export async function getNextQuestion(
  sessionId: number
): Promise<{
  id: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
  difficulty: Decimal;
  explanation: string;
} | null> {
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: {
      sessionQuestions: {
        select: { questionId: true },
      },
    },
  });

  if (!session) throw new Error(`Session ${sessionId} not found`);

  const answeredIds = session.sessionQuestions.map((q) => q.questionId);

  // Fetch next question: random from DB, excluding already-answered
  const question = await prisma.question.findFirst({
    where: {
      status: 'accepted', // Only use questions admins have approved
      isRejected: false,
      id: {
        notIn: answeredIds,
      },
    },
    orderBy: {
      id: 'asc', // Deterministic ordering for consistency
    },
  });

  if (!question) {
    return null; // No more questions available
  }

  return {
    id: question.id,
    questionText: question.questionText,
    options: question.options as string[],
    correctAnswer: question.correctAnswer,
    difficulty: question.difficulty,
    explanation: question.explanation,
  };
}

/**
 * Record a user's answer and update quiz state
 * During warm-up: wrong answers add +0, correct answers add score based on difficulty
 * After warm-up: first wrong answer terminates session
 *
 * Returns:
 * - isCorrect: whether the answer was correct
 * - shouldTerminate: whether to end the quiz (true if first wrong post-warm-up)
 * - score: updated score
 */
export async function recordAnswer(
  sessionId: number,
  questionId: number,
  userAnswer: string
): Promise<{
  isCorrect: boolean;
  shouldTerminate: boolean;
  score: number;
  warmupComplete: boolean;
}> {
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: { sessionQuestions: { select: { questionId: true } } },
  });

  if (!session) throw new Error(`Session ${sessionId} not found`);

  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });

  if (!question) throw new Error(`Question ${questionId} not found`);

  const isCorrect = userAnswer === question.correctAnswer;
  const questionsAnswered = session.questions.length + 1; // Increment after this answer
  const isWarmupQuestion = questionsAnswered <= 5;
  let updatedScore = session.score;
  let shouldTerminate = false;
  let newWarmupComplete = session.warmupComplete;

  if (isCorrect) {
    // Calculate score based on difficulty (0-1 range normalized to 0-100)
    const difficultyScore = Math.round(Number(question.difficulty) * 100);
    updatedScore += difficultyScore;
  } else if (!isWarmupQuestion) {
    // First wrong answer after warm-up terminates session
    shouldTerminate = true;
  }

  // If warm-up just completed, mark it
  if (!session.warmupComplete && questionsAnswered === 5) {
    newWarmupComplete = true;
  }

  // Record response
  await prisma.responseHistory.create({
    data: {
      sessionId,
      questionId,
      userAnswer,
      isCorrect,
      timeSpentSeconds: 0, // Will be populated by client timing
    },
  });

  // Update session
  const updatedSession = await prisma.quizSession.update({
    where: { id: sessionId },
    data: {
      score: updatedScore,
      warmupComplete: newWarmupComplete,
    },
  });

  return {
    isCorrect,
    shouldTerminate,
    score: updatedSession.score,
    warmupComplete: newWarmupComplete,
  };
}

/**
 * Complete a quiz session and save to leaderboard
 */
export async function completeQuizSession(sessionId: number): Promise<number> {
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: { questions: { select: { questionId: true } } },
  });

  if (!session) throw new Error(`Session ${sessionId} not found`);

  // Create score record for leaderboard
  const score = await prisma.score.create({
    data: {
      sessionId: session.id,
      username: session.username,
      score: session.score,
    },
  });

  return score.score;
}

/**
 * Cache next question answer on server side (for reconnection recovery)
 * Client can reconstruct quiz state if connection drops
 */
export async function cacheNextQuestion(sessionId: string, nextQuestionId?: string): Promise<void> {
  // Store in Redis or in-memory cache (implementation depends on deployment model)
  // For now, just update session's currentQuestionId
  if (nextQuestionId) {
    await prisma.quizSession.update({
      where: { id: sessionId },
      data: {
        // Note: currentQuestionId field would need to be added to schema if caching required
        // For MVP, clients can refetch from API
      },
    });
  }
}

/**
 * Get quiz session summary
 */
export async function getSessionSummary(sessionId: string): Promise<QuizSessionState | null> {
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: { questions: { select: { questionId: true } } },
  });

  if (!session) return null;

  return {
    sessionId: session.id,
    username: session.username,
    warmupComplete: session.warmupComplete,
    score: session.score,
    questionsAnswered: session.questions.length,
    terminatedEarly: false, // Would need additional field to track this
  };
}
