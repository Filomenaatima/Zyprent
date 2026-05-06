-- AlterTable
ALTER TABLE "MaintenanceRequest" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paidByUserId" TEXT,
ADD COLUMN     "paymentReference" TEXT,
ADD COLUMN     "propertyShare" DOUBLE PRECISION,
ADD COLUMN     "residentShare" DOUBLE PRECISION;
