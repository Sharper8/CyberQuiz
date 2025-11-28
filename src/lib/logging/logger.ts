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

// File logging disabled in containerized production (use Docker logs instead)
// In non-containerized environments, file logging can be re-enabled via ENABLE_FILE_LOGS=true
const enableFileLogs = process.env.ENABLE_FILE_LOGS === 'true' && NODE_ENV !== 'production';

if (enableFileLogs) {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format,
    }),
    new winston.transports.File({
      filename: 'logs/audit.log',
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json()
      ),
    })
  );
}

// Exception and rejection handlers also use file logging only when enabled
const exceptionHandlers: winston.transport[] = [
  new winston.transports.Console({ format }),
];

const rejectionHandlers: winston.transport[] = [
  new winston.transports.Console({ format }),
];

if (enableFileLogs) {
  exceptionHandlers.push(
    new winston.transports.File({
      filename: 'logs/exceptions.log',
      format,
    })
  );
  rejectionHandlers.push(
    new winston.transports.File({
      filename: 'logs/rejections.log',
      format,
    })
  );
}

export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format,
  defaultMeta: { service: 'cyber-quiz' },
  transports,
  exceptionHandlers,
  rejectionHandlers,
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
