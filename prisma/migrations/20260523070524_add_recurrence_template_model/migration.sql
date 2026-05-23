-- CreateEnum
CREATE TYPE "RecurrenceTemplateType" AS ENUM ('activity', 'responsibility');

-- CreateEnum
CREATE TYPE "RecurrenceStatus" AS ENUM ('active', 'archived', 'draft');

-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_generatedFromTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_recurrenceTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "Responsibility" DROP CONSTRAINT "Responsibility_generatedFromTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "Responsibility" DROP CONSTRAINT "Responsibility_recurrenceTemplateId_fkey";

-- CreateTable
CREATE TABLE "RecurrenceTemplate" (
    "id" TEXT NOT NULL,
    "templateType" "RecurrenceTemplateType" NOT NULL DEFAULT 'activity',
    "name" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "recurrenceRule" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "excludeDates" TIMESTAMP(3)[] DEFAULT ARRAY[]::TIMESTAMP(3)[],
    "lastGeneratedAt" TIMESTAMP(3),
    "generatedUntil" TIMESTAMP(3),
    "versionSeriesId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "RecurrenceStatus" NOT NULL DEFAULT 'active',
    "sys_created_by" TEXT,
    "sys_updated_by" TEXT,
    "sys_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sys_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurrenceTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurrenceTemplate_templateType_versionSeriesId_status_idx" ON "RecurrenceTemplate"("templateType", "versionSeriesId", "status");

-- CreateIndex
CREATE INDEX "RecurrenceTemplate_templateType_generatedUntil_status_idx" ON "RecurrenceTemplate"("templateType", "generatedUntil", "status");

-- CreateIndex
CREATE INDEX "RecurrenceTemplate_templateType_startDate_endDate_idx" ON "RecurrenceTemplate"("templateType", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "RecurrenceTemplate_sys_created_at_idx" ON "RecurrenceTemplate"("sys_created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "RecurrenceTemplate_versionSeriesId_version_key" ON "RecurrenceTemplate"("versionSeriesId", "version");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_recurrenceTemplateId_fkey" FOREIGN KEY ("recurrenceTemplateId") REFERENCES "RecurrenceTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_generatedFromTemplateId_fkey" FOREIGN KEY ("generatedFromTemplateId") REFERENCES "RecurrenceTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responsibility" ADD CONSTRAINT "Responsibility_recurrenceTemplateId_fkey" FOREIGN KEY ("recurrenceTemplateId") REFERENCES "RecurrenceTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responsibility" ADD CONSTRAINT "Responsibility_generatedFromTemplateId_fkey" FOREIGN KEY ("generatedFromTemplateId") REFERENCES "RecurrenceTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
