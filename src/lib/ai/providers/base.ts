// AI Provider interface definitions
// Version: 1.0.0

export interface QuestionGenerationParams {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: 'multiple-choice' | 'true-false' | 'scenario';
  count: number;
  additionalContext?: string;
}

export interface GeneratedQuestion {
  questionText: string;
  options: string[]; // For true/false provide ["True", "False"]
  correctAnswer: string; // Exact match of one option
  explanation: string;
  estimatedDifficulty: number; // 0-1
  mitreTechniques?: string[];
  tags: string[];
}

export interface ValidationResult {
  qualityScore: number; // 0-1
  factualAccuracy: number; // 0-1
  clarityScore: number; // 0-1
  issues: string[];
  recommendation: 'approve' | 'review' | 'reject';
}

export interface AIProvider {
  name: string;
  model: string;  // e.g., 'mistral:7b', 'gpt-4', etc
  generateQuestion(params: QuestionGenerationParams): Promise<GeneratedQuestion>;
  validateQuestion(question: GeneratedQuestion): Promise<ValidationResult>;
  generateEmbedding(text: string): Promise<number[]>;
  isAvailable(): Promise<boolean>;
}
