/*
  Warnings:

  - Made the column `category` on table `Responsibility` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Responsibility" ADD COLUMN     "owner" TEXT,
ADD COLUMN     "state" TEXT NOT NULL DEFAULT 'Scheduled',
ALTER COLUMN "category" SET NOT NULL,
ALTER COLUMN "category" SET DEFAULT 'General';
