-- CreateIndex for questionHash and add DuplicateLog table
-- Add questionHash field to Question
ALTER TABLE "Question" ADD COLUMN "questionHash" TEXT;

-- Create index on questionHash
CREATE INDEX "Question_questionHash_idx" ON "Question"("questionHash");

-- Create DuplicateLog table
CREATE TABLE "DuplicateLog" (
    "id" SERIAL NOT NULL,
    "questionHash" TEXT NOT NULL,
    "originalQuestionId" INTEGER,
    "attemptedText" TEXT NOT NULL,
    "detectionMethod" TEXT NOT NULL,
    "similarityScore" DECIMAL(5,2),
    "topic" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DuplicateLog_pkey" PRIMARY KEY ("id")
);

-- Create indexes on DuplicateLog
CREATE INDEX "DuplicateLog_questionHash_idx" ON "DuplicateLog"("questionHash");
CREATE INDEX "DuplicateLog_createdAt_idx" ON "DuplicateLog"("createdAt");
CREATE INDEX "DuplicateLog_topic_idx" ON "DuplicateLog"("topic");
