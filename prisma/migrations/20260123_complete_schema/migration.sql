-- Complete missing schema columns

-- Ensure Question table has all required generation space columns
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "generationDomain" TEXT;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "generationSkillType" TEXT;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "generationGranularity" TEXT;

-- Ensure GenerationSettings has new default-model columns with proper defaults
ALTER TABLE "GenerationSettings" ADD COLUMN IF NOT EXISTS "bufferSize" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "GenerationSettings" ADD COLUMN IF NOT EXISTS "autoRefillEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "GenerationSettings" ADD COLUMN IF NOT EXISTS "structuredSpaceEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "GenerationSettings" ADD COLUMN IF NOT EXISTS "enabledDomains" TEXT[] DEFAULT '{}';
ALTER TABLE "GenerationSettings" ADD COLUMN IF NOT EXISTS "enabledSkillTypes" TEXT[] DEFAULT '{}';
ALTER TABLE "GenerationSettings" ADD COLUMN IF NOT EXISTS "enabledDifficulties" TEXT[] DEFAULT '{}';
ALTER TABLE "GenerationSettings" ADD COLUMN IF NOT EXISTS "enabledGranularities" TEXT[] DEFAULT '{}';
ALTER TABLE "GenerationSettings" ADD COLUMN IF NOT EXISTS "defaultModel" TEXT DEFAULT 'ollama:mistral:7b';
ALTER TABLE "GenerationSettings" ADD COLUMN IF NOT EXISTS "fallbackModel" TEXT DEFAULT 'ollama:mistral:7b';
