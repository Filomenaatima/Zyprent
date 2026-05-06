-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentChannel" ADD VALUE 'WALLET';
ALTER TYPE "PaymentChannel" ADD VALUE 'CASH';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentProvider" ADD VALUE 'WALLET';
ALTER TYPE "PaymentProvider" ADD VALUE 'BANK';
ALTER TYPE "PaymentProvider" ADD VALUE 'CASH';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WalletTransactionType" ADD VALUE 'EXPENSE_PAYMENT';
ALTER TYPE "WalletTransactionType" ADD VALUE 'MAINTENANCE_PAYMENT';

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "paidByUserId" TEXT,
ADD COLUMN     "paymentChannel" "PaymentChannel",
ADD COLUMN     "paymentProvider" "PaymentProvider";

-- AlterTable
ALTER TABLE "MaintenanceRequest" ADD COLUMN     "paymentChannel" "PaymentChannel",
ADD COLUMN     "paymentProvider" "PaymentProvider";

-- AlterTable
ALTER TABLE "ProviderPayout" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentChannel" "PaymentChannel",
ADD COLUMN     "paymentProvider" "PaymentProvider",
ADD COLUMN     "paymentReference" TEXT;

-- CreateIndex
CREATE INDEX "Expense_paidByUserId_idx" ON "Expense"("paidByUserId");

-- CreateIndex
CREATE INDEX "Expense_paymentChannel_idx" ON "Expense"("paymentChannel");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_paidByUserId_idx" ON "MaintenanceRequest"("paidByUserId");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_paymentChannel_idx" ON "MaintenanceRequest"("paymentChannel");

-- CreateIndex
CREATE INDEX "ProviderPayout_status_idx" ON "ProviderPayout"("status");

-- CreateIndex
CREATE INDEX "ProviderPayout_paymentChannel_idx" ON "ProviderPayout"("paymentChannel");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_paidByUserId_fkey" FOREIGN KEY ("paidByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
