-- AlterTable
ALTER TABLE "Question" ADD COLUMN "adminDifficulty" TEXT;

-- CreateIndex
CREATE INDEX "Question_adminDifficulty_idx" ON "Question"("adminDifficulty");
