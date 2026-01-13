export const VALIDATION_PROMPT_VERSION = 'v1';

interface ValidationPromptArgs {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export function buildValidationPrompt(args: ValidationPromptArgs): string {
  const { questionText, options, correctAnswer, explanation } = args;
  return `Tu es un expert en cybersécurité validant la qualité d'une question de quiz.\nQuestion: ${questionText}\nOptions: ${options.join(' | ')}\nRéponse correcte marquée: ${correctAnswer}\nExplication: ${explanation}\n
Évalue sur une échelle de 0 à 1: factualAccuracy (exactitude), clarityScore (clarté), explanationQuality (qualité de l'explication). Fournis un qualityScore global (moyenne, ajusté s'il y a une erreur critique) et un array issues plus une recommandation (approve | review | reject). Retourne uniquement du JSON valide: { qualityScore, factualAccuracy, clarityScore, issues, recommendation }. N'inclus aucune clé supplémentaire.`;
}
