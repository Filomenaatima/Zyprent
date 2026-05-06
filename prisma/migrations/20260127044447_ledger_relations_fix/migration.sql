-- CreateEnum
CREATE TYPE "LedgerReferenceType" AS ENUM ('PAYMENT', 'PAYOUT', 'ADJUSTMENT', 'SYSTEM');

-- AlterTable
ALTER TABLE "LedgerEntry" ADD COLUMN     "payoutId" TEXT,
ADD COLUMN     "propertyId" TEXT;

-- AlterTable
ALTER TABLE "Payout" ALTER COLUMN "narration" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "LedgerEntry_invoiceId_idx" ON "LedgerEntry"("invoiceId");

-- CreateIndex
CREATE INDEX "LedgerEntry_paymentId_idx" ON "LedgerEntry"("paymentId");

-- CreateIndex
CREATE INDEX "LedgerEntry_payoutId_idx" ON "LedgerEntry"("payoutId");

-- CreateIndex
CREATE INDEX "LedgerEntry_propertyId_idx" ON "LedgerEntry"("propertyId");

-- RenameForeignKey
ALTER TABLE "LedgerEntry" RENAME CONSTRAINT "LedgerEntry_invoiceId_fkey" TO "ledger_invoice_fkey";

-- RenameForeignKey
ALTER TABLE "LedgerEntry" RENAME CONSTRAINT "LedgerEntry_paymentId_fkey" TO "ledger_payment_fkey";

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "ledger_payout_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "ledger_property_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
