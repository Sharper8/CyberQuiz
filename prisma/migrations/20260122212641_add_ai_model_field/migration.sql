-- AlterTable
ALTER TABLE "GenerationSettings" ALTER COLUMN "defaultModel" SET DATA TYPE TEXT,
ALTER COLUMN "fallbackModel" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "aiModel" TEXT;

-- RenameIndex
ALTER INDEX "GenerationSlotHistory_slot_idx" RENAME TO "GenerationSlotHistory_domain_skillType_difficulty_granulari_idx";
