/*
  Warnings:

  - You are about to drop the column `assignedTo` on the `MaintenanceRequest` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ServiceProviderType" AS ENUM ('PLUMBER', 'ELECTRICIAN', 'HVAC_TECHNICIAN', 'APPLIANCE_REPAIR', 'CARPENTER', 'LOCKSMITH', 'ROOFER', 'PAINTER', 'FLOORING_SPECIALIST', 'TILER', 'CLEANER', 'HOUSEKEEPER', 'LAUNDRY_SERVICE', 'HOME_ORGANIZER', 'LANDSCAPER', 'GARDENER', 'TREE_SURGEON', 'POOL_TECHNICIAN', 'PEST_CONTROL', 'SECURITY_INSTALLER', 'CCTV_TECHNICIAN', 'INTERNET_TECHNICIAN', 'INTERIOR_DESIGNER', 'FURNITURE_SPECIALIST', 'CURTAIN_INSTALLER', 'MOVING_SERVICE', 'DELIVERY_SERVICE', 'CHEF', 'CATERING_SERVICE', 'GENERAL_CONTRACTOR');

-- CreateEnum
CREATE TYPE "MaintenanceCategory" AS ENUM ('PLUMBING', 'ELECTRICAL', 'HVAC', 'APPLIANCE', 'CARPENTRY', 'LOCKS', 'ROOFING', 'FLOORING', 'PAINTING', 'CLEANING', 'HOUSEKEEPING', 'LAUNDRY', 'LANDSCAPING', 'POOL', 'PEST_CONTROL', 'SECURITY', 'INTERNET', 'INTERIOR', 'FURNITURE', 'GENERAL');

-- CreateEnum
CREATE TYPE "MaintenancePaymentResponsibility" AS ENUM ('PROPERTY', 'RESIDENT', 'SHARED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MaintenanceStatus" ADD VALUE 'INSPECTION_REQUIRED';
ALTER TYPE "MaintenanceStatus" ADD VALUE 'QUOTED';
ALTER TYPE "MaintenanceStatus" ADD VALUE 'APPROVED';

-- AlterTable
ALTER TABLE "MaintenanceRequest" DROP COLUMN "assignedTo",
ADD COLUMN     "assignedProviderId" TEXT,
ADD COLUMN     "category" "MaintenanceCategory",
ADD COLUMN     "estimatedCost" DOUBLE PRECISION,
ADD COLUMN     "inspectionScheduledAt" TIMESTAMP(3),
ADD COLUMN     "paymentResponsibility" "MaintenancePaymentResponsibility",
ADD COLUMN     "requiresInspection" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "workCompletedAt" TIMESTAMP(3),
ADD COLUMN     "workScheduledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ServiceProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "type" "ServiceProviderType" NOT NULL,
    "rating" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenancePhoto" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenancePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceQuote" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceQuoteItem" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MaintenanceQuoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceProvider_phone_key" ON "ServiceProvider"("phone");

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_assignedProviderId_fkey" FOREIGN KEY ("assignedProviderId") REFERENCES "ServiceProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenancePhoto" ADD CONSTRAINT "MaintenancePhoto_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MaintenanceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceQuote" ADD CONSTRAINT "MaintenanceQuote_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MaintenanceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceQuote" ADD CONSTRAINT "MaintenanceQuote_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ServiceProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceQuoteItem" ADD CONSTRAINT "MaintenanceQuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "MaintenanceQuote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
