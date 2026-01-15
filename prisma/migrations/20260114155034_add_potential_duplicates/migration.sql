-- Add potentialDuplicates column to store similarity data for admin review
ALTER TABLE "Question" ADD COLUMN "potentialDuplicates" JSONB;
