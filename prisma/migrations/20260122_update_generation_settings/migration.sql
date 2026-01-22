-- Update GenerationSettings table to support structured generation space
-- Rename and update fields

ALTER TABLE "GenerationSettings" DROP COLUMN IF EXISTS "targetPoolSize";
ALTER TABLE "GenerationSettings" DROP COLUMN IF EXISTS "autoGenerateEnabled";
ALTER TABLE "GenerationSettings" DROP COLUMN IF EXISTS "generationTopic";
ALTER TABLE "GenerationSettings" DROP COLUMN IF EXISTS "generationDifficulty";

ALTER TABLE "GenerationSettings" ADD COLUMN "bufferSize" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "GenerationSettings" ADD COLUMN "autoRefillEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "GenerationSettings" ADD COLUMN "structuredSpaceEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "GenerationSettings" ADD COLUMN "enabledDomains" JSONB NOT NULL DEFAULT '["Network Security", "Application Security", "Cloud Security", "Identity & Access", "Threat Intelligence", "Incident Response", "Cryptography", "Compliance & Governance"]';
ALTER TABLE "GenerationSettings" ADD COLUMN "enabledSkillTypes" JSONB NOT NULL DEFAULT '["Detection", "Prevention", "Analysis", "Configuration", "Best Practices"]';
ALTER TABLE "GenerationSettings" ADD COLUMN "enabledDifficulties" JSONB NOT NULL DEFAULT '["Beginner", "Intermediate", "Advanced", "Expert"]';
ALTER TABLE "GenerationSettings" ADD COLUMN "enabledGranularities" JSONB NOT NULL DEFAULT '["Conceptual", "Procedural", "Technical", "Strategic"]';
ALTER TABLE "GenerationSettings" ADD COLUMN "defaultModel" VARCHAR(255) NOT NULL DEFAULT 'ollama:mistral:7b';
ALTER TABLE "GenerationSettings" ADD COLUMN "fallbackModel" VARCHAR(255) NOT NULL DEFAULT 'ollama:mistral:7b';

-- Create GenerationSlotHistory table if it doesn't exist
CREATE TABLE IF NOT EXISTS "GenerationSlotHistory" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "domain" TEXT NOT NULL,
    "skillType" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "granularity" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "questionId" INTEGER
);

-- Create index for slot history lookups
CREATE INDEX "GenerationSlotHistory_usedAt_idx" ON "GenerationSlotHistory"("usedAt");
CREATE INDEX "GenerationSlotHistory_slot_idx" ON "GenerationSlotHistory"("domain", "skillType", "difficulty", "granularity");

-- Update Question table to add generation metadata
ALTER TABLE "Question" ADD COLUMN "generationDomain" TEXT;
ALTER TABLE "Question" ADD COLUMN "generationSkillType" TEXT;
ALTER TABLE "Question" ADD COLUMN "generationGranularity" TEXT;
