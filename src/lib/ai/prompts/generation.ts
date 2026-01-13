export const GENERATION_PROMPT_VERSION = 'v1';

interface GenerationPromptArgs {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: 'multiple-choice' | 'true-false' | 'scenario';
}

export function buildGenerationPrompt(args: GenerationPromptArgs): string {
  const { topic, difficulty, questionType } = args;
  return `Tu es un expert en cybersécurité créant une question de type ${questionType}.\n
Sujet: ${topic}\nDifficultté: ${difficulty}\n
Exigences:\n- Fournis un énoncé clair et sans ambiguïté EN FRANÇAIS\n- Inclus exactement 4 options pour les questions à choix multiples, ou Vrai/Faux pour les questions vrai-faux\n- La clé correctAnswer doit correspondre à une des options\n- Fournis une explication concise mais techniquement exacte EN FRANÇAIS\n- Ajoute les identifiants MITRE ATT&CK pertinents si applicable\n- Retourne uniquement du JSON valide avec les champs: questionText, options, correctAnswer, explanation, mitreTechniques (array), tags (array), estimatedDifficulty (0-1)\n`;
}
