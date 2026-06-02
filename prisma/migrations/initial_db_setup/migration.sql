-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "DetachReason" AS ENUM ('none', 'edited', 'cancelled', 'rescheduled', 'manually_created');

-- CreateEnum
CREATE TYPE "RecurrenceTemplateType" AS ENUM ('activity', 'responsibility');

-- CreateEnum
CREATE TYPE "RecurrenceStatus" AS ENUM ('active', 'archived', 'draft');

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "recurrenceTemplateId" TEXT,
    "generatedFromTemplateId" TEXT,
    "detachReason" "DetachReason" NOT NULL DEFAULT 'none',
    "category" TEXT NOT NULL DEFAULT 'General',
    "state" TEXT NOT NULL DEFAULT 'Scheduled',
    "sys_created_by" TEXT,
    "sys_updated_by" TEXT,
    "sys_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sys_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Responsibility" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "recurrenceTemplateId" TEXT,
    "generatedFromTemplateId" TEXT,
    "detachReason" "DetachReason" NOT NULL DEFAULT 'none',
    "category" TEXT NOT NULL DEFAULT 'General',
    "state" TEXT NOT NULL DEFAULT 'Scheduled',
    "owner" TEXT,
    "ownerId" TEXT,
    "sys_created_by" TEXT,
    "sys_updated_by" TEXT,
    "sys_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sys_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Responsibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participants" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Participant',
    "attendance" INTEGER NOT NULL DEFAULT 0,
    "payAsYouWish" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sys_created_by" TEXT,
    "sys_updated_by" TEXT,
    "sys_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sys_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sys_created_by" TEXT,
    "sys_updated_by" TEXT,
    "sys_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sys_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sys_created_by" TEXT,
    "sys_updated_by" TEXT,
    "sys_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sys_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_group_m2m" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "sys_created_by" TEXT,
    "sys_updated_by" TEXT,
    "sys_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sys_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_group_m2m_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sys_created_by" TEXT,
    "sys_updated_by" TEXT,
    "sys_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sys_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "sys_created_by" TEXT,
    "sys_updated_by" TEXT,
    "sys_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sys_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_group_m2m" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "sys_created_by" TEXT,
    "sys_updated_by" TEXT,
    "sys_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sys_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_group_m2m_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_acl" (
    "id" TEXT NOT NULL,
    "table" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "description" TEXT,
    "sys_created_by" TEXT,
    "sys_updated_by" TEXT,
    "sys_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sys_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sys_acl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurrenceTemplate" (
    "id" TEXT NOT NULL,
    "templateType" "RecurrenceTemplateType" NOT NULL DEFAULT 'activity',
    "name" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "category" TEXT NOT NULL DEFAULT 'General',
    "recurrenceRule" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
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
CREATE UNIQUE INDEX "Activity_recurrenceTemplateId_startDateTime_key" ON "Activity"("recurrenceTemplateId", "startDateTime");

-- CreateIndex
CREATE UNIQUE INDEX "Responsibility_recurrenceTemplateId_startDateTime_key" ON "Responsibility"("recurrenceTemplateId", "startDateTime");

-- CreateIndex
CREATE UNIQUE INDEX "participants_activityId_userId_key" ON "participants"("activityId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_name_idx" ON "User"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_group_m2m_userId_groupId_key" ON "user_group_m2m"("userId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_userId_roleId_key" ON "user_role"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "role_group_m2m_roleId_groupId_key" ON "role_group_m2m"("roleId", "groupId");

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

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_group_m2m" ADD CONSTRAINT "user_group_m2m_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_group_m2m" ADD CONSTRAINT "user_group_m2m_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_group_m2m" ADD CONSTRAINT "role_group_m2m_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_group_m2m" ADD CONSTRAINT "role_group_m2m_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_acl" ADD CONSTRAINT "sys_acl_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
