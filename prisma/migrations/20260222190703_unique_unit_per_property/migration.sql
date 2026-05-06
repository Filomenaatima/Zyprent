/*
  Warnings:

  - The values [REVERSAL] on the enum `LedgerSource` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[propertyId,number]` on the table `Unit` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "LedgerSource_new" AS ENUM ('RENT_INVOICE', 'RENT_PAYMENT', 'PAYOUT', 'REFUND', 'PLATFORM_FEE', 'MOVE_OUT_FEE');
ALTER TABLE "LedgerEntry" ALTER COLUMN "source" TYPE "LedgerSource_new" USING ("source"::text::"LedgerSource_new");
ALTER TYPE "LedgerSource" RENAME TO "LedgerSource_old";
ALTER TYPE "LedgerSource_new" RENAME TO "LedgerSource";
DROP TYPE "LedgerSource_old";
COMMIT;

-- AlterTable
ALTER TABLE "Unit" ALTER COLUMN "rentCycle" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Unit_propertyId_number_key" ON "Unit"("propertyId", "number");
