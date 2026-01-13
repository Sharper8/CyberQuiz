export const GENERATION_PROMPT_VERSION = 'v1';

interface GenerationPromptArgs {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: 'multiple-choice' | 'true-false' | 'scenario';
}

export function buildGenerationPrompt(args: GenerationPromptArgs): string {
  const { topic, difficulty, questionType } = args;
<<<<<<< HEAD
  return `You are an expert cybersecurity instructor creating a ${questionType} question.\n
Topic: ${topic}\nDifficulty: ${difficulty}\n
Requirements:\n- Provide clear, unambiguous wording\n- Include exactly 4 options for multiple-choice, or True/False for true-false\n- Supply the correctAnswer key matching one of the options\n- Provide a concise but technically accurate explanation\n- Add relevant MITRE ATT&CK technique IDs if applicable\n- Return strict JSON only with fields: questionText, options, correctAnswer, explanation, mitreTechniques (array), tags (array), estimatedDifficulty (0-1)\n`;
=======
  return `Tu es un expert en cybersécurité créant une question de type ${questionType}.\n
Sujet: ${topic}\nDifficultté: ${difficulty}\n
Exigences:\n- Fournis un énoncé clair et sans ambiguïté EN FRANÇAIS\n- Inclus exactement 4 options pour les questions à choix multiples, ou Vrai/Faux pour les questions vrai-faux\n- La clé correctAnswer doit correspondre à une des options\n- Fournis une explication concise mais techniquement exacte EN FRANÇAIS\n- Ajoute les identifiants MITRE ATT&CK pertinents si applicable\n- Retourne uniquement du JSON valide avec les champs: questionText, options, correctAnswer, explanation, mitreTechniques (array), tags (array), estimatedDifficulty (0-1)\n`;
>>>>>>> zip-work
}
