/**
 * Structured Generation Space - Entropy Control for Question Generation
 * 
 * This module implements a slot-based generation system that enforces diversity
 * by sampling from a controlled combination space of dimensions before calling the LLM.
 */

import { prisma } from '../db/prisma';

export interface GenerationSlot {
  domain: string;
  skillType: string;
  difficulty: string;
  granularity: string;
}

export interface GenerationSpaceConfig {
  enabled: boolean;
  enabledDomains: string[];
  enabledSkillTypes: string[];
  enabledDifficulties: string[];
  enabledGranularities: string[];
}

const SLOT_HISTORY_WINDOW_HOURS = 24; // Track recent slots for this many hours
const SLOT_HISTORY_LIMIT = 100; // Keep max 100 recent slots in memory

/**
 * Get current generation space configuration from database
 */
export async function getGenerationSpaceConfig(): Promise<GenerationSpaceConfig> {
  let settings = await prisma.generationSettings.findFirst();
  
  if (!settings) {
    // Create default settings if none exist
    settings = await prisma.generationSettings.create({
      data: {
        bufferSize: 10,
        autoRefillEnabled: true,
        structuredSpaceEnabled: false,
        enabledDomains: JSON.stringify([
          'Network Security',
          'Application Security',
          'Cloud Security',
          'Identity & Access',
          'Threat Intelligence',
          'Incident Response',
          'Cryptography',
          'Compliance & Governance'
        ]),
        enabledSkillTypes: JSON.stringify([
          'Detection',
          'Prevention',
          'Analysis',
          'Configuration',
          'Best Practices'
        ]),
        enabledDifficulties: JSON.stringify([
          'Beginner',
          'Intermediate',
          'Advanced',
          'Expert'
        ]),
        enabledGranularities: JSON.stringify([
          'Conceptual',
          'Procedural',
          'Technical',
          'Strategic'
        ]),
      },
    });
  }

  return {
    enabled: settings.structuredSpaceEnabled,
    enabledDomains: parseJsonArray(settings.enabledDomains),
    enabledSkillTypes: parseJsonArray(settings.enabledSkillTypes),
    enabledDifficulties: parseJsonArray(settings.enabledDifficulties),
    enabledGranularities: parseJsonArray(settings.enabledGranularities),
  };
}

/**
 * Select a generation slot with entropy control
 * Avoids recently used combinations to maximize diversity
 */
export async function selectGenerationSlot(): Promise<GenerationSlot> {
  const config = await getGenerationSpaceConfig();

  if (!config.enabled) {
    // Fallback to legacy mode - return a default slot
    return {
      domain: 'Cybersecurity',
      skillType: 'General',
      difficulty: 'Intermediate',
      granularity: 'Technical',
    };
  }

  // Get recently used slots to avoid repetition
  const recentSlots = await getRecentSlotHistory();
  const recentSlotSignatures = new Set(
    recentSlots.map(slot => `${slot.domain}|${slot.skillType}|${slot.difficulty}|${slot.granularity}`)
  );

  // Generate all possible combinations
  const allCombinations: GenerationSlot[] = [];
  for (const domain of config.enabledDomains) {
    for (const skillType of config.enabledSkillTypes) {
      for (const difficulty of config.enabledDifficulties) {
        for (const granularity of config.enabledGranularities) {
          allCombinations.push({ domain, skillType, difficulty, granularity });
        }
      }
    }
  }

  if (allCombinations.length === 0) {
    throw new Error('No enabled values in generation space - check configuration');
  }

  // Filter out recently used slots
  const availableSlots = allCombinations.filter(slot => {
    const signature = `${slot.domain}|${slot.skillType}|${slot.difficulty}|${slot.granularity}`;
    return !recentSlotSignatures.has(signature);
  });

  // If all slots were recently used, use all combinations (reset the cycle)
  const slotsToChooseFrom = availableSlots.length > 0 ? availableSlots : allCombinations;

  // Random selection from available slots
  const selectedSlot = slotsToChooseFrom[Math.floor(Math.random() * slotsToChooseFrom.length)];

  // Record this slot in history
  await recordSlotUsage(selectedSlot);

  return selectedSlot;
}

