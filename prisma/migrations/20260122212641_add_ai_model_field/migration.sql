-- AlterTable
ALTER TABLE "GenerationSettings" ADD COLUMN     "bufferSize" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "autoRefillEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "structuredSpaceEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enabledDomains" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "enabledSkillTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "enabledDifficulties" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "enabledGranularities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "defaultModel" TEXT DEFAULT 'mistral:7b',
ADD COLUMN     "fallbackModel" TEXT DEFAULT 'mistral:7b';

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "aiModel" TEXT;
