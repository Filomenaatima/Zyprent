/*
  Warnings:

  - You are about to drop the column `name` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `LedgerEntry` table. All the data in the column will be lost.
  - You are about to drop the column `direction` on the `LedgerEntry` table. All the data in the column will be lost.
  - You are about to drop the column `invoiceId` on the `LedgerEntry` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `LedgerEntry` table. All the data in the column will be lost.
  - Added the required column `type` to the `LedgerEntry` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('PAYMENT', 'REFUND', 'PAYOUT', 'FEE', 'REVERSAL');

-- DropForeignKey
ALTER TABLE "LedgerEntry" DROP CONSTRAINT "LedgerEntry_invoiceId_fkey";

-- DropIndex
DROP INDEX "LedgerEntry_invoiceId_idx";

-- DropIndex
DROP INDEX "LedgerEntry_paymentId_idx";

-- DropIndex
DROP INDEX "LedgerEntry_payoutId_idx";

-- DropIndex
DROP INDEX "LedgerEntry_propertyId_idx";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "name",
DROP COLUMN "type",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "LedgerEntry" DROP COLUMN "amount",
DROP COLUMN "direction",
DROP COLUMN "invoiceId",
DROP COLUMN "note",
ADD COLUMN     "credit" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "debit" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "reference" TEXT,
ADD COLUMN     "rentInvoiceId" TEXT,
ADD COLUMN     "type" "LedgerEntryType" NOT NULL;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_rentInvoiceId_fkey" FOREIGN KEY ("rentInvoiceId") REFERENCES "RentInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
