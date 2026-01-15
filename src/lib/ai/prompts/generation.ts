export const GENERATION_PROMPT_VERSION = 'v2_french';

interface GenerationPromptArgs {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: 'multiple-choice' | 'true-false' | 'scenario';
}

export function buildGenerationPrompt(args: GenerationPromptArgs): string {
  const { topic, difficulty, questionType } = args;
  return `Tu es un expert en cybersécurité créant une question de type ${questionType}.

Sujet: ${topic}
Difficulté: ${difficulty}

Critères de Qualité des questions:
- Variété: Questions couvrant des aspects différents du sujet (tactiques, stratégies, détection, prévention)
- Véracité: Informations techniquement correctes et actuelles
- Non-interprétable: Question sans ambiguïté, une seule réponse correcte possible

Exigences:
- Formule la question de manière claire et sans ambiguïté en FRANÇAIS
- Respecte les critères de qualité (Variété • Véracité • Non-interprétable)
- Pour true-false: fournis exactement 2 options (exemple: ["Vrai", "Faux"] ou ["OUI", "NON"])
- Pour multiple-choice: fournis exactement 4 options
- La clé correctAnswer doit correspondre exactement à l'une des options
- Fournis une explication concise mais techniquement précise en FRANÇAIS
- Ajoute les identifiants de techniques MITRE ATT&CK pertinentes si applicable
- Retourne UNIQUEMENT du JSON valide avec les champs: questionText, options, correctAnswer, explanation, mitreTechniques (array), tags (array), estimatedDifficulty (nombre entre 0-1)

Exemple JSON:
{
  "questionText": "Quelle est la première étape d'une attaque phishing?",
  "options": ["Reconnaissance", "Exploitation", "Post-exploitation", "Nettoyage des traces"],
  "correctAnswer": "Reconnaissance",
  "explanation": "La reconnaissance est la phase initiale...",
  "mitreTechniques": ["T1598"],
  "tags": ["phishing", "reconnaissance"],
  "estimatedDifficulty": 0.3
}

Réponds UNIQUEMENT avec du JSON valide, sans texte supplémentaire.`;
}
