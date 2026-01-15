-- CreateTable
CREATE TABLE "GenerationSettings" (
    "id" SERIAL NOT NULL,
    "targetPoolSize" INTEGER NOT NULL DEFAULT 50,
    "autoGenerateEnabled" BOOLEAN NOT NULL DEFAULT true,
    "generationTopic" TEXT NOT NULL DEFAULT 'Cybersecurity',
    "generationDifficulty" TEXT NOT NULL DEFAULT 'medium',
    "maxConcurrentGeneration" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GenerationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BannedWord" (
    "id" SERIAL NOT NULL,
    "word" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "BannedWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationLog" (
    "id" SERIAL NOT NULL,
    "settingsId" INTEGER NOT NULL,
    "topic" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "batchSize" INTEGER NOT NULL,
    "generatedCount" INTEGER NOT NULL,
    "savedCount" INTEGER NOT NULL,
    "failedCount" INTEGER NOT NULL,
    "poolSizeBeforeGen" INTEGER NOT NULL,
    "poolSizeAfterGen" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "GenerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BannedWord_word_key" ON "BannedWord"("word");

-- CreateIndex
CREATE INDEX "BannedWord_word_idx" ON "BannedWord"("word");

-- AddForeignKey
ALTER TABLE "GenerationLog" ADD CONSTRAINT "GenerationLog_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "GenerationSettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
