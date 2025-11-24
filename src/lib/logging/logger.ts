import winston from 'winston';

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Structured logging with Winston
 * All logs include context for audit trail
 * File logs for production, console for development
 */

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: NODE_ENV === 'production' ? format : winston.format.simple(),
  }),
];

// File logging for production and important events
if (NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format,
    })
  );
}

// Audit trail log for admin actions
transports.push(
  new winston.transports.File({
    filename: 'logs/audit.log',
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.json()
    ),
  })
);

export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format,
  defaultMeta: { service: 'cyber-quiz' },
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: 'logs/exceptions.log',
      format,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: 'logs/rejections.log',
      format,
    }),
  ],
});

/**
 * Log helper for generation events
 */
export function logGeneration(
  questionId: string,
  provider: string,
  topic: string,
  isDuplicate: boolean = false,
  duplicateSimilarity?: number
): void {
  logger.info('[Generation]', {
    questionId,
    provider,
    topic,
    isDuplicate,
    duplicateSimilarity,
    timestamp: new Date(),
  });
}

/**
 * Log helper for admin review events
 */
export function logAdminReview(
  adminId: string,
  action: 'accept' | 'reject',
  questionId: string,
  reason?: string
): void {
  logger.info('[AdminReview]', {
    adminId,
    action,
    questionId,
    reason,
    timestamp: new Date(),
  });
}

/**
 * Log helper for quiz completion
 */
export function logQuizCompletion(
  username: string,
  sessionId: string,
  score: number,
  questionsAnswered: number
): void {
  logger.info('[QuizCompletion]', {
    username,
    sessionId,
    score,
    questionsAnswered,
    timestamp: new Date(),
  });
}

/**
 * Log helper for authentication events
 */
export function logAuthEvent(
  event: 'login' | 'logout' | 'failed-login',
  username: string,
  details?: Record<string, any>
): void {
  logger.info('[Auth]', {
    event,
    username,
    ...details,
    timestamp: new Date(),
  });
}
