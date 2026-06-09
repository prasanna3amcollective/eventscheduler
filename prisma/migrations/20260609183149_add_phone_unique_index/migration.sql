/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "Activity_startDateTime_detachReason_idx" ON "Activity"("startDateTime", "detachReason");

-- CreateIndex
CREATE INDEX "Responsibility_startDateTime_detachReason_idx" ON "Responsibility"("startDateTime", "detachReason");

-- CreateIndex
CREATE INDEX "Responsibility_ownerId_idx" ON "Responsibility"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "participants_userId_idx" ON "participants"("userId");

-- CreateIndex
CREATE INDEX "role_group_m2m_groupId_idx" ON "role_group_m2m"("groupId");

-- CreateIndex
CREATE INDEX "sys_acl_roleId_table_operation_idx" ON "sys_acl"("roleId", "table", "operation");

-- CreateIndex
CREATE INDEX "user_group_m2m_groupId_idx" ON "user_group_m2m"("groupId");

-- CreateIndex
CREATE INDEX "user_role_roleId_idx" ON "user_role"("roleId");
