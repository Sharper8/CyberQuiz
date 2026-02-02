import { GenerationSlot } from '@/lib/services/generation-space';

export const GENERATION_PROMPT_VERSION = 'v3_structured_space';

interface GenerationPromptArgs {
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionType: 'multiple-choice' | 'true-false' | 'scenario';
  slot?: GenerationSlot; // Structured generation slot
  additionalContext?: string;
}

export function buildGenerationPrompt(args: GenerationPromptArgs): string {
  const { questionType, slot, additionalContext } = args;

  // If slot is provided, use structured generation
  if (slot) {
    return buildStructuredGenerationPrompt(slot, additionalContext);
  }

  // Fallback to legacy generation for backwards compatibility
  const { topic = 'Cybersecurity', difficulty = 'medium' } = args;
  return buildLegacyGenerationPrompt({ topic, difficulty, questionType, additionalContext });
}

/**
 * New industrial-grade prompt for slot-based generation
 */
function buildStructuredGenerationPrompt(slot: GenerationSlot, additionalContext?: string): string {
  const contextBlock = additionalContext
    ? `\n\nCONTEXT FROM RECENT CYBERSECURITY ARTICLES (USE IF RELEVANT):\n${additionalContext}\n`
    : '';
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
6. LOGICAL CORRECTNESS: For True/False questions, the statement MUST be either factually true OR factually false. The correctAnswer ("Vrai" or "Faux") MUST correspond to the factual accuracy of the statement.

CRITICAL INSTRUCTION FOR TRUE/FALSE:
- If the statement is factually CORRECT, correctAnswer = "Vrai"
- If the statement is factually INCORRECT, correctAnswer = "Faux"
- The statement and answer must be logically aligned with reality and technical facts

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
- Beginner: VERY SIMPLE foundational concepts that a complete beginner can understand. Use simple language, avoid technical jargon, focus on well-known facts. Examples: "HTTPS encrypts web traffic", "Passwords should be longer than 8 characters", "Firewalls block unauthorized network access"
- Intermediate: Practical application, scenario-based, some technical depth. Requires basic security knowledge.
- Advanced: Complex scenarios, deep technical knowledge, edge cases. For experienced professionals.
- Expert: Cutting-edge techniques, rare scenarios, highly specialized knowledge. For security experts only.

CRITICAL FOR BEGINNER DIFFICULTY:
- Use SIMPLE everyday language (avoid: asymmetric encryption, key derivation, cipher suites)
- Focus on WELL-KNOWN concepts everyone has heard of (passwords, HTTPS, antivirus, firewalls)
- Ask about COMMON knowledge, not technical specifications
- Example BAD Beginner question: "AES uses keys up to 256 bits" (too technical)
- Example GOOD Beginner question: "Strong passwords should contain a mix of letters and numbers" (simple, practical)

OUTPUT FORMAT (JSON ONLY - NO ADDITIONAL TEXT):
{
  "questionText": "RSA is a symmetric encryption algorithm suitable for real-time communication.",
  "options": ["Vrai", "Faux"],
  "correctAnswer": "Faux",
  "explanation": "RSA is an asymmetric (public-key) encryption algorithm, not symmetric. Symmetric algorithms like AES are better suited for real-time communication due to their computational efficiency.",
  "metadata": {
    "domain": "${slot.domain}",
    "skillType": "${slot.skillType}",
    "difficulty": "${slot.difficulty}",
    "granularity": "${slot.granularity}"
  },
  "mitreTechniques": [] ,
  "tags": ["cryptography", "rsa", "asymmetric-encryption"]
}

CRITICAL: 
1. Return ONLY valid JSON. No markdown, no explanations, no commentary.
2. Ensure the correctAnswer logically matches the factual truth of the statement.
3. Generate ONE question that strictly matches ALL specified constraints.${contextBlock}`;
}

/**
 * Legacy generation prompt for backwards compatibility
 */
function buildLegacyGenerationPrompt(args: { topic: string; difficulty: string; questionType: string; additionalContext?: string }): string {
  const { topic, difficulty, questionType, additionalContext } = args;
  const contextBlock = additionalContext
    ? `\n\nContexte issu d'articles récents (utilise-le si pertinent):\n${additionalContext}\n`
    : '';
  
  // Choose the right example based on question type
  const exampleJson = questionType === 'true-false' 
    ? `{
  "questionText": "AES-256 est un algorithme de chiffrement symétrique qui utilise des clés de 256 bits.",
  "options": ["Vrai", "Faux"],
  "correctAnswer": "Vrai",
  "explanation": "AES-256 est effectivement un algorithme de chiffrement symétrique utilisant des clés de 256 bits, offrant un haut niveau de sécurité pour les données sensibles.",
  "mitreTechniques": [],
  "tags": ["cryptographie", "aes", "chiffrement"],
  "estimatedDifficulty": 0.4
}`
    : `{
  "questionText": "Quelle est la première étape d'une attaque phishing?",
  "options": ["Reconnaissance", "Exploitation", "Post-exploitation", "Nettoyage des traces"],
  "correctAnswer": "Reconnaissance",
  "explanation": "La reconnaissance est la phase initiale...",
  "mitreTechniques": ["T1598"],
  "tags": ["phishing", "reconnaissance"],
  "estimatedDifficulty": 0.3
}`;

  return `Tu es un expert en cybersécurité créant une question de type ${questionType}.

Sujet: ${topic}
Difficulté: ${difficulty}

Critères de Qualité des questions:
- Variété: Questions couvrant des aspects différents du sujet (tactiques, stratégies, détection, prévention)
- Véracité: Informations techniquement correctes et actuelles
- Non-interprétable: Question sans ambiguïté, une seule réponse correcte possible

INSTRUCTIONS CRITIQUES:
- Pour les questions True/False: L'énoncé DOIT être une affirmation claire. La correctAnswer ("Vrai" ou "Faux") DOIT correspondre exactement à la véracité factuelle de cette affirmation.
- Exemple correct: Question="Les mots de passe de 8 caractères offrent une sécurité suffisante", Réponse="Faux" (car c'est factuellement incorrect)
- Exemple correct: Question="Le chiffrement AES-256 utilise des clés de 256 bits", Réponse="Vrai" (car c'est factuellement exact)

Exigences:
- Formule la question de manière claire et sans ambiguïté en FRANÇAIS
- Respecte les critères de qualité (Variété • Véracité • Non-interprétable)
- Pour true-false: fournis exactement 2 options ["Vrai", "Faux"]
- Pour multiple-choice: fournis exactement 4 options
- La clé correctAnswer doit correspondre exactement à l'une des options
- Fournis une explication concise mais techniquement précise en FRANÇAIS
- Ajoute les identifiants de techniques MITRE ATT&CK pertinentes si applicable
- Retourne UNIQUEMENT du JSON valide avec les champs: questionText, options, correctAnswer, explanation, mitreTechniques (array), tags (array), estimatedDifficulty (nombre entre 0-1)

Exemple JSON pour ${questionType}:
${exampleJson}

Réponds UNIQUEMENT avec du JSON valide, sans texte supplémentaire.${contextBlock}`;
}