-- AlterTable
ALTER TABLE "Responsibility" ADD COLUMN     "category" TEXT;

-- AlterTable
ALTER TABLE "participants" ADD COLUMN     "attendance" INTEGER NOT NULL DEFAULT 0;
