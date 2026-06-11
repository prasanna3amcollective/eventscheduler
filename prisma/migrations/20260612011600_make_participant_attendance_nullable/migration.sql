-- AlterTable
ALTER TABLE "participants" ALTER COLUMN "attendance" DROP DEFAULT;
ALTER TABLE "participants" ALTER COLUMN "attendance" DROP NOT NULL;
