/*
  Warnings:

  - A unique constraint covering the columns `[rentContractId,period,kind]` on the table `RentInvoice` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "InvoiceKind" AS ENUM ('RENT', 'GARBAGE', 'SERVICE_CHARGE');

-- DropIndex
DROP INDEX "RentInvoice_rentContractId_period_key";

-- AlterTable
ALTER TABLE "RentInvoice" ADD COLUMN     "kind" "InvoiceKind" NOT NULL DEFAULT 'RENT';

-- CreateIndex
CREATE INDEX "RentInvoice_residentId_kind_status_dueDate_idx" ON "RentInvoice"("residentId", "kind", "status", "dueDate");

-- CreateIndex
CREATE INDEX "RentInvoice_unitId_kind_idx" ON "RentInvoice"("unitId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "RentInvoice_rentContractId_period_kind_key" ON "RentInvoice"("rentContractId", "period", "kind");
