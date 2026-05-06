/*
  Warnings:

  - You are about to drop the column `type` on the `LedgerEntry` table. All the data in the column will be lost.
  - Added the required column `source` to the `LedgerEntry` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LedgerSource" AS ENUM ('RENT_INVOICE', 'RENT_PAYMENT', 'PAYOUT', 'REFUND', 'REVERSAL', 'PLATFORM_FEE');

-- AlterTable
ALTER TABLE "LedgerEntry" DROP COLUMN "type",
ADD COLUMN     "source" "LedgerSource" NOT NULL;

-- DropEnum
DROP TYPE "AccountType";

-- DropEnum
DROP TYPE "LedgerDirection";

-- DropEnum
DROP TYPE "LedgerEntryType";
