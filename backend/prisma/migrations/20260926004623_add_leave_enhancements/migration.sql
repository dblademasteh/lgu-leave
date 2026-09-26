-- AlterTable
ALTER TABLE "LeaveRequest" ADD COLUMN     "advanceNoticed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "decisionNote" TEXT,
ADD COLUMN     "deniedAt" TIMESTAMP(3),
ADD COLUMN     "deniedBy" TEXT,
ADD COLUMN     "documentUrl" TEXT,
ADD COLUMN     "isForced" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isLwop" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTerminal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "studyBondMonths" INTEGER;

-- AlterTable
ALTER TABLE "LeaveRule" ADD COLUMN     "accrualPerMonth" DOUBLE PRECISION,
ADD COLUMN     "effectiveFrom" DATE,
ADD COLUMN     "effectiveTo" DATE,
ADD COLUMN     "maxCarryOver" DOUBLE PRECISION;
