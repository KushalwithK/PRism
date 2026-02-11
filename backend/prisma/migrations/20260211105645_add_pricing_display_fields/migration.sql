-- AlterTable
ALTER TABLE "product_plans" ADD COLUMN     "badge" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT '₹',
ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "displayName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "features" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "highlighted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "period" TEXT,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;
