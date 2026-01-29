/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `QuizSession` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "QuizSession_username_key" ON "QuizSession"("username");
