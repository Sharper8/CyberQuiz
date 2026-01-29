import { GenerationSlot } from '@/lib/services/generation-space';

export const GENERATION_PROMPT_VERSION = 'v3_structured_space';

interface GenerationPromptArgs {
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionType: 'multiple-choice' | 'true-false' | 'scenario';
  slot?: GenerationSlot; // Structured generation slot
}

export function buildGenerationPrompt(args: GenerationPromptArgs): string {
  const { questionType, slot } = args;

  // If slot is provided, use structured generation
  if (slot) {
    return buildStructuredGenerationPrompt(slot);
  }

  // Fallback to legacy generation for backwards compatibility
  const { topic = 'Cybersecurity', difficulty = 'medium' } = args;
  return buildLegacyGenerationPrompt({ topic, difficulty, questionType });
}

/**
 * New industrial-grade prompt for slot-based generation
 */
function buildStructuredGenerationPrompt(slot: GenerationSlot): string {
  return `You are an expert cybersecurity professional creating training questions for enterprise security teams.

GENERATION CONSTRAINTS (MUST BE STRICTLY FOLLOWED):
- Domain: ${slot.domain}
- Skill Type: ${slot.skillType}
- Difficulty Level: ${slot.difficulty}
- Knowledge Granularity: ${slot.granularity}
- Question Format: True/False ONLY

QUALITY REQUIREMENTS:
1. REALISM: Focus on real-world enterprise scenarios, not academic or introductory concepts
2. SPECIFICITY: Avoid generic or trivial statements (e.g., "Security is important")
3. TECHNICAL ACCURACY: All information must be current and technically correct
4. UNAMBIGUOUS: Must have exactly one objectively correct answer
5. PROFESSIONAL CONTEXT: Questions should reflect realistic situations security professionals face

GRANULARITY DEFINITIONS:
- Conceptual: High-level understanding, principles, frameworks
- Procedural: Step-by-step processes, workflows, methodologies
- Technical: Implementation details, configurations, technical mechanisms
- Strategic: Decision-making, risk assessment, business alignment

SKILL TYPE DEFINITIONS:
- Detection: Identifying threats, anomalies, incidents
- Prevention: Implementing controls, hardening, risk mitigation
- Analysis: Investigating, understanding attack patterns, root cause
- Configuration: Setting up systems, tools, security controls correctly
- Best Practices: Industry standards, compliance, recommended approaches

DIFFICULTY LEVELS:
- Beginner: Foundational concepts, common tools, basic principles
- Intermediate: Practical application, scenario-based, some technical depth
- Advanced: Complex scenarios, deep technical knowledge, edge cases
- Expert: Cutting-edge techniques, rare scenarios, highly specialized knowledge

OUTPUT FORMAT (JSON ONLY - NO ADDITIONAL TEXT):
{
  "questionText": "Clear, unambiguous statement in French",
  "options": ["Vrai", "Faux"],
  "correctAnswer": "Vrai" or "Faux",
  "explanation": "Concise technical explanation in French (2-3 sentences)",
  "metadata": {
    "domain": "${slot.domain}",
    "skillType": "${slot.skillType}",
    "difficulty": "${slot.difficulty}",
    "granularity": "${slot.granularity}"
  },
  "mitreTechniques": ["T1234"] // if applicable, else []
  "tags": ["relevant", "keywords"] // 2-4 relevant tags
}

CRITICAL: Return ONLY valid JSON. No markdown, no explanations, no commentary.

Generate ONE question that strictly matches ALL specified constraints.`;
}

/**
 * Legacy generation prompt for backwards compatibility
 */
function buildLegacyGenerationPrompt(args: { topic: string; difficulty: string; questionType: string }): string {
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
- Pour true-false: fournis exactement 2 options (exemple: ["Vrai", "Faux"])
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