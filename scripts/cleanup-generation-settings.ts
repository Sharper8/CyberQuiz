/**
 * Cleanup duplicate English/French values in GenerationSettings
 * Removes English duplicates and keeps only French values
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TRANSLATION_MAP: Record<string, string> = {
  // Domains
  'Network Security': 'Sécurité Réseau',
  'Application Security': 'Sécurité Applicative',
  'Cloud Security': 'Sécurité Cloud',
  'Identity & Access': 'Identité & Accès',
  'Threat Intelligence': 'Renseignement sur les Menaces',
  'Incident Response': 'Réponse aux Incidents',
  'Cryptography': 'Cryptographie',
  'Compliance & Governance': 'Conformité & Gouvernance',
  // Skill Types
  'Detection': 'Détection',
  'Prevention': 'Prévention',
  'Analysis': 'Analyse',
  'Configuration': 'Configuration',
  'Best Practices': 'Bonnes Pratiques',
  // Difficulties
  'Beginner': 'Débutant',
  'Intermediate': 'Intermédiaire',
  'Advanced': 'Avancé',
  'Expert': 'Expert',
  // Granularities
  'Conceptual': 'Conceptuel',
  'Procedural': 'Procédural',
  'Technical': 'Technique',
  'Strategic': 'Stratégique',
};

function deduplicateAndTranslate(values: string[]): string[] {
  const uniqueSet = new Set<string>();
  
  for (const value of values) {
    // If it's an English value that has a French translation, use the French one
    const translated = TRANSLATION_MAP[value] || value;
    uniqueSet.add(translated);
  }
  
  return Array.from(uniqueSet);
}

async function cleanupGenerationSettings() {
  console.log('🔧 Cleaning up GenerationSettings...\n');
  
  try {
    const settings = await prisma.generationSettings.findFirst();
    
    if (!settings) {
      console.log('❌ No GenerationSettings found');
      return;
    }
    
    console.log('📊 Current state:');
    console.log(`   Domains: ${(settings.enabledDomains as any).length} values`);
    console.log(`   SkillTypes: ${(settings.enabledSkillTypes as any).length} values`);
    console.log(`   Difficulties: ${(settings.enabledDifficulties as any).length} values`);
    console.log(`   Granularities: ${(settings.enabledGranularities as any).length} values\n`);
    
    // Parse JSON values if they're stored as strings
    const parseJsonField = (field: any): string[] => {
      if (typeof field === 'string') {
        return JSON.parse(field);
      }
      return field || [];
    };
    
    const currentDomains = parseJsonField(settings.enabledDomains);
    const currentSkillTypes = parseJsonField(settings.enabledSkillTypes);
    const currentDifficulties = parseJsonField(settings.enabledDifficulties);
    const currentGranularities = parseJsonField(settings.enabledGranularities);
    
    // Deduplicate and translate
    const cleanedDomains = deduplicateAndTranslate(currentDomains);
    const cleanedSkillTypes = deduplicateAndTranslate(currentSkillTypes);
    const cleanedDifficulties = deduplicateAndTranslate(currentDifficulties);
    const cleanedGranularities = deduplicateAndTranslate(currentGranularities);
    
    console.log('🧹 Cleaned state:');
    console.log(`   Domains: ${cleanedDomains.length} values`);
    console.log(`   SkillTypes: ${cleanedSkillTypes.length} values`);
    console.log(`   Difficulties: ${cleanedDifficulties.length} values`);
    console.log(`   Granularities: ${cleanedGranularities.length} values\n`);
    
    // Update the database using raw SQL to handle JSON properly
    await prisma.$executeRaw`
      UPDATE "GenerationSettings"
      SET 
        "enabledDomains" = ${JSON.stringify(cleanedDomains)}::jsonb,
        "enabledSkillTypes" = ${JSON.stringify(cleanedSkillTypes)}::jsonb,
        "enabledDifficulties" = ${JSON.stringify(cleanedDifficulties)}::jsonb,
        "enabledGranularities" = ${JSON.stringify(cleanedGranularities)}::jsonb
      WHERE id = ${settings.id}
    `;
    
    console.log('✅ GenerationSettings cleaned successfully!\n');
    console.log('📋 Final values:');
    console.log('   Domains:', cleanedDomains);
    console.log('   SkillTypes:', cleanedSkillTypes);
    console.log('   Difficulties:', cleanedDifficulties);
    console.log('   Granularities:', cleanedGranularities);
    
  } catch (error) {
    console.error('❌ Error cleaning up:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupGenerationSettings()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
