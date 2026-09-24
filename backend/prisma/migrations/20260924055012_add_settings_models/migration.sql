-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "LeaveRule" (
    "id" TEXT NOT NULL,
    "leaveTypeCode" TEXT NOT NULL,
    "maxConsecutiveDays" INTEGER DEFAULT 30,
    "requiresAttachment" BOOLEAN NOT NULL DEFAULT false,
    "notifyDaysBefore" INTEGER DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficeHours" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isWorkDay" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OfficeHours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeaveRule_leaveTypeCode_key" ON "LeaveRule"("leaveTypeCode");

-- CreateIndex
CREATE UNIQUE INDEX "OfficeHours_dayOfWeek_key" ON "OfficeHours"("dayOfWeek");
