/*
  Warnings:

  - The values [PAYOUT,MOVE_OUT_FEE] on the enum `LedgerSource` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "LedgerSource_new" AS ENUM ('RENT_INVOICE', 'RENT_PAYMENT', 'INVESTMENT', 'PROFIT_DISTRIBUTION', 'MAINTENANCE_PAYMENT', 'PROVIDER_PAYOUT', 'WITHDRAWAL', 'EXTERNAL_FUNDING', 'PLATFORM_FEE', 'REFUND');
ALTER TABLE "LedgerEntry" ALTER COLUMN "source" TYPE "LedgerSource_new" USING ("source"::text::"LedgerSource_new");
ALTER TYPE "LedgerSource" RENAME TO "LedgerSource_old";
ALTER TYPE "LedgerSource_new" RENAME TO "LedgerSource";
DROP TYPE "LedgerSource_old";
COMMIT;
