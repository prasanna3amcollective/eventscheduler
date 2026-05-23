-- AlterTable
ALTER TABLE "RecurrenceTemplate" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'General',
ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 60;
