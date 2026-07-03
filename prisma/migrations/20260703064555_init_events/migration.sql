-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "eventPlace" TEXT NOT NULL,
    "eventLocation" TEXT,
    "sys_created_by" TEXT,
    "sys_updated_by" TEXT,
    "sys_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sys_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventActivity" (
    "id" TEXT NOT NULL,
    "description" TEXT,
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
    "eventId" TEXT NOT NULL,
    "sys_created_by" TEXT,
    "sys_updated_by" TEXT,
    "sys_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sys_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventResponsibility" (
    "id" TEXT NOT NULL,
    "description" TEXT,
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
    "eventId" TEXT NOT NULL,
    "sys_created_by" TEXT,
    "sys_updated_by" TEXT,
    "sys_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sys_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventResponsibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_participants" (
    "id" TEXT NOT NULL,
    "eventActivityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Participant',
    "attendance" INTEGER,
    "payAsYouWish" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sys_created_by" TEXT,
    "sys_updated_by" TEXT,
    "sys_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sys_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventActivity_startDateTime_detachReason_idx" ON "EventActivity"("startDateTime", "detachReason");

-- CreateIndex
CREATE UNIQUE INDEX "EventActivity_recurrenceTemplateId_startDateTime_key" ON "EventActivity"("recurrenceTemplateId", "startDateTime");

-- CreateIndex
CREATE INDEX "EventResponsibility_startDateTime_detachReason_idx" ON "EventResponsibility"("startDateTime", "detachReason");

-- CreateIndex
CREATE INDEX "EventResponsibility_ownerId_idx" ON "EventResponsibility"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "EventResponsibility_recurrenceTemplateId_startDateTime_key" ON "EventResponsibility"("recurrenceTemplateId", "startDateTime");

-- CreateIndex
CREATE INDEX "event_participants_userId_idx" ON "event_participants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "event_participants_eventActivityId_userId_key" ON "event_participants"("eventActivityId", "userId");

-- AddForeignKey
ALTER TABLE "EventActivity" ADD CONSTRAINT "EventActivity_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventResponsibility" ADD CONSTRAINT "EventResponsibility_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_eventActivityId_fkey" FOREIGN KEY ("eventActivityId") REFERENCES "EventActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
