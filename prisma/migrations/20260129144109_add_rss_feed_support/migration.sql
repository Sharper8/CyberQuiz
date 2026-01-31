/*
  Warnings:

  - Made the column `defaultModel` on table `GenerationSettings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fallbackModel` on table `GenerationSettings` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "GenerationSettings" ADD COLUMN IF NOT EXISTS "rssEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "rssRefreshIntervalMin" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN IF NOT EXISTS "useRssAsContext" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "bufferSize" SET DEFAULT 10,
ALTER COLUMN "defaultModel" SET NOT NULL,
ALTER COLUMN "defaultModel" SET DEFAULT 'ollama:mistral:7b',
ALTER COLUMN "fallbackModel" SET NOT NULL,
ALTER COLUMN "fallbackModel" SET DEFAULT 'ollama:mistral:7b';

-- CreateTable
CREATE TABLE "RssSource" (
    "id" SERIAL NOT NULL,
    "settingsId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "refreshIntervalMin" INTEGER NOT NULL DEFAULT 60,
    "lastFetchedAt" TIMESTAMP(3),
    "lastFetchError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RssSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RssArticle" (
    "id" SERIAL NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "pubDate" TIMESTAMP(3),
    "guid" TEXT,
    "usedForQuestion" BOOLEAN NOT NULL DEFAULT false,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RssArticle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RssSource_enabled_idx" ON "RssSource"("enabled");

-- CreateIndex
CREATE INDEX "RssSource_lastFetchedAt_idx" ON "RssSource"("lastFetchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RssSource_settingsId_url_key" ON "RssSource"("settingsId", "url");

-- CreateIndex
CREATE INDEX "RssArticle_sourceId_usedForQuestion_idx" ON "RssArticle"("sourceId", "usedForQuestion");

-- CreateIndex
CREATE INDEX "RssArticle_pubDate_idx" ON "RssArticle"("pubDate");

-- CreateIndex
CREATE UNIQUE INDEX "RssArticle_sourceId_guid_key" ON "RssArticle"("sourceId", "guid");

-- AddForeignKey
ALTER TABLE "RssSource" ADD CONSTRAINT "RssSource_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "GenerationSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RssArticle" ADD CONSTRAINT "RssArticle_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "RssSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex (only if the old index exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'GenerationSlotHistory_slot_idx') THEN
        ALTER INDEX "GenerationSlotHistory_slot_idx" RENAME TO "GenerationSlotHistory_domain_skillType_difficulty_granulari_idx";
    END IF;
END
$$;
