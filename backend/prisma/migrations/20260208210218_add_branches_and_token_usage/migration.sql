-- AlterTable
ALTER TABLE "generations" ADD COLUMN     "baseBranch" TEXT,
ADD COLUMN     "compareBranch" TEXT,
ADD COLUMN     "completionTokens" INTEGER,
ADD COLUMN     "promptTokens" INTEGER,
ADD COLUMN     "totalTokens" INTEGER;
