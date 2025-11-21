export const GENERATION_PROMPT_VERSION = 'v1';

interface GenerationPromptArgs {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: 'multiple-choice' | 'true-false' | 'scenario';
}

export function buildGenerationPrompt(args: GenerationPromptArgs): string {
  const { topic, difficulty, questionType } = args;
  return `You are an expert cybersecurity instructor creating a ${questionType} question.\n
Topic: ${topic}\nDifficulty: ${difficulty}\n
Requirements:\n- Provide clear, unambiguous wording\n- Include exactly 4 options for multiple-choice, or True/False for true-false\n- Supply the correctAnswer key matching one of the options\n- Provide a concise but technically accurate explanation\n- Add relevant MITRE ATT&CK technique IDs if applicable\n- Return strict JSON only with fields: questionText, options, correctAnswer, explanation, mitreTechniques (array), tags (array), estimatedDifficulty (0-1)\n`;
}