/**
 * Get recent slot history for entropy control
 */
async function getRecentSlotHistory(): Promise<GenerationSlot[]> {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - SLOT_HISTORY_WINDOW_HOURS);

  const history = await prisma.generationSlotHistory.findMany({
    where: {
      usedAt: { gte: cutoffDate },
    },
    orderBy: { usedAt: 'desc' },
    take: SLOT_HISTORY_LIMIT,
  });

  return history.map(h => ({
    domain: h.domain,
    skillType: h.skillType,
    difficulty: h.difficulty,
    granularity: h.granularity,
  }));
}

/**
 * Record a slot usage in history
 */
async function recordSlotUsage(slot: GenerationSlot, questionId?: number): Promise<void> {
  await prisma.generationSlotHistory.create({
    data: {
      domain: slot.domain,
      skillType: slot.skillType,
      difficulty: slot.difficulty,
      granularity: slot.granularity,
      questionId,
    },
  });

  // Cleanup old history (keep only recent)
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - (SLOT_HISTORY_WINDOW_HOURS * 2));
  await prisma.generationSlotHistory.deleteMany({
    where: { usedAt: { lt: cutoffDate } },
  });
}

/**
 * Update generation space configuration
 */
export async function updateGenerationSpaceConfig(config: Partial<GenerationSpaceConfig>): Promise<void> {
  const settings = await prisma.generationSettings.findFirst();
  
  if (!settings) {
    throw new Error('Generation settings not found');
  }

  await prisma.generationSettings.update({
    where: { id: settings.id },
    data: {
      structuredSpaceEnabled: config.enabled ?? settings.structuredSpaceEnabled,
      enabledDomains: config.enabledDomains ? JSON.stringify(config.enabledDomains) : settings.enabledDomains,
      enabledSkillTypes: config.enabledSkillTypes ? JSON.stringify(config.enabledSkillTypes) : settings.enabledSkillTypes,
      enabledDifficulties: config.enabledDifficulties ? JSON.stringify(config.enabledDifficulties) : settings.enabledDifficulties,
      enabledGranularities: config.enabledGranularities ? JSON.stringify(config.enabledGranularities) : settings.enabledGranularities,
    },
  });
}

/**
 * Helper to safely parse JSON array from database
 */
function parseJsonArray(jsonData: any): string[] {
  if (typeof jsonData === 'string') {
    try {
      return JSON.parse(jsonData);
    } catch {
      return [];
    }
  }
  if (Array.isArray(jsonData)) {
    return jsonData;
  }
  return [];
}

/**
 * Link a generated question to its slot for analytics
 */
export async function linkQuestionToSlot(questionId: number, slot: GenerationSlot): Promise<void> {
  // Update question with slot metadata
  await prisma.question.update({
    where: { id: questionId },
    data: {
      generationDomain: slot.domain,
      generationSkillType: slot.skillType,
      generationDifficulty: slot.difficulty,
      generationGranularity: slot.granularity,
      // Map difficulty to the legacy difficulty field
      difficulty: mapDifficultyToScore(slot.difficulty),
      category: slot.domain, // Use domain as category
    },
  });

  // Update the slot history record to link it to the question
  await prisma.generationSlotHistory.updateMany({
    where: {
      domain: slot.domain,
      skillType: slot.skillType,
      difficulty: slot.difficulty,
      granularity: slot.granularity,
      questionId: null,
    },
    data: { questionId },
  });
}

/**
 * Map textual difficulty to numeric score for legacy compatibility
 */
function mapDifficultyToScore(difficulty: string): number {
  const mapping: Record<string, number> = {
    'Beginner': 0.25,
    'Intermediate': 0.50,
    'Advanced': 0.75,
    'Expert': 0.95,
  };
  return mapping[difficulty] ?? 0.50;
}
