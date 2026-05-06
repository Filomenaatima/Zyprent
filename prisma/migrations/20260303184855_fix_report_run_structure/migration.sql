/*
  Warnings:

  - Added the required column `type` to the `ReportRun` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "ReportType" ADD VALUE 'INVOICE_AGING';

-- DropForeignKey
ALTER TABLE "ReportRun" DROP CONSTRAINT "ReportRun_scheduleId_fkey";

-- AlterTable
ALTER TABLE "ReportRun" ADD COLUMN     "type" "ReportType" NOT NULL,
ALTER COLUMN "scheduleId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ReportRun" ADD CONSTRAINT "ReportRun_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ScheduledReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
