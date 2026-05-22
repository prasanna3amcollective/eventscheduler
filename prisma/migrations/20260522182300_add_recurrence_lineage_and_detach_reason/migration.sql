-- CreateEnum
CREATE TYPE "DetachReason" AS ENUM ('none', 'edited', 'cancelled', 'rescheduled', 'manually_created');

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "recurrenceTemplateId" TEXT;
ALTER TABLE "Activity" ADD COLUMN     "generatedFromTemplateId" TEXT;
ALTER TABLE "Activity" ADD COLUMN     "detachReason" "DetachReason" NOT NULL DEFAULT 'none';

-- AlterTable
ALTER TABLE "Responsibility" ADD COLUMN     "recurrenceTemplateId" TEXT;
ALTER TABLE "Responsibility" ADD COLUMN     "generatedFromTemplateId" TEXT;
ALTER TABLE "Responsibility" ADD COLUMN     "detachReason" "DetachReason" NOT NULL DEFAULT 'none';

-- CreateIndex (unique constraints - will fail if duplicate (templateId, start) rows exist in data)
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_recurrenceTemplateId_startDateTime_key" UNIQUE ("recurrenceTemplateId", "startDateTime");
ALTER TABLE "Responsibility" ADD CONSTRAINT "Responsibility_recurrenceTemplateId_startDateTime_key" UNIQUE ("recurrenceTemplateId", "startDateTime");

-- AddForeignKey (self-relations for lineage)
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_recurrenceTemplateId_fkey" FOREIGN KEY ("recurrenceTemplateId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_generatedFromTemplateId_fkey" FOREIGN KEY ("generatedFromTemplateId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Responsibility" ADD CONSTRAINT "Responsibility_recurrenceTemplateId_fkey" FOREIGN KEY ("recurrenceTemplateId") REFERENCES "Responsibility"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Responsibility" ADD CONSTRAINT "Responsibility_generatedFromTemplateId_fkey" FOREIGN KEY ("generatedFromTemplateId") REFERENCES "Responsibility"("id") ON DELETE SET NULL ON UPDATE CASCADE;
