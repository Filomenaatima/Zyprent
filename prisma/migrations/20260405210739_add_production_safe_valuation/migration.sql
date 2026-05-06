-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "marketValue" DOUBLE PRECISION,
ADD COLUMN     "valuationCapRate" DOUBLE PRECISION DEFAULT 0.1,
ADD COLUMN     "valuationUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "valuationUpdatedBy" TEXT;
