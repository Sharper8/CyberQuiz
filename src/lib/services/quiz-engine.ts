import { prisma } from '../db/prisma';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Quiz session state management
 * Tracks warm-up phase, score, and question progression
 */

export interface QuizSessionState {
  sessionId: number;
  username: string;
  warmupComplete: boolean;
  score: number;
  questionsAnswered: number;
  currentQuestionId?: number;
  terminatedEarly: boolean;
}

/**
 * Initialize a quiz session with warm-up state
 */
export async function initializeQuizSession(username: string, topic = 'General', questionCount = 10): Promise<QuizSessionState> {
  const session = await prisma.quizSession.create({
    data: {
      username,
      topic,
      questionCount,
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
 * Fetch next question from database with progressive difficulty
 * Uses generationDifficulty to create a smooth progression curve:
 * - Questions 1-10: 70% Beginner, 25% Intermediate, 5% Advanced
 * - Questions 11-20: 60% Intermediate, 20% Beginner, 20% Advanced
 * - Questions 21-30: 60% Advanced, 30% Intermediate, 10% Expert
 * - Questions 31+: 50% Advanced, 40% Expert, 10% Intermediate
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
  const questionNumber = answeredIds.length + 1;

  // Determine difficulty distribution based on progression
  const difficultyWeights = getDifficultyWeightsForQuestion(questionNumber);
  
  // Pick a random difficulty level based on weights
  const selectedDifficulty = selectWeightedDifficulty(difficultyWeights);

  // Fetch question with selected difficulty
  let question;
  
  if (answeredIds.length > 0) {
    const questions = await prisma.$queryRaw<Array<{
      id: number;
      questionText: string;
      options: any;
      correctAnswer: string;
      difficulty: any;
      explanation: string;
    }>>`
      SELECT id, "questionText", options, "correctAnswer", difficulty, explanation
      FROM "Question"
      WHERE status = 'accepted'
        AND "isRejected" = false
        AND "questionType" = 'true-false'
        AND "generationDifficulty" = ${selectedDifficulty}
        AND id NOT IN (${Prisma.join(answeredIds)})
      ORDER BY RANDOM()
      LIMIT 1
    `;
    question = questions?.[0];
    
    // Fallback: if no question with this difficulty, try any difficulty
    if (!question) {
      const fallbackQuestions = await prisma.$queryRaw<Array<{
        id: number;
        questionText: string;
        options: any;
        correctAnswer: string;
        difficulty: any;
        explanation: string;
      }>>`
        SELECT id, "questionText", options, "correctAnswer", difficulty, explanation
        FROM "Question"
        WHERE status = 'accepted'
          AND "isRejected" = false
          AND "questionType" = 'true-false'
          AND id NOT IN (${Prisma.join(answeredIds)})
        ORDER BY RANDOM()
        LIMIT 1
      `;
      question = fallbackQuestions?.[0];
    }
  } else {
    // First question: always start with selected difficulty
    const questions = await prisma.$queryRaw<Array<{
      id: number;
      questionText: string;
      options: any;
      correctAnswer: string;
      difficulty: any;
      explanation: string;
    }>>`
      SELECT id, "questionText", options, "correctAnswer", difficulty, explanation
      FROM "Question"
      WHERE status = 'accepted'
        AND "isRejected" = false
        AND "questionType" = 'true-false'
        AND "generationDifficulty" = ${selectedDifficulty}
      ORDER BY RANDOM()
      LIMIT 1
    `;
    question = questions?.[0];
    
    // Fallback for first question too
    if (!question) {
      const fallbackQuestions = await prisma.$queryRaw<Array<{
        id: number;
        questionText: string;
        options: any;
        correctAnswer: string;
        difficulty: any;
        explanation: string;
      }>>`
        SELECT id, "questionText", options, "correctAnswer", difficulty, explanation
        FROM "Question"
        WHERE status = 'accepted'
          AND "isRejected" = false
          AND "questionType" = 'true-false'
        ORDER BY RANDOM()
        LIMIT 1
      `;
      question = fallbackQuestions?.[0];
    }
  }

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
 * Get difficulty weights based on question number
 * Returns percentages for each difficulty level
 */
function getDifficultyWeightsForQuestion(questionNumber: number): {
  Beginner: number;
  Intermediate: number;
  Advanced: number;
  Expert: number;
} {
  if (questionNumber <= 10) {
    return { Beginner: 70, Intermediate: 25, Advanced: 5, Expert: 0 };
  } else if (questionNumber <= 20) {
    return { Beginner: 20, Intermediate: 60, Advanced: 20, Expert: 0 };
  } else if (questionNumber <= 30) {
    return { Beginner: 0, Intermediate: 30, Advanced: 60, Expert: 10 };
  } else {
    return { Beginner: 0, Intermediate: 10, Advanced: 50, Expert: 40 };
  }
}

/**
 * Select a difficulty level based on weighted probabilities
 */
function selectWeightedDifficulty(weights: {
  Beginner: number;
  Intermediate: number;
  Advanced: number;
  Expert: number;
}): string {
  const rand = Math.random() * 100;
  let cumulative = 0;

  // Map English to French difficulty levels
  const difficultyMap: Record<string, string> = {
    'Beginner': 'Débutant',
    'Intermediate': 'Intermédiaire',
    'Advanced': 'Avancé',
    'Expert': 'Expert',
  };

  for (const [difficulty, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (rand < cumulative) {
      return difficultyMap[difficulty] || difficulty;
    }
  }

  // Fallback (should never reach here)
  return 'Intermédiaire';
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
  const questionsAnswered = session.sessionQuestions.length + 1; // Increment after this answer
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
      timeTaken: 0, // Will be populated by client timing if needed
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
    include: { sessionQuestions: { select: { questionId: true } } },
  });

  if (!session) throw new Error(`Session ${sessionId} not found`);

  const totalQuestions = session.sessionQuestions.length;
  const accuracyPercentage = totalQuestions > 0 ? (session.score / totalQuestions) * 100 : 0;

  // Create score record for leaderboard
  const score = await prisma.score.create({
    data: {
      sessionId: session.id,
      username: session.username,
      score: session.score,
      totalQuestions,
      accuracyPercentage: new Decimal(accuracyPercentage),
      topic: session.topic,
    },
  });

  return score.score;
}

/**
 * Cache next question answer on server side (for reconnection recovery)
 * Client can reconstruct quiz state if connection drops
 */
export async function cacheNextQuestion(sessionId: number, nextQuestionId?: number): Promise<void> {
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
export async function getSessionSummary(sessionId: number): Promise<QuizSessionState | null> {
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: { sessionQuestions: { select: { questionId: true } } },
  });

  if (!session) return null;

  return {
    sessionId: session.id,
    username: session.username,
    warmupComplete: session.warmupComplete,
    score: session.score,
    questionsAnswered: session.sessionQuestions.length,
    terminatedEarly: false, // Would need additional field to track this
  };
}
