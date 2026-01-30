-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "rssArticleId" INTEGER,
ADD COLUMN     "rssSourceId" INTEGER;

-- CreateIndex
CREATE INDEX "Question_rssSourceId_idx" ON "Question"("rssSourceId");

-- CreateIndex
CREATE INDEX "Question_rssArticleId_idx" ON "Question"("rssArticleId");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_rssSourceId_fkey" FOREIGN KEY ("rssSourceId") REFERENCES "RssSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_rssArticleId_fkey" FOREIGN KEY ("rssArticleId") REFERENCES "RssArticle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
