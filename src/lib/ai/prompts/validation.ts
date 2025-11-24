export const VALIDATION_PROMPT_VERSION = 'v1';

interface ValidationPromptArgs {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export function buildValidationPrompt(args: ValidationPromptArgs): string {
  const { questionText, options, correctAnswer, explanation } = args;
  return `You are a cybersecurity expert validating the quality of a quiz question.\nQuestion: ${questionText}\nOptions: ${options.join(' | ')}\nMarked Correct Answer: ${correctAnswer}\nExplanation: ${explanation}\n
Evaluate on a 0-1 scale: factualAccuracy, clarityScore, explanationQuality. Provide overall qualityScore (average, adjusted if any critical error) and issues array plus recommendation (approve | review | reject). Return strict JSON: { qualityScore, factualAccuracy, clarityScore, issues, recommendation }. Do not include any additional keys.`;
}
