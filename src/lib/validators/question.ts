import { z } from 'zod';

export const GeneratedQuestionSchema = z.object({
  questionText: z.string().min(10),
  options: z.array(z.string()).min(2),
  correctAnswer: z.string(),
  explanation: z.string().min(10),
  mitreTechniques: z.array(z.string()).optional(),
  tags: z.array(z.string()),
  estimatedDifficulty: z.number().min(0).max(1)
});
export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;

export const ValidationResultSchema = z.object({
  qualityScore: z.number().min(0).max(1),
  factualAccuracy: z.number().min(0).max(1),
  clarityScore: z.number().min(0).max(1),
  issues: z.array(z.string()),
  recommendation: z.enum(['approve', 'review', 'reject'])
});
export type ValidationResult = z.infer<typeof ValidationResultSchema>;

export const QuestionCreateInputSchema = z.object({
  topic: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questionType: z.enum(['multiple-choice', 'true-false', 'scenario']),
  count: z.number().int().min(1).max(20)
});
export type QuestionCreateInput = z.infer<typeof QuestionCreateInputSchema>;
